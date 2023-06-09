/* Imports: External */
import { Contract, Signer } from 'ethers'
import { sleep } from '@eth-optimism/core-utils'
import {
  BaseServiceV2,
  validators,
  Gauge,
  Counter,
} from '@eth-optimism/common-ts'
import {
  CrossChainMessenger,
  DeepPartial,
  DEFAULT_L2_CONTRACT_ADDRESSES,
  MessageStatus,
  OEContractsLike,
  CrossChainMessage,
  MessageDirection,
} from '@eth-optimism/sdk'
import {
  Provider,
  BlockWithTransactions,
} from '@ethersproject/abstract-provider'

import Multicall2 from './contracts/Multicall2.json'

type MessageRelayerOptions = {
  l1RpcProvider: Provider
  l2RpcProvider: Provider
  l1Wallet: Signer
  fromL2TransactionIndex?: number
  addressManager?: string
  l1CrossDomainMessenger?: string
  l1StandardBridge?: string
  stateCommitmentChain?: string
  canonicalTransactionChain?: string
  bondManager?: string
  isMulticall?: string
  pollInterval?: number
  receiptTimeout?: number
  gasMultiplier?: number
}

type MessageRelayerMetrics = {
  highestCheckedL2Tx: Gauge
  highestKnownL2Tx: Gauge
  numRelayedMessages: Counter
}

type MessageRelayerState = {
  wallet: Signer
  messenger: CrossChainMessenger
  multicall2Contract?: Contract
  highestCheckedL2Tx: number
  highestKnownL2Tx: number
}

type Call = {
  target: string
  callData: string
}

export class MessageRelayerService extends BaseServiceV2<
  MessageRelayerOptions,
  MessageRelayerMetrics,
  MessageRelayerState
> {
  constructor(options?: Partial<MessageRelayerOptions>) {
    super({
      name: 'Message_Relayer',
      options,
      optionsSpec: {
        l1RpcProvider: {
          validator: validators.provider,
          desc: 'Provider for interacting with L1.',
        },
        l2RpcProvider: {
          validator: validators.provider,
          desc: 'Provider for interacting with L2.',
        },
        l1Wallet: {
          validator: validators.wallet,
          desc: 'Wallet used to interact with L1.',
        },
        fromL2TransactionIndex: {
          validator: validators.num,
          desc: 'Index of the first L2 transaction to start processing from.',
          default: 0,
        },
        addressManager: {
          validator: validators.str,
          desc: 'Address of the Lib_AddressManager on Layer1.',
        },
        l1CrossDomainMessenger: {
          validator: validators.str,
          desc: 'Address of the Proxy__OVM_L1CrossDomainMessenger on Layer1.',
        },
        l1StandardBridge: {
          validator: validators.str,
          desc: 'Address of the Proxy__OVM_L1StandardBridge on Layer1.',
        },
        stateCommitmentChain: {
          validator: validators.str,
          desc: 'Address of the StateCommitmentChain on Layer1.',
        },
        canonicalTransactionChain: {
          validator: validators.str,
          desc: 'Address of the CanonicalTransactionChain on Layer1.',
        },
        bondManager: {
          validator: validators.str,
          desc: 'Address of the BondManager on Layer1.',
        },
        isMulticall: {
          validator: validators.str,
          desc: 'Whether use multicall contract when the relay.',
        },
        pollInterval: {
          validator: validators.num,
          desc: 'Polling interval of StateCommitmentChain (unit: msec).',
          default: 1000,
        },
        receiptTimeout: {
          validator: validators.num,
          desc: 'Receipt wait timeout for relay transaction (unit: msec).',
          default: 15000,
        },
        gasMultiplier: {
          validator: validators.num,
          desc: 'Gas limit multiplier.',
          default: 1.1,
        },
      },
      metricsSpec: {
        highestCheckedL2Tx: {
          type: Gauge,
          desc: 'Highest L2 tx that has been scanned for messages',
        },
        highestKnownL2Tx: {
          type: Gauge,
          desc: 'Highest known L2 transaction',
        },
        numRelayedMessages: {
          type: Counter,
          desc: 'Number of messages relayed by the service',
        },
      },
    })
  }

  protected async init(): Promise<void> {
    this.state.wallet = this.options.l1Wallet.connect(
      this.options.l1RpcProvider
    )

    const l1ContractOpts = [
      this.options.addressManager,
      this.options.l1CrossDomainMessenger,
      this.options.l1StandardBridge,
      this.options.stateCommitmentChain,
      this.options.canonicalTransactionChain,
      this.options.bondManager,
    ]

    let contracts: DeepPartial<OEContractsLike> = undefined
    if (l1ContractOpts.every((x) => x)) {
      contracts = {
        l1: {
          AddressManager: this.options.addressManager,
          L1CrossDomainMessenger: this.options.l1CrossDomainMessenger,
          L1StandardBridge: this.options.l1StandardBridge,
          StateCommitmentChain: this.options.stateCommitmentChain,
          CanonicalTransactionChain: this.options.canonicalTransactionChain,
          BondManager: this.options.bondManager,
        },
        l2: DEFAULT_L2_CONTRACT_ADDRESSES,
      }
    } else if (l1ContractOpts.some((x) => x)) {
      throw new Error('L1 contract address is missing.')
    }

    const l1Network = await this.state.wallet.provider.getNetwork()
    const l1ChainId = l1Network.chainId
    this.state.messenger = new CrossChainMessenger({
      l1SignerOrProvider: this.state.wallet,
      l2SignerOrProvider: this.options.l2RpcProvider,
      l1ChainId,
      contracts,
    })

    if (this.options.isMulticall) {
      const multicall2ContractAddress =
        '0x5200000000000000000000000000000000000022'
      this.state.multicall2Contract = new Contract(
        multicall2ContractAddress,
        Multicall2.abi,
        this.state.wallet
      )
    }

    this.state.highestCheckedL2Tx = this.options.fromL2TransactionIndex || 1
    this.state.highestKnownL2Tx =
      await this.state.messenger.l2Provider.getBlockNumber()
  }

  protected async estimateGas(message: CrossChainMessage): Promise<number> {
    const gas = await this.state.messenger.estimateGas.finalizeMessage(message)
    return ~~(gas.toNumber() * (this.options.gasMultiplier || 1.0))
  }

  protected async main(): Promise<void> {
    if (this.state.multicall2Contract && this.options.l1CrossDomainMessenger) {
      await this.handleMultipleBlock()
    } else {
      await this.handleSingleBlock()
    }
  }

  protected async handleSingleBlock(): Promise<void> {
    // Update metrics
    this.metrics.highestCheckedL2Tx.set(this.state.highestCheckedL2Tx)
    this.metrics.highestKnownL2Tx.set(this.state.highestKnownL2Tx)

    // If we're already at the tip, then update the latest tip and loop again.
    if (this.state.highestCheckedL2Tx > this.state.highestKnownL2Tx) {
      this.state.highestKnownL2Tx =
        await this.state.messenger.l2Provider.getBlockNumber()

      // Sleeping for 1000ms is good enough since this is meant for development and not for live
      // networks where we might want to restrict the number of requests per second.
      await sleep(1000)
      return
    }

    this.logger.info(`checking L2 block ${this.state.highestCheckedL2Tx}`)

    const block =
      await this.state.messenger.l2Provider.getBlockWithTransactions(
        this.state.highestCheckedL2Tx
      )

    // Should never happen.
    if (block.transactions.length !== 1) {
      throw new Error(
        `got an unexpected number of transactions in block: ${block.number}`
      )
    }

    const messages = await this.state.messenger.getMessagesByTransaction(
      block.transactions[0].hash
    )

    // No messages in this transaction so we can move on to the next one.
    if (messages.length === 0) {
      this.state.highestCheckedL2Tx++
      return
    }

    // Make sure that all messages sent within the transaction are finalized. If any messages
    // are not finalized, then we're going to break the loop which will trigger the sleep and
    // wait for a few seconds before we check again to see if this transaction is finalized.
    let isFinalized = true
    for (const message of messages) {
      const status = await this.state.messenger.getMessageStatus(message)
      if (status === MessageStatus.STATE_ROOT_NOT_PUBLISHED) {
        isFinalized = false
      } else if (status === MessageStatus.IN_CHALLENGE_PERIOD) {
        // Checks whether a given batch has exceeded the verification threshold,
        // or is still inside its fraud proof window.
        const resolved = await this.state.messenger.toCrossChainMessage(message)
        const stateRoot = await this.state.messenger.getMessageStateRoot(
          resolved
        )
        isFinalized =
          (await this.state.messenger.contracts.l1.StateCommitmentChain.insideFraudProofWindow(
            stateRoot.batch.header
          )) === false
      }
    }

    if (!isFinalized) {
      this.logger.info(
        `tx not yet finalized, waiting: ${this.state.highestCheckedL2Tx}`
      )
      await new Promise((resolve) =>
        setTimeout(() => resolve(true), this.options.pollInterval || 1000)
      )
      return
    } else {
      this.logger.info(
        `tx is finalized, relaying: ${this.state.highestCheckedL2Tx}`
      )
    }

    // If we got here then all messages in the transaction are finalized. Now we can relay
    // each message to L1.
    for (const message of messages) {
      try {
        const tx = await this.state.messenger.finalizeMessage(message, {
          overrides: { gasLimit: await this.estimateGas(message) },
        })
        this.logger.info(`relayer sent tx: ${tx.hash}`)
        this.metrics.numRelayedMessages.inc()
      } catch (err) {
        if (err.message.includes('message has already been received')) {
          // It's fine, the message was relayed by someone else
        } else {
          throw err
        }
      }

      await this.state.messenger.waitForMessageReceipt(message, {
        pollIntervalMs: this.options.pollInterval,
        timeoutMs: this.options.receiptTimeout,
      })
    }

    // All messages have been relayed so we can move on to the next block.
    this.state.highestCheckedL2Tx++
  }

  protected async handleMultipleBlock(): Promise<void> {
    // Should never happen.
    if (
      !this.state.multicall2Contract ||
      !this.options.l1CrossDomainMessenger
    ) {
      throw new Error(
        `You can not use mulitcall to handle multiple bridge messages`
      )
    }

    // Update metrics
    this.metrics.highestCheckedL2Tx.set(this.state.highestCheckedL2Tx)
    this.metrics.highestKnownL2Tx.set(this.state.highestKnownL2Tx)

    this.logger.info(
      `this.state.highestCheckedL2Tx is ${this.state.highestCheckedL2Tx}`
    )
    this.logger.info(
      `this.state.highestKnownL2Tx is ${this.state.highestKnownL2Tx}`
    )
    // If we're already at the tip, then update the latest tip and loop again.
    if (this.state.highestCheckedL2Tx > this.state.highestKnownL2Tx) {
      this.state.highestKnownL2Tx =
        await this.state.messenger.l2Provider.getBlockNumber()

      // Sleeping for 1000ms is good enough since this is meant for development and not for live
      // networks where we might want to restrict the number of requests per second.
      await sleep(1000)
      this.logger.info(
        `this.state.highestCheckedL2Tx(${this.state.highestCheckedL2Tx}) > this.state.highestKnownL2Tx(${this.state.highestKnownL2Tx})`
      )
      return
    }

    const blocks: BlockWithTransactions[] = []
    for (
      let i = this.state.highestCheckedL2Tx;
      i < this.state.highestCheckedL2Tx + 10;
      i++
    ) {
      const block =
        await this.state.messenger.l2Provider.getBlockWithTransactions(i)
      if (block === null) {
        break
      }
      blocks.push(block)
    }

    const highestCheckableL2Tx =
      blocks.length === 0
        ? this.state.highestCheckedL2Tx
        : this.state.highestCheckedL2Tx + blocks.length - 1
    this.logger.info(
      `checking L2 block ${this.state.highestCheckedL2Tx} ~ ${highestCheckableL2Tx}`
    )

    let allBridgeTxMessages: CrossChainMessage[] = []

    for (const block of blocks) {
      // Should never happen.
      if (block.transactions.length !== 1) {
        throw new Error(
          `got an unexpected number of transactions in block: ${block.number}`
        )
      }

      const messages = await this.state.messenger.getMessagesByTransaction(
        block.transactions[0].hash,
        { direction: MessageDirection.L2_TO_L1 }
      )

      if (messages.length !== 0) {
        allBridgeTxMessages = [...allBridgeTxMessages, ...messages];
      }
    }

    // No messages in this blocks transactions so we can move on to the next one.
    if (allBridgeTxMessages.length === 0) {
      this.state.highestCheckedL2Tx += blocks.length
      this.logger.info(`early return at blocks.length is ${blocks.length}`)
      return
    }

    // Make sure that all messages sent within the transaction are finalized. If any messages
    // are not finalized, then we're going to break the loop which will trigger the sleep and
    // wait for a few seconds before we check again to see if this transaction is finalized.
    let isFinalized = true
    for (const message of allBridgeTxMessages) {
      const status = await this.state.messenger.getMessageStatus(message)
      if (status === MessageStatus.STATE_ROOT_NOT_PUBLISHED) {
        isFinalized = false
        break
      } else if (status === MessageStatus.IN_CHALLENGE_PERIOD) {
        // Checks whether a given batch has exceeded the verification threshold,
        // or is still inside its fraud proof window.
        const resolved = await this.state.messenger.toCrossChainMessage(message)
        const stateRoot = await this.state.messenger.getMessageStateRoot(
          resolved
        )
        isFinalized =
          (await this.state.messenger.contracts.l1.StateCommitmentChain.insideFraudProofWindow(
            stateRoot.batch.header
          )) === false
        if (!isFinalized) {
          break
        }
      }
    }

    if (!isFinalized) {
      this.logger.info(
        `txs not yet finalized, waiting: ${this.state.highestCheckedL2Tx} ~ ${highestCheckableL2Tx}`
      )
      await new Promise((resolve) =>
        setTimeout(() => resolve(true), this.options.pollInterval || 1000)
      )
      return
    } else {
      this.logger.info(
        `txs are finalized, relaying: ${this.state.highestCheckedL2Tx} ~ ${highestCheckableL2Tx}`
      )
    }

    // If we got here then all messages in the transaction are finalized. Now we can relay
    // each message to L1.
    const calldataArray: Call[] = []
    for (const message of allBridgeTxMessages) {
      const finalizeMessageCalldata =
        await this.state.messenger.getFinalizeMessageCalldata(message)
      calldataArray.push({
        target: this.options.l1CrossDomainMessenger,
        callData: finalizeMessageCalldata,
      })
    }
    const tx = await this.state.multicall2Contract.aggregate(calldataArray)
    await tx.wait()
    this.logger.info(`relayer sent multicall: ${tx.hash}`)
    this.metrics.numRelayedMessages.inc(allBridgeTxMessages.length)

    // All messages have been relayed so we can move on to the next block.
    this.state.highestCheckedL2Tx += blocks.length
  }
}

if (require.main === module) {
  const service = new MessageRelayerService()
  service.run()
}
