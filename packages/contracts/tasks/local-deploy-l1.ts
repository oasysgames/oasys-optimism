/* Imports: External */
import { task, subtask } from 'hardhat/config'
import { ethers } from 'ethers'

// Verse builder contracts
const L1_BUILD_PARAM_ADDRESS = '0x5200000000000000000000000000000000000006'
const L1_BUILD_DEPOSIT_ADDRESS = '0x5200000000000000000000000000000000000007'
const L1_BUILD_AGENT_ADDRESS = '0x5200000000000000000000000000000000000008'
const L1_BUILD_STEP1_ADDRESS = '0x5200000000000000000000000000000000000009'
const L1_BUILD_STEP2_ADDRESS = '0x520000000000000000000000000000000000000A'
const L1_BUILD_STEP3_ADDRESS = '0x520000000000000000000000000000000000000B'
const L1_BUILD_STEP4_ADDRESS = '0x520000000000000000000000000000000000000c'
const L1_BUILD_ALLOW_LIST_ADDRESS = '0x520000000000000000000000000000000000000D'

// Messaging
const L1_ERC721_BRIDGE_ADDRESS = '0x8D736Ad22D106dE9Cf50D0D18D571041a47DD333'

// Rollup
const VERIFIER_INFO_ADDRESS = '0x5200000000000000000000000000000000000003'
const OASYS_STATE_COMMITMENT_CHAIN_VERIFIER_ADDRESS =
  '0x5200000000000000000000000000000000000014'

// Token
const L1_STANDARD_ERC20_FACTORY_ADDRESS =
  '0x5200000000000000000000000000000000000004'
const L1_STANDARD_ERC721_FACTORY_ADDRESS =
  '0x5200000000000000000000000000000000000005'

const SOAS_ADDRESS = '0x5200000000000000000000000000000000000002'

subtask('deploy:L1:VerseBuild').setAction(async (taskArgs, hre) => {
  console.log('Deploying Verse-Build Contract... ')
  const [signer] = await hre.ethers.getSigners()

  const l1BuildDepositFactory = await hre.ethers.getContractFactory(
    'L1BuildDeposit'
  );
  const l1BuildParamFactory = await hre.ethers.getContractFactory(
    'L1BuildParam'
  );
  const l1BuildStep1Factory = await hre.ethers.getContractFactory(
    'L1BuildStep1'
  );
  const l1BuildStep2Factory = await hre.ethers.getContractFactory(
    'L1BuildStep2'
  );
  const l1BuildStep3Factory = await hre.ethers.getContractFactory(
    'L1BuildStep3'
  );
  const l1BuildStep4Factory = await hre.ethers.getContractFactory(
    'L1BuildStep4'
  );
  const l1BuildAllowListFactory = await hre.ethers.getContractFactory(
    'Allowlist'
  );
  const l1BuildAgentFactory = await hre.ethers.getContractFactory(
    'L1BuildAgent'
  );

  const allowlist = await l1BuildAllowListFactory.connect(signer).deploy()
  const l1BuildStep1 = await l1BuildStep1Factory.connect(signer).deploy()
  const l1BuildStep2 = await l1BuildStep2Factory.connect(signer).deploy()
  const l1BuildStep3 = await l1BuildStep3Factory.connect(signer).deploy()
  const l1BuildStep4 = await l1BuildStep4Factory.connect(signer).deploy()

  const l1BuildParam = await l1BuildParamFactory
    .connect(signer)
    .deploy(15_000_000, 32, 60_000, 604_800, 12_592_000)

  const l1BuildDeposit = await l1BuildDepositFactory
    .connect(signer)
    .deploy(ethers.utils.parseEther('100'), 10, allowlist.address, [
      SOAS_ADDRESS,
    ])
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
  const allowlistCode = await hre.network.provider.send('eth_getCode', [
    allowlist.address,
  ])
  const l1BuildStep1Code = await hre.network.provider.send('eth_getCode', [
    l1BuildStep1.address,
  ])
  const l1BuildStep2Code = await hre.network.provider.send('eth_getCode', [
    l1BuildStep2.address,
  ])
  const l1BuildStep3Code = await hre.network.provider.send('eth_getCode', [
    l1BuildStep3.address,
  ])
  const l1BuildStep4Code = await hre.network.provider.send('eth_getCode', [
    l1BuildStep4.address,
  ])
  const l1BuildParamCode = await hre.network.provider.send('eth_getCode', [
    l1BuildParam.address,
  ])
  const l1BuildDepositCode = await hre.network.provider.send('eth_getCode', [
    l1BuildDeposit.address,
  ])
  const l1BuildAgentCode = await hre.network.provider.send('eth_getCode', [
    l1BuildAgent.address,
  ])

  await hre.network.provider.send('hardhat_setCode', [
    L1_BUILD_ALLOW_LIST_ADDRESS,
    allowlistCode,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    L1_BUILD_STEP1_ADDRESS,
    l1BuildStep1Code,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    L1_BUILD_STEP2_ADDRESS,
    l1BuildStep2Code,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    L1_BUILD_STEP3_ADDRESS,
    l1BuildStep3Code,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    L1_BUILD_STEP4_ADDRESS,
    l1BuildStep4Code,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    L1_BUILD_PARAM_ADDRESS,
    l1BuildParamCode,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    L1_BUILD_DEPOSIT_ADDRESS,
    l1BuildDepositCode,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    L1_BUILD_AGENT_ADDRESS,
    l1BuildAgentCode,
  ])

  console.log(
    `L1_BUILD_ALLOW_LIST_ADDRESS is deployed to ${L1_BUILD_ALLOW_LIST_ADDRESS}`
  )
  console.log(`L1_BUILD_STEP1_ADDRESS is deployed to ${L1_BUILD_STEP1_ADDRESS}`)
  console.log(`L1_BUILD_STEP2_ADDRESS is deployed to ${L1_BUILD_STEP2_ADDRESS}`)
  console.log(`L1_BUILD_STEP3_ADDRESS is deployed to ${L1_BUILD_STEP3_ADDRESS}`)
  console.log(`L1_BUILD_STEP4_ADDRESS is deployed to ${L1_BUILD_STEP4_ADDRESS}`)
  console.log(`L1_BUILD_PARAM_ADDRESS is deployed to ${L1_BUILD_PARAM_ADDRESS}`)
  console.log(
    `L1_BUILD_DEPOSIT_ADDRESS is deployed to ${L1_BUILD_DEPOSIT_ADDRESS}`
  )
  console.log(`L1_BUILD_AGENT_ADDRESS is deployed to ${L1_BUILD_AGENT_ADDRESS}`)
})

subtask('deploy:L1:messaging').setAction(async (taskArgs, hre) => {
  console.log('Deploying messaging Contract... ')
  const [signer] = await hre.ethers.getSigners()

  const l1ERC721BridgeFactory = await hre.ethers.getContractFactory(
    'L1ERC721Bridge'
  )

  const l1ERC721Bridge = await l1ERC721BridgeFactory.connect(signer).deploy()

  const l1ERC721BridgeCode = await hre.network.provider.send('eth_getCode', [
    l1ERC721Bridge.address,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    L1_ERC721_BRIDGE_ADDRESS,
    l1ERC721BridgeCode,
  ])
  console.log(
    `L1_ERC721_BRIDGE_ADDRESS is deployed to ${L1_ERC721_BRIDGE_ADDRESS}`
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

  const oasysStateCommitmentChainVerifierCode = await hre.network.provider.send(
    'eth_getCode',
    [oasysStateCommitmentChainVerifier.address]
  )
  const verifierInfoCode = await hre.network.provider.send('eth_getCode', [
    verifierInfo.address,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    OASYS_STATE_COMMITMENT_CHAIN_VERIFIER_ADDRESS,
    oasysStateCommitmentChainVerifierCode,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    VERIFIER_INFO_ADDRESS,
    verifierInfoCode,
  ])

  console.log(
    `OASYS_STATE_COMMITMENT_CHAIN_VERIFIER_ADDRESS is deployed to ${OASYS_STATE_COMMITMENT_CHAIN_VERIFIER_ADDRESS}`
  )
  console.log(`VERIFIER_INFO_ADDRESS is deployed to ${VERIFIER_INFO_ADDRESS}`)
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

  const l1StandardERC20Code = await hre.network.provider.send('eth_getCode', [
    l1StandardERC20.address,
  ])
  const l1StandardERC721Code = await hre.network.provider.send('eth_getCode', [
    l1StandardERC721.address,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    L1_STANDARD_ERC20_FACTORY_ADDRESS,
    l1StandardERC20Code,
  ])
  await hre.network.provider.send('hardhat_setCode', [
    L1_STANDARD_ERC721_FACTORY_ADDRESS,
    l1StandardERC721Code,
  ])

  console.log(
    `L1_STANDARD_ERC20_FACTORY_ADDRESS is deployed to ${L1_STANDARD_ERC20_FACTORY_ADDRESS}`
  )
  console.log(
    `L1_STANDARD_ERC721_FACTORY_ADDRESS is deployed to ${L1_STANDARD_ERC721_FACTORY_ADDRESS}`
  )
})

task('deploy:L1:local').setAction(async (taskArgs, hre) => {
  await hre.run('deploy:L1:VerseBuild')
  await hre.run('deploy:L1:messaging')
  await hre.run('deploy:L1:rollup')
  await hre.run('deploy:L1:token')
})
