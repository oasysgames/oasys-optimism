import { ethers, network } from 'hardhat'
import { ContractFactory, Contract } from 'ethers'
import { SignerWithAddress as Account } from '@nomiclabs/hardhat-ethers/signers'
import { toWei } from 'web3-utils'
import { expect } from 'chai'

const requiredAmount = toWei('100')
const lockedBlock = 10

describe('L1BuildDeposit', () => {
  let accounts: Account[]
  let deployer: Account
  let agent: Account
  let builder: Account
  let depositer1: Account
  let depositer2: Account

  let allowlistFactory: ContractFactory
  let l1BuildDepositFactory: ContractFactory

  let allowlist: Contract
  let l1BuildDeposit: Contract

  before(async () => {
    accounts = await ethers.getSigners()
    deployer = accounts[1]
    agent = accounts[2]
    builder = accounts[3]
    depositer1 = accounts[4]
    depositer2 = accounts[5]

    allowlistFactory = await ethers.getContractFactory('Allowlist')
    l1BuildDepositFactory = await ethers.getContractFactory('L1BuildDeposit')
  })

  beforeEach(async () => {
    await network.provider.send('hardhat_reset')

    allowlist = await allowlistFactory.connect(deployer).deploy()
    await allowlist.connect(deployer).addAddress(builder.address)

    l1BuildDeposit = await l1BuildDepositFactory
      .connect(deployer)
      .deploy(requiredAmount, lockedBlock, allowlist.address)
    await network.provider.send('hardhat_setStorageAt', [
      l1BuildDeposit.address,
      '0x3',
      ethers.utils.hexZeroPad(agent.address, 32),
    ])
  })

  describe('deposit()', () => {
    it('normally', async () => {
      const tx = await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
      await expect(tx).to.emit(l1BuildDeposit, 'Deposit').withArgs(builder.address, depositer1.address, requiredAmount)
    })

    it('builder not allowed', async () => {
      const tx = l1BuildDeposit.connect(depositer1).deposit(depositer1.address, { value: requiredAmount })
      await expect(tx).be.revertedWith('builder not allowed')
    })

    it('over deposit amount', async () => {
      const tx = l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: toWei('999') })
      await expect(tx).be.revertedWith('over deposit amount')
    })
  })

  describe('withdraw()', () => {
    it('normally', async () => {
      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
      await l1BuildDeposit.connect(agent).build(builder.address)
      await network.provider.send('hardhat_mine', ['0x' + lockedBlock.toString(16)])

      const tx = await l1BuildDeposit.connect(depositer1).withdraw(builder.address, requiredAmount)
      await expect(tx)
        .to.emit(l1BuildDeposit, 'Withdrawal')
        .withArgs(builder.address, depositer1.address, requiredAmount)
      expect(await depositer1.getBalance()).to.gte(toWei('9999'))
    })

    it('while OAS locked', async () => {
      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
      await l1BuildDeposit.connect(agent).build(builder.address)
      await network.provider.send('hardhat_mine', ['0x' + (lockedBlock - 1).toString(16)])

      const tx = l1BuildDeposit.connect(depositer1).withdraw(builder.address, requiredAmount)
      await expect(tx).to.be.revertedWith('while OAS locked')
    })

    it('immediate withdraw if not built', async () => {
      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
      await l1BuildDeposit.connect(depositer1).withdraw(builder.address, requiredAmount)
      expect(await depositer1.getBalance()).to.gte(toWei('9999'))
    })

    it('deposit amount shortage', async () => {
      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
      await l1BuildDeposit.connect(agent).build(builder.address)
      await network.provider.send('hardhat_mine', ['0x' + lockedBlock.toString(16)])

      const tx = l1BuildDeposit.connect(depositer1).withdraw(builder.address, toWei('999'))
      await expect(tx).to.be.revertedWith('your deposit amount shortage')
    })
  })

  describe('build()', () => {
    it('normally', async () => {
      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
      const tx = await l1BuildDeposit.connect(agent).build(builder.address)
      await expect(tx).to.emit(l1BuildDeposit, 'Build').withArgs(builder.address, 5)
    })

    it('call from non-agent', async () => {
      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
      const tx = l1BuildDeposit.connect(depositer1).build(builder.address)
      await expect(tx).to.be.revertedWith('only L1BuildAgent can call me')
    })

    it('deposit amount shortage', async () => {
      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: toWei('1') })
      const tx = l1BuildDeposit.connect(agent).build(builder.address)
      await expect(tx).to.be.revertedWith('deposit amount shortage')
    })

    it('already built', async () => {
      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
      await l1BuildDeposit.connect(agent).build(builder.address)
      const tx = l1BuildDeposit.connect(agent).build(builder.address)
      await expect(tx).to.be.revertedWith('already built by builder')
    })
  })

  it('getDepositTotal()', async () => {
    await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: toWei('10') })
    await l1BuildDeposit.connect(depositer2).deposit(builder.address, { value: toWei('20') })
    expect(await l1BuildDeposit.getDepositTotal(builder.address)).to.equal(toWei('30'))
  })

  it('getDepositAmount()', async () => {
    await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: toWei('10') })
    expect(await l1BuildDeposit.getDepositAmount(builder.address, depositer1.address)).to.equal(toWei('10'))
  })

  it('getBuildBlock()', async () => {
    await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
    await l1BuildDeposit.connect(agent).build(builder.address)
    expect(await l1BuildDeposit.getBuildBlock(builder.address)).to.equal(5)
  })
})
