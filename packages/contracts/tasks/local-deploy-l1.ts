/* Imports: External */
import { task, subtask } from 'hardhat/config'
import { ethers } from 'ethers'

const SOAS_ADDRESS = '0x5200000000000000000000000000000000000002'

subtask('deploy:L1:VerseBuild').setAction(async (taskArgs, hre) => {
  console.log('Deploying Verse-Build Contract... ')
  const [signer] = await hre.ethers.getSigners()

  const l1BuildDepositFactory = await hre.ethers.getContractFactory(
    'L1BuildDeposit'
  )
  const l1BuildParamFactory = await hre.ethers.getContractFactory(
    'L1BuildParam'
  )
  const l1BuildStep1Factory = await hre.ethers.getContractFactory(
    'L1BuildStep1'
  )
  const l1BuildStep2Factory = await hre.ethers.getContractFactory(
    'L1BuildStep2'
  )
  const l1BuildStep3Factory = await hre.ethers.getContractFactory(
    'L1BuildStep3'
  )
  const l1BuildStep4Factory = await hre.ethers.getContractFactory(
    'L1BuildStep4'
  )
  const l1BuildAllowListFactory = await hre.ethers.getContractFactory(
    'Allowlist'
  )
  const l1BuildAgentFactory = await hre.ethers.getContractFactory(
    'L1BuildAgent'
  )

  const allowlist = await l1BuildAllowListFactory.connect(signer).deploy()
  const l1BuildStep1 = await l1BuildStep1Factory.connect(signer).deploy()
  const l1BuildStep2 = await l1BuildStep2Factory.connect(signer).deploy()
  const l1BuildStep3 = await l1BuildStep3Factory.connect(signer).deploy()
  const l1BuildStep4 = await l1BuildStep4Factory.connect(signer).deploy()

  await allowlist.addAddress(signer.address)

  const l1BuildParam = await l1BuildParamFactory
    .connect(signer)
    .deploy(15_000_000, 32, 60_000, 604_800, 12_592_000)

  const l1BuildDeposit = await l1BuildDepositFactory
    .connect(signer)
    .deploy(ethers.utils.parseEther('1'), 10, allowlist.address, [SOAS_ADDRESS])
  const l1BuildAgent = await l1BuildAgentFactory
    .connect(signer)
    .deploy(
      l1BuildParam.address,
      l1BuildDeposit.address,
      l1BuildStep1.address,
      l1BuildStep2.address,
      l1BuildStep3.address,
      l1BuildStep4.address
    )

  console.log(`L1_BUILD_ALLOW_LIST_ADDRESS is deployed to ${allowlist.address}`)
  console.log(`L1_BUILD_STEP1_ADDRESS is deployed to ${l1BuildStep1.address}`)
  console.log(`L1_BUILD_STEP2_ADDRESS is deployed to ${l1BuildStep2.address}`)
  console.log(`L1_BUILD_STEP3_ADDRESS is deployed to ${l1BuildStep3.address}`)
  console.log(`L1_BUILD_STEP4_ADDRESS is deployed to ${l1BuildStep4.address}`)
  console.log(`L1_BUILD_PARAM_ADDRESS is deployed to ${l1BuildParam.address}`)
  console.log(
    `L1_BUILD_DEPOSIT_ADDRESS is deployed to ${l1BuildDeposit.address}`
  )
  console.log(`L1_BUILD_AGENT_ADDRESS is deployed to ${l1BuildAgent.address}`)
})

subtask('deploy:L1:messaging').setAction(async (taskArgs, hre) => {
  console.log('Deploying messaging Contract... ')
  const [signer] = await hre.ethers.getSigners()

  const l1ERC721BridgeFactory = await hre.ethers.getContractFactory(
    'L1ERC721Bridge'
  )

  const l1ERC721Bridge = await l1ERC721BridgeFactory.connect(signer).deploy()

  console.log(
    `L1_ERC721_BRIDGE_ADDRESS is deployed to ${l1ERC721Bridge.address}`
  )
})

subtask('deploy:L1:rollup').setAction(async (taskArgs, hre) => {
  console.log('Deploying rollup Contract... ')
  const [signer] = await hre.ethers.getSigners()

  const oasysStateCommitmentChainVerifierFactory =
    await hre.ethers.getContractFactory('OasysStateCommitmentChainVerifier')
  const verifierInfoFactory = await hre.ethers.getContractFactory(
    'VerifierInfo'
  )

  const oasysStateCommitmentChainVerifier =
    await oasysStateCommitmentChainVerifierFactory.connect(signer).deploy()
  const verifierInfo = await verifierInfoFactory.connect(signer).deploy()

  console.log(
    `OASYS_STATE_COMMITMENT_CHAIN_VERIFIER_ADDRESS is deployed to ${oasysStateCommitmentChainVerifier.address}`
  )
  console.log(`VERIFIER_INFO_ADDRESS is deployed to ${verifierInfo.address}`)
})

subtask('deploy:L1:token').setAction(async (taskArgs, hre) => {
  console.log('Deploying token Contract... ')
  const [signer] = await hre.ethers.getSigners()

  const l1StandardERC20Factory = await hre.ethers.getContractFactory(
    'L1StandardERC20Factory'
  )
  const l1StandardERC721Factory = await hre.ethers.getContractFactory(
    'L1StandardERC721Factory'
  )

  const l1StandardERC20 = await l1StandardERC20Factory.connect(signer).deploy()
  const l1StandardERC721 = await l1StandardERC721Factory
    .connect(signer)
    .deploy()

  console.log(
    `L1_STANDARD_ERC20_FACTORY_ADDRESS is deployed to ${l1StandardERC20.address}`
  )
  console.log(
    `L1_STANDARD_ERC721_FACTORY_ADDRESS is deployed to ${l1StandardERC721.address}`
  )
})

task('deploy:L1:local').setAction(async (taskArgs, hre) => {
  await hre.run('deploy:L1:VerseBuild')
  await hre.run('deploy:L1:messaging')
  await hre.run('deploy:L1:rollup')
  await hre.run('deploy:L1:token')
})
