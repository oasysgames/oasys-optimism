/* Imports: External */
import path from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'
import { ethers, utils } from 'ethers'
import { task, subtask } from 'hardhat/config'
import * as types from 'hardhat/internal/core/params/argumentTypes'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const stdout = process.stdout
const outdir = path.resolve(__dirname, '../oasys')
const addressesPath = path.join(outdir, 'addresses.json')
const genesisPath = path.join(outdir, 'genesis.json')
const descriptions = {
  builder: 'Address of the Verse-Layer(L2) builder.',
  amount: 'Deposit amount (in Wei).',
  chainid: 'Chain id of Verse-Layer(L2).',
  sequencer: 'Address of the OVM Sequencer.',
  proposer: 'Address of the OVM Proposer.',
  blockSigner: 'The block signer address.',
  feeWallet: 'The L1 fee wallet address.',
  gpoOwner: 'Address of the GasPriceOracle owner.',
  whitelistOwner: 'Address of OVM Whitelist owner.',
}

const getL1BuildDeposit = async (hre: HardhatRuntimeEnvironment) =>
  (await hre.ethers.getContractFactory('L1BuildDeposit')).attach(
    '0x5200000000000000000000000000000000000006'
  )

const getL1BuildAgent = async (hre: HardhatRuntimeEnvironment) =>
  (await hre.ethers.getContractFactory('L1BuildAgent')).attach(
    '0x5200000000000000000000000000000000000007'
  )

const getNamedAddresses = async (
  hre: HardhatRuntimeEnvironment,
  chainId: number
): Promise<{ [key: string]: string }> => {
  const L1BuildAgent = await getL1BuildAgent(hre)

  const dump: { [key: string]: string } = {
    Lib_AddressManager: await L1BuildAgent.getAddressManager(chainId),
  }

  const [names, addresses] = await L1BuildAgent.getNamedAddresses(chainId)
  names.forEach((name, i) => {
    dump[name] = addresses[i]
  })

  return dump
}

const validateAddress = (address: string, name: string) => {
  if (!utils.isAddress(address)) {
    throw new Error(`${name} address is invalid.`)
  }
}

const validateSequencerAndProposer = (sequencer: string, proposer: string) => {
  validateAddress(sequencer, 'Sequencer')
  validateAddress(proposer, 'Proposer')
  if (sequencer === proposer) {
    throw new Error(
      'Sequencer and proposer have the same address, multiple transactions may be sent with the same nonce.'
    )
  }
}

task('verse:deposit', 'Deposits the OAS token for the Verse-Builder')
  .addParam('builder', descriptions.builder, undefined, types.string)
  .addParam('amount', descriptions.amount, undefined, types.string)
  .setAction(async ({ builder, amount }, hre) => {
    validateAddress(builder, 'Builder')

    const L1BuildDeposit = await getL1BuildDeposit(hre)

    let tx = await L1BuildDeposit.deposit(builder, {
      value: amount,
    })
    stdout.write(`depositing (tx: ${tx.hash})...`)

    const receipt = await tx.wait()
    stdout.write(`: success with ${receipt.gasUsed} gas\n`)
  })

task(
  'verse:build',
  'Deploys the contracts needed to build Verse-Layer(L2) on Hub-Layer(L1)'
)
  .addParam('chainId', descriptions.chainid, undefined, types.int)
  .addParam('sequencer', descriptions.sequencer, undefined, types.string)
  .addParam('proposer', descriptions.proposer, undefined, types.string)
  .addParam('blockSigner', descriptions.blockSigner, undefined, types.string)
  .addParam('feeWallet', descriptions.feeWallet, undefined, types.string)
  .addParam('gpoOwner', descriptions.gpoOwner, undefined, types.string)
  .addOptionalParam(
    'whitelistOwner',
    descriptions.whitelistOwner,
    ethers.constants.AddressZero,
    types.string
  )
  .setAction(
    async (
      {
        chainId,
        sequencer,
        proposer,
        blockSigner,
        feeWallet,
        gpoOwner,
        whitelistOwner,
      },
      hre
    ) => {
      validateSequencerAndProposer(sequencer, proposer)

      const [builder] = await hre.ethers.getSigners()
      const L1BuildDeposit = await getL1BuildDeposit(hre)

      if (
        (await L1BuildDeposit.getBuildBlock(builder.address)).toString() === '0'
      ) {
        const L1BuildAgent = await getL1BuildAgent(hre)
        const tx = await L1BuildAgent.build(chainId, sequencer, proposer)
        stdout.write(`building (tx: ${tx.hash})...`)

        const receipt = await tx.wait()
        stdout.write(`: success with ${receipt.gasUsed} gas\n`)
      } else {
        console.log('already built')
      }

      await hre.run('verse:addresses', { chainId })
      await hre.run('verse:genesis', {
        chainId,
        sequencer,
        proposer,
        blockSigner,
        feeWallet,
        gpoOwner,
        whitelistOwner,
      })
    }
  )

/**
 * Create contract address list for Hub-Layer(L1) contracts.
 */
subtask('verse:addresses')
  .addParam('chainId', descriptions.chainid, undefined, types.int)
  .setAction(async ({ chainId }, hre) => {
    mkdirp.sync(outdir)

    fs.writeFileSync(
      addressesPath,
      JSON.stringify(await getNamedAddresses(hre, chainId), null, 4)
    )

    console.log(`Success writing contract addresses to ./oasys/addresses.json`)
  })

/**
 * Create genesis block configuration for Verse-Layer(L2).
 */
subtask('verse:genesis')
  .addParam('chainId', descriptions.chainid, undefined, types.int)
  .addParam('sequencer', descriptions.sequencer, undefined, types.string)
  .addParam('proposer', descriptions.proposer, undefined, types.string)
  .addParam('blockSigner', descriptions.blockSigner, undefined, types.string)
  .addParam('feeWallet', descriptions.feeWallet, undefined, types.string)
  .addParam('gpoOwner', descriptions.gpoOwner, undefined, types.string)
  .addOptionalParam(
    'whitelistOwner',
    descriptions.whitelistOwner,
    ethers.constants.AddressZero,
    types.string
  )
  .setAction(
    async (
      {
        chainId,
        sequencer,
        proposer,
        blockSigner,
        feeWallet,
        gpoOwner,
        whitelistOwner,
      },
      hre
    ) => {
      validateSequencerAndProposer(sequencer, proposer)
      validateAddress(blockSigner, 'BlockSigner')
      validateAddress(feeWallet, 'FeeWallet')
      validateAddress(gpoOwner, 'GasPriceOracle owner')
      validateAddress(whitelistOwner, 'Whitelist owner')

      const config = `import { DeployConfig } from '../src/deploy-config'
const config: DeployConfig = {
  network: '${hre.network.name}',
  numDeployConfirmations: 4,
  l1BlockTimeSeconds: 15,
  l2BlockGasLimit: 15_000_000,
  l2ChainId: ${chainId},
  ctcL2GasDiscountDivisor: 32,
  ctcEnqueueGasCost: 60_000,
  sccFaultProofWindowSeconds: 604_800,
  sccSequencerPublishWindowSeconds: 12_592_000,
  ovmSequencerAddress: '${sequencer}',
  ovmProposerAddress: '${proposer}',
  ovmBlockSignerAddress: '${blockSigner}',
  ovmFeeWalletAddress: '${feeWallet}',
  ovmAddressManagerOwner: '${ethers.constants.AddressZero}',
  ovmGasPriceOracleOwner: '${gpoOwner}',
  ovmWhitelistOwner: '${whitelistOwner}',
}
export default config\n`
      fs.writeFileSync(`./deploy-config/${hre.network.name}.ts`, config)

      const dump = await getNamedAddresses(hre, chainId)

      mkdirp.sync(outdir)
      await hre.run('take-dump', {
        l1TokenBridge: dump.Proxy__OVM_L1StandardBridge,
        l1CrossDomainMessenger: dump.Proxy__OVM_L1CrossDomainMessenger,
        l1ERC721Bridge: dump.Proxy__OVM_L1ERC721Bridge,
        out: genesisPath,
      })

      console.log(
        `Success writing genesis block configuration to ./oasys/genesis.json`
      )
    }
  )
