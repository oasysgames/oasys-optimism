import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { toWei } from 'web3-utils'

const DeployVerseBuilder = async (deployer: SignerWithAddress) => {
  const erc20Factory = await ethers.getContractFactory('TestERC20')
  const allowlistFactory = await ethers.getContractFactory('Allowlist')
  const l1BuildDepositFactory = await ethers.getContractFactory(
    'L1BuildDeposit'
  )
  const l1BuildAgentFactory = await ethers.getContractFactory('L1BuildAgent')
  const l1BuildParamFactory = await ethers.getContractFactory('L1BuildParam')
  const l1BuildStep1Factory = await ethers.getContractFactory('L1BuildStep1')
  const l1BuildStep2Factory = await ethers.getContractFactory('L1BuildStep2')
  const l1BuildStep3Factory = await ethers.getContractFactory('L1BuildStep3')
  const l1BuildStep4Factory = await ethers.getContractFactory('L1BuildStep4')

  const erc20 = await erc20Factory.connect(deployer).deploy()
  const allowlist = await allowlistFactory.connect(deployer).deploy()

  const l1BuildStep1 = await l1BuildStep1Factory.connect(deployer).deploy()
  const l1BuildStep2 = await l1BuildStep2Factory.connect(deployer).deploy()
  const l1BuildStep3 = await l1BuildStep3Factory.connect(deployer).deploy()
  const l1BuildStep4 = await l1BuildStep4Factory.connect(deployer).deploy()

  const l1BuildParam = await l1BuildParamFactory
    .connect(deployer)
    .deploy(15_000_000, 32, 60_000, 604_800, 12_592_000)

  const l1BuildDeposit = await l1BuildDepositFactory
    .connect(deployer)
    .deploy(toWei('100'), 10, allowlist.address, [erc20.address])

  const l1BuildAgent = await l1BuildAgentFactory
    .connect(deployer)
    .deploy(
      l1BuildParam.address,
      l1BuildDeposit.address,
      l1BuildStep1.address,
      l1BuildStep2.address,
      l1BuildStep3.address,
      l1BuildStep4.address
    )

  return {
    erc20,
    allowlist,
    l1BuildAgent,
    l1BuildDeposit,
    l1BuildParam,
    l1BuildStep1,
    l1BuildStep2,
    l1BuildStep3,
    l1BuildStep4,
  }
}

export { DeployVerseBuilder }
