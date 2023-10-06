/* Imports: External */
import { BigNumber, Contract, Signer } from 'ethers'
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
import { Provider } from '@ethersproject/abstract-provider'

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
  multicallGasLimit?: number
  maxBlockBatchSize?: number
  pollInterval?: number
  receiptTimeout?: number
  gasMultiplier?: number
}

type MessageRelayerMetrics = {
  highestCheckableL2Tx: Gauge
  highestKnownL2Tx: Gauge
  numRelayedMessages: Counter
}

type MessageRelayerState = {
  wallet: Signer
  messenger: CrossChainMessenger
  multicall2Contract?: Contract
  highestCheckableL2Tx: number
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
        multicallGasLimit: {
          validator: validators.num,
          desc: 'gas limit for multicall contract when the relay',
          default: 1500000,
        },
        maxBlockBatchSize: {
          validator: validators.num,
          desc: 'If using multicall, max block batch size for multicall messaging relay.',
          default: 200,
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
        highestCheckableL2Tx: {
          type: Gauge,
          desc: 'Highest L2 tx that has been checkable',
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

    this.state.highestCheckableL2Tx = this.options.fromL2TransactionIndex || 1
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
    this.metrics.highestCheckableL2Tx.set(this.state.highestCheckableL2Tx)
    this.metrics.highestKnownL2Tx.set(this.state.highestKnownL2Tx)

    // If we're already at the tip, then update the latest tip and loop again.
    if (this.state.highestCheckableL2Tx > this.state.highestKnownL2Tx) {
      this.state.highestKnownL2Tx =
        await this.state.messenger.l2Provider.getBlockNumber()

      // Sleeping for 1000ms is good enough since this is meant for development and not for live
      // networks where we might want to restrict the number of requests per second.
      await sleep(1000)
      return
    }

    this.logger.info(`checking L2 block ${this.state.highestCheckableL2Tx}`)

    const block =
      await this.state.messenger.l2Provider.getBlockWithTransactions(
        this.state.highestCheckableL2Tx
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
      this.state.highestCheckableL2Tx++
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
        `tx not yet finalized, waiting: ${this.state.highestCheckableL2Tx}`
      )
      await new Promise((resolve) =>
        setTimeout(() => resolve(true), this.options.pollInterval || 1000)
      )
      return
    } else {
      this.logger.info(
        `tx is finalized, relaying: ${this.state.highestCheckableL2Tx}`
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
    this.state.highestCheckableL2Tx++
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
    this.metrics.highestCheckableL2Tx.set(this.state.highestCheckableL2Tx)
    this.metrics.highestKnownL2Tx.set(this.state.highestKnownL2Tx)

    this.logger.debug(
      `this.state.highestCheckableL2Tx is ${this.state.highestCheckableL2Tx}`
    )
    this.logger.debug(
      `this.state.highestKnownL2Tx is ${this.state.highestKnownL2Tx}`
    )
    // If we're already at the tip, then update the latest tip and loop again.
    if (this.state.highestCheckableL2Tx > this.state.highestKnownL2Tx) {
      this.state.highestKnownL2Tx =
        await this.state.messenger.l2Provider.getBlockNumber()

      // Sleeping for 1000ms is good enough since this is meant for development and not for live
      // networks where we might want to restrict the number of requests per second.
      await sleep(1000)
      this.logger.debug(
        `this.state.highestCheckableL2Tx(${this.state.highestCheckableL2Tx}) > this.state.highestKnownL2Tx(${this.state.highestKnownL2Tx})`
      )
      return
    }

    let blockLength = 0
    const estimateCalldataArray: Call[] = []
    const calldataArray: Call[] = []
    const requireSuccess = true
    let multicallEstimateGas: BigNumber

    for (
      let i = this.state.highestCheckableL2Tx;
      i < this.state.highestCheckableL2Tx + this.options.maxBlockBatchSize;
      i++
    ) {
      const block =
        await this.state.messenger.l2Provider.getBlockWithTransactions(i)
      if (block === null) {
        break
      }

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

      if (messages.length === 0) {
        blockLength++
        continue
      }

      const isVerifiedMessages = await this.isVerifiedMessages(messages)
      if (!isVerifiedMessages) {
        break
      }

      const newCalldataArray: Call[] = []
      let canAddCalldata = true // whether can add calldata to calldataArray

      let newMulticallEstimateGas: BigNumber

      for (const message of messages) {
        try {
          await this.estimateGas(message) // check if error happens
        } catch (err) {
          if (err.message.includes('message has already been received')) {
            // It's fine, the message was relayed by someone else
            continue
          } else {
            throw err
          }
        }

        const finalizeMessageCalldata =
          await this.state.messenger.getFinalizeMessageCalldata(message)
        const newCalldata = {
          target: this.options.l1CrossDomainMessenger,
          callData: finalizeMessageCalldata,
        }
        estimateCalldataArray.push(newCalldata)

        try {
          newMulticallEstimateGas =
            await this.state.multicall2Contract.estimateGas.tryAggregate(
              requireSuccess,
              estimateCalldataArray
            )
        } catch (err) {
          if (err.message.includes('gas required exceeds allowance')) {
            canAddCalldata = false
            break
          } else {
            throw err
          }
        }

        if (
          this.options.multicallGasLimit &&
          newMulticallEstimateGas.toNumber() * this.options.gasMultiplier >
            this.options.multicallGasLimit
        ) {
          canAddCalldata = false
          break
        }
        newCalldataArray.push(newCalldata)
      }

      if (!canAddCalldata) {
        break
      }
      blockLength++
      multicallEstimateGas = newMulticallEstimateGas
      calldataArray.push(...newCalldataArray)
    }

    if (blockLength > 1) {
      this.logger.info(
        `checking L2 block ${this.state.highestCheckableL2Tx} ~ ${
          this.state.highestCheckableL2Tx + blockLength - 1
        }`
      )
    } else {
      this.logger.info(`checking L2 block ${this.state.highestCheckableL2Tx}`)
    }

    // No messages in this blocks transactions so we can move on to the next one.
    if (calldataArray.length === 0) {
      if (blockLength > 0) {
        this.state.highestCheckableL2Tx += blockLength
        return
      } else {
        this.logger.info(
          `txs not yet finalized, waiting: ${this.state.highestCheckableL2Tx}`
        )
        await new Promise((resolve) =>
          setTimeout(() => resolve(true), this.options.pollInterval || 1000)
        )
        return
      }
    }

    if (blockLength > 1) {
      this.logger.info(
        `txs are finalized, relaying: ${this.state.highestCheckableL2Tx} ~ ${
          this.state.highestCheckableL2Tx + blockLength - 1
        }`
      )
    } else {
      this.logger.info(
        `txs are finalized, relaying: ${this.state.highestCheckableL2Tx}`
      )
    }

    const overrideOptions = {
      gasLimit: ~~(
        multicallEstimateGas.toNumber() * (this.options.gasMultiplier || 1.0)
      ),
    }
    const tx = await this.state.multicall2Contract.tryAggregate(
      requireSuccess,
      calldataArray,
      overrideOptions
    )
    await tx.wait()
    this.logger.info(`relayer sent multicall: ${tx.hash}`)
    this.metrics.numRelayedMessages.inc(calldataArray.length)

    // All messages have been relayed so we can move on to the next block.
    this.state.highestCheckableL2Tx += blockLength
  }

  protected async isVerifiedMessages(
    messages: CrossChainMessage[]
  ): Promise<boolean> {
    let isFinalized = true
    for (const message of messages) {
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
    return isFinalized
  }
}

if (require.main === module) {
  const service = new MessageRelayerService()
  service.run()
}
