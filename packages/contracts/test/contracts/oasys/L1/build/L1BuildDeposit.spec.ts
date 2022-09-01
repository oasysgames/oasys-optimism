import { ethers, network } from 'hardhat'
import { ContractFactory, Contract } from 'ethers'
import { SignerWithAddress as Account } from '@nomiclabs/hardhat-ethers/signers'
import { toWei } from 'web3-utils'
import { expect } from 'chai'
import { ZERO_ADDRESS } from '../../../../helpers'

const requiredAmount = toWei('100')
const halfAmount = toWei('50')
const lockedBlock = 10

describe('L1BuildDeposit', () => {
  let accounts: Account[]
  let deployer: Account
  let agent: Account
  let builder: Account
  let depositer1: Account
  let depositer2: Account

  let allowlistFactory: ContractFactory
  let erc20Factory: ContractFactory
  let l1BuildDepositFactory: ContractFactory

  let allowlist: Contract
  let erc20_A: Contract
  let erc20_B: Contract
  let l1BuildDeposit: Contract

  before(async () => {
    accounts = await ethers.getSigners()
    deployer = accounts[1]
    agent = accounts[2]
    builder = accounts[3]
    depositer1 = accounts[4]
    depositer2 = accounts[5]

    allowlistFactory = await ethers.getContractFactory('Allowlist')
    erc20Factory = await ethers.getContractFactory('TestERC20')
    l1BuildDepositFactory = await ethers.getContractFactory('L1BuildDeposit')
  })

  beforeEach(async () => {
    await network.provider.send('hardhat_reset')

    allowlist = await allowlistFactory.connect(deployer).deploy()
    await allowlist.connect(deployer).addAddress(builder.address)

    erc20_A = await erc20Factory.connect(deployer).deploy()
    erc20_B = await erc20Factory.connect(deployer).deploy()

    l1BuildDeposit = await l1BuildDepositFactory
      .connect(deployer)
      .deploy(requiredAmount, lockedBlock, allowlist.address, [erc20_A.address])
    await l1BuildDeposit.connect(deployer).initialize(agent.address)
  })

  describe('deposit()', () => {
    it('normally', async () => {
      const tx = await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
      await expect(tx)
        .to.emit(l1BuildDeposit, 'Deposit')
        .withArgs(builder.address, depositer1.address, ZERO_ADDRESS, requiredAmount)
    })

    it('builder is zero address', async () => {
      const tx = l1BuildDeposit.connect(depositer1).deposit(ZERO_ADDRESS, {
        value: requiredAmount,
      })
      await expect(tx).be.revertedWith('builder is zero address')
    })

    it('amount is zero', async () => {
      const tx = l1BuildDeposit.connect(depositer1).deposit(builder.address)
      await expect(tx).be.revertedWith('amount is zero')
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

  describe('depositERC20()', () => {
    beforeEach(async () => {
      await erc20_A.connect(deployer).mint(depositer1.address, requiredAmount)
    })

    it('normally', async () => {
      await erc20_A.connect(depositer1).approve(l1BuildDeposit.address, requiredAmount)

      const tx = await l1BuildDeposit.connect(depositer1).depositERC20(builder.address, erc20_A.address, requiredAmount)
      await expect(tx)
        .to.emit(l1BuildDeposit, 'Deposit')
        .withArgs(builder.address, depositer1.address, erc20_A.address, requiredAmount)
    })

    it('builder is zero address', async () => {
      const tx = l1BuildDeposit.connect(depositer1).depositERC20(ZERO_ADDRESS, erc20_A.address, requiredAmount)
      await expect(tx).be.revertedWith('builder is zero address')
    })

    it('amount is zero', async () => {
      const tx = l1BuildDeposit.connect(depositer1).depositERC20(builder.address, erc20_A.address, 0)
      await expect(tx).be.revertedWith('amount is zero')
    })

    it('builder not allowed', async () => {
      const tx = l1BuildDeposit.connect(depositer1).depositERC20(depositer1.address, erc20_A.address, requiredAmount)
      await expect(tx).be.revertedWith('builder not allowed')
    })

    it('over deposit amount', async () => {
      const tx = l1BuildDeposit.connect(depositer1).depositERC20(builder.address, erc20_A.address, toWei('999'))
      await expect(tx).be.revertedWith('over deposit amount')
    })

    it('ERC20 not allowed', async () => {
      const tx = l1BuildDeposit.connect(depositer1).depositERC20(builder.address, erc20_B.address, requiredAmount)
      await expect(tx).to.be.revertedWith('ERC20 not allowed')
    })

    it('ERC20 transfer failed', async () => {
      const tx = l1BuildDeposit.connect(depositer1).depositERC20(builder.address, erc20_A.address, requiredAmount)
      await expect(tx).to.be.revertedWith('ERC20: transfer amount exceeds allowance')
    })
  })

  describe('withdraw()', () => {
    beforeEach(async () => {
      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
    })

    it('normally', async () => {
      await l1BuildDeposit.connect(agent).build(builder.address)
      await network.provider.send('hardhat_mine', ['0x' + lockedBlock.toString(16)])

      const tx = await l1BuildDeposit.connect(depositer1).withdraw(builder.address, requiredAmount)
      await expect(tx)
        .to.emit(l1BuildDeposit, 'Withdrawal')
        .withArgs(builder.address, depositer1.address, ZERO_ADDRESS, requiredAmount)
      expect(await depositer1.getBalance()).to.gte(toWei('9999'))
    })

    it('builder is zero address', async () => {
      const tx = l1BuildDeposit.connect(depositer1).withdraw(ZERO_ADDRESS, requiredAmount)
      await expect(tx).to.be.revertedWith('builder is zero address')
    })

    it('amount is zero', async () => {
      const tx = l1BuildDeposit.connect(depositer1).withdraw(builder.address, 0)
      await expect(tx).to.be.revertedWith('amount is zero')
    })

    it('while locked', async () => {
      await l1BuildDeposit.connect(agent).build(builder.address)
      await network.provider.send('hardhat_mine', ['0x' + (lockedBlock - 1).toString(16)])

      const tx = l1BuildDeposit.connect(depositer1).withdraw(builder.address, requiredAmount)
      await expect(tx).to.be.revertedWith('while locked')
    })

    it('immediate withdraw if not built', async () => {
      await l1BuildDeposit.connect(depositer1).withdraw(builder.address, requiredAmount)
      expect(await depositer1.getBalance()).to.gte(toWei('9999'))
    })

    it('deposit amount shortage', async () => {
      await l1BuildDeposit.connect(agent).build(builder.address)
      await network.provider.send('hardhat_mine', ['0x' + lockedBlock.toString(16)])

      const tx = l1BuildDeposit.connect(depositer1).withdraw(builder.address, toWei('999'))
      await expect(tx).to.be.revertedWith('your deposit amount shortage')
    })
  })

  describe('withdrawERC20()', () => {
    beforeEach(async () => {
      await erc20_A.connect(deployer).mint(depositer1.address, requiredAmount)
      await erc20_A.connect(depositer1).approve(l1BuildDeposit.address, requiredAmount)
      await l1BuildDeposit.connect(depositer1).depositERC20(builder.address, erc20_A.address, requiredAmount)
    })

    it('normally', async () => {
      await l1BuildDeposit.connect(agent).build(builder.address)
      await network.provider.send('hardhat_mine', ['0x' + lockedBlock.toString(16)])

      expect(await erc20_A.balanceOf(depositer1.address)).to.equal('0')

      const tx = await l1BuildDeposit
        .connect(depositer1)
        .withdrawERC20(builder.address, erc20_A.address, requiredAmount)
      await expect(tx)
        .to.emit(l1BuildDeposit, 'Withdrawal')
        .withArgs(builder.address, depositer1.address, erc20_A.address, requiredAmount)

      expect(await erc20_A.balanceOf(depositer1.address)).to.equal(requiredAmount)
    })

    it('builder is zero address', async () => {
      const tx = l1BuildDeposit.connect(depositer1).withdrawERC20(ZERO_ADDRESS, erc20_A.address, requiredAmount)
      await expect(tx).to.be.revertedWith('builder is zero address')
    })

    it('amount is zero', async () => {
      const tx = l1BuildDeposit.connect(depositer1).withdrawERC20(builder.address, erc20_A.address, 0)
      await expect(tx).to.be.revertedWith('amount is zero')
    })

    it('while locked', async () => {
      await l1BuildDeposit.connect(agent).build(builder.address)
      await network.provider.send('hardhat_mine', ['0x' + (lockedBlock - 1).toString(16)])

      const tx = l1BuildDeposit.connect(depositer1).withdrawERC20(builder.address, erc20_A.address, requiredAmount)
      await expect(tx).to.be.revertedWith('while locked')
    })

    it('immediate withdraw if not built', async () => {
      expect(await erc20_A.balanceOf(depositer1.address)).to.equal('0')
      await l1BuildDeposit.connect(depositer1).withdrawERC20(builder.address, erc20_A.address, requiredAmount)
      expect(await erc20_A.balanceOf(depositer1.address)).to.equal(requiredAmount)
    })

    it('deposit amount shortage', async () => {
      await l1BuildDeposit.connect(agent).build(builder.address)
      await network.provider.send('hardhat_mine', ['0x' + lockedBlock.toString(16)])

      const tx = l1BuildDeposit.connect(depositer1).withdrawERC20(builder.address, erc20_A.address, toWei('999'))
      await expect(tx).to.be.revertedWith('your deposit amount shortage')
    })

    it('ERC20 not allowed', async () => {
      const tx = l1BuildDeposit.connect(depositer1).withdrawERC20(builder.address, erc20_B.address, requiredAmount)
      await expect(tx).to.be.revertedWith('ERC20 not allowed')
    })
  })

  describe('build()', () => {
    it('when OAS is deposited', async () => {
      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
      const tx = await l1BuildDeposit.connect(agent).build(builder.address)
      await expect(tx).to.emit(l1BuildDeposit, 'Build').withArgs(builder.address, 8)
    })

    it('when ERC20 is deposited', async () => {
      await erc20_A.connect(deployer).mint(depositer1.address, requiredAmount)
      await erc20_A.connect(depositer1).approve(l1BuildDeposit.address, requiredAmount)

      await l1BuildDeposit.connect(depositer1).depositERC20(builder.address, erc20_A.address, requiredAmount)
      const tx = await l1BuildDeposit.connect(agent).build(builder.address)
      await expect(tx).to.emit(l1BuildDeposit, 'Build').withArgs(builder.address, 10)
    })

    it('when OAS and ERC20 is deposited', async () => {
      await erc20_A.connect(deployer).mint(depositer1.address, halfAmount)
      await erc20_A.connect(depositer1).approve(l1BuildDeposit.address, halfAmount)

      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: halfAmount })
      await l1BuildDeposit.connect(depositer1).depositERC20(builder.address, erc20_A.address, halfAmount)
      const tx = await l1BuildDeposit.connect(agent).build(builder.address)
      await expect(tx).to.emit(l1BuildDeposit, 'Build').withArgs(builder.address, 11)
    })

    it('call from non-agent', async () => {
      await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
      const tx = l1BuildDeposit.connect(depositer1).build(builder.address)
      await expect(tx).to.be.revertedWith('only L1BuildAgent can call me')
    })

    it('deposit amount shortage', async () => {
      await erc20_A.connect(deployer).mint(depositer1.address, halfAmount)
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
    await erc20_A.connect(deployer).mint(depositer1.address, toWei('50'))
    await erc20_A.connect(deployer).mint(depositer2.address, toWei('50'))
    await erc20_A.connect(depositer1).approve(l1BuildDeposit.address, toWei('50'))
    await erc20_A.connect(depositer2).approve(l1BuildDeposit.address, toWei('50'))

    // deposit.
    await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: toWei('10') })
    expect(await l1BuildDeposit.getDepositTotal(builder.address)).to.equal(toWei('10'))

    await l1BuildDeposit.connect(depositer2).deposit(builder.address, { value: toWei('20') })
    expect(await l1BuildDeposit.getDepositTotal(builder.address)).to.equal(toWei('30'))

    await l1BuildDeposit.connect(depositer1).depositERC20(builder.address, erc20_A.address, toWei('30'))
    expect(await l1BuildDeposit.getDepositTotal(builder.address)).to.equal(toWei('60'))

    await l1BuildDeposit.connect(depositer2).depositERC20(builder.address, erc20_A.address, toWei('40'))
    expect(await l1BuildDeposit.getDepositTotal(builder.address)).to.equal(toWei('100'))

    // withdraw.
    await l1BuildDeposit.connect(depositer1).withdraw(builder.address, toWei('10'))
    expect(await l1BuildDeposit.getDepositTotal(builder.address)).to.equal(toWei('90'))

    await l1BuildDeposit.connect(depositer2).withdraw(builder.address, toWei('20'))
    expect(await l1BuildDeposit.getDepositTotal(builder.address)).to.equal(toWei('70'))

    await l1BuildDeposit.connect(depositer1).withdrawERC20(builder.address, erc20_A.address, toWei('30'))
    expect(await l1BuildDeposit.getDepositTotal(builder.address)).to.equal(toWei('40'))

    await l1BuildDeposit.connect(depositer2).withdrawERC20(builder.address, erc20_A.address, toWei('40'))
    expect(await l1BuildDeposit.getDepositTotal(builder.address)).to.equal(toWei('0'))
  })

  it('getDepositAmount() and getDepositERC20Amount()', async () => {
    const check = async (expOAS: string, expERC20: string) => {
      const actualOAS = await l1BuildDeposit.getDepositAmount(builder.address, depositer1.address)
      const actualERC20 = await l1BuildDeposit.getDepositERC20Amount(
        builder.address,
        depositer1.address,
        erc20_A.address
      )
      expect(actualOAS).to.equal(toWei(expOAS))
      expect(actualERC20).to.equal(toWei(expERC20))
    }

    await erc20_A.connect(deployer).mint(depositer1.address, toWei('50'))
    await erc20_A.connect(depositer1).approve(l1BuildDeposit.address, toWei('50'))

    // deposit.
    await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: toWei('10') })
    await check('10', '0')

    await l1BuildDeposit.connect(depositer1).depositERC20(builder.address, erc20_A.address, toWei('20'))
    await check('10', '20')

    // withdraw.
    await l1BuildDeposit.connect(depositer1).withdraw(builder.address, toWei('10'))
    await check('0', '20')

    await l1BuildDeposit.connect(depositer1).withdrawERC20(builder.address, erc20_A.address, toWei('20'))
    await check('0', '0')
  })

  it('getBuildBlock()', async () => {
    await l1BuildDeposit.connect(depositer1).deposit(builder.address, { value: requiredAmount })
    await l1BuildDeposit.connect(agent).build(builder.address)
    expect(await l1BuildDeposit.getBuildBlock(builder.address)).to.equal(8)
  })
})
