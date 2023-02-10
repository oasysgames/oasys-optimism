/* External Imports */
import { ethers } from 'hardhat'
import { ContractFactory, Contract, Signer } from 'ethers'

import { expect } from '../../../../setup'

describe('OVM_OAS', () => {
  let signer1: Signer
  let signer2: Signer
  before(async () => {
    ;[signer1, signer2] = await ethers.getSigners()
  })

  let Factory__OVM_OAS: ContractFactory
  before(async () => {
    Factory__OVM_OAS = await ethers.getContractFactory('OVM_OAS')
  })

  let OVM_OAS: Contract
  beforeEach(async () => {
    OVM_OAS = await Factory__OVM_OAS.deploy()
  })

  describe('transfer', () => {
    it('should revert', async () => {
      await expect(
        OVM_OAS.transfer(await signer2.getAddress(), 100)
      ).to.be.revertedWith(
        'OVM_OAS: transfer is disabled pending further community discussion.'
      )
    })
  })

  describe('approve', () => {
    it('should revert', async () => {
      await expect(
        OVM_OAS.approve(await signer2.getAddress(), 100)
      ).to.be.revertedWith(
        'OVM_OAS: approve is disabled pending further community discussion.'
      )
    })
  })

  describe('transferFrom', () => {
    it('should revert', async () => {
      await expect(
        OVM_OAS.transferFrom(
          await signer1.getAddress(),
          await signer2.getAddress(),
          100
        )
      ).to.be.revertedWith(
        'OVM_OAS: transferFrom is disabled pending further community discussion.'
      )
    })
  })

  describe('increaseAllowance', () => {
    it('should revert', async () => {
      await expect(
        OVM_OAS.increaseAllowance(await signer2.getAddress(), 100)
      ).to.be.revertedWith(
        'OVM_OAS: increaseAllowance is disabled pending further community discussion.'
      )
    })
  })

  describe('decreaseAllowance', () => {
    it('should revert', async () => {
      await expect(
        OVM_OAS.decreaseAllowance(await signer2.getAddress(), 100)
      ).to.be.revertedWith(
        'OVM_OAS: decreaseAllowance is disabled pending further community discussion.'
      )
    })
  })
})
