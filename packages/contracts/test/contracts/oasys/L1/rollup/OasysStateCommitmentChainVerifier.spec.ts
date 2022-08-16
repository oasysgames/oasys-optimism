/* External Imports */
import web3 from 'web3'
import chai from 'chai'
import { ethers } from 'hardhat'
import { Contract, BigNumber } from 'ethers'
import { smock, FakeContract } from '@defi-wonderland/smock'
import { toBuffer } from 'ethereumjs-util'
import { SignerWithAddress as Account } from '@nomiclabs/hardhat-ethers/signers'

/* Internal Imports */
import { expect } from '../../../../setup'
import { NON_NULL_BYTES32 } from '../../../../helpers'

chai.use(smock.matchers)

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const toWei = web3.utils.toWei

const batchHeader = {
  batchIndex: BigNumber.from(0),
  batchRoot: NON_NULL_BYTES32,
  batchSize: BigNumber.from(1),
  prevTotalElements: BigNumber.from(0),
  extraData: NON_NULL_BYTES32,
} as const

describe('OasysStateCommitmentChainVerifier', () => {
  let OasysSccVerifier: Contract
  before(async () => {
    const factory = await ethers.getContractFactory(
      'OasysStateCommitmentChainVerifier'
    )
    OasysSccVerifier = await factory.deploy()
  })

  let Fake__StakeManager: FakeContract
  before(async () => {
    Fake__StakeManager = await smock.fake<Contract>(
      await ethers.getContractAt('IStakeManager', '0x0'),
      {
        address: '0x0000000000000000000000000000000000001001',
      }
    )
  })

  let Fake__OasysStateCommitmentChain: FakeContract
  let sccAddress: string
  let verifiers: [Account, Account, string][] // owner, operator, stake
  let owner1: Account
  let owner2: Account
  let owner3: Account
  let operator1: Account
  let operator2: Account
  let operator3: Account
  before(async () => {
    Fake__OasysStateCommitmentChain = await smock.fake<Contract>(
      await ethers.getContractFactory('OasysStateCommitmentChain')
    )
    sccAddress = Fake__OasysStateCommitmentChain.address

    const signers = await ethers.getSigners()
    verifiers = [
      [signers[1], signers[2], toWei('1000')],
      [signers[3], signers[4], toWei('2000')],
      [signers[5], signers[6], toWei('4000')],
    ]
    ;[owner1, owner2, owner3] = verifiers.map((x) => x[0])
    ;[operator1, operator2, operator3] = verifiers.map((x) => x[1])
  })

  beforeEach(async () => {
    Fake__StakeManager.getValidatorInfo.returns((owner: string) => {
      const find = verifiers.find((x) => x[0].address == owner)
      if (find) {
        return [find[1].address, true, true, find[2], '0']
      }
      return [ZERO_ADDRESS, false, false, '0', '0']
    })

    Fake__StakeManager.operatorToOwner.returns((operator: string) => {
      const find = verifiers.find((x) => x[1].address == operator)
      if (find) {
        return find[0].address
      }
      return ZERO_ADDRESS
    })
  })

  const makeSignatures = async (
    verifiers: Account[],
    accepted: boolean,
    batchIndex: number = batchHeader.batchIndex.toNumber(),
    batchRoot: string = batchHeader.batchRoot
  ): Promise<string[]> => {
    const hash = ethers.utils.keccak256(
      web3.utils.encodePacked(
        { type: 'uint256', value: '31337' }, // Hardhat chain id
        { type: 'address', value: sccAddress },
        { type: 'uint256', value: batchIndex as any },
        { type: 'bytes32', value: batchRoot },
        { type: 'bool', value: accepted as any }
      )
    )
    return await Promise.all(
      verifiers.map((x) => x.signMessage(toBuffer(hash)))
    )
  }

  describe('accept()', () => {
    it('should be accept', async () => {
      const signatures = await makeSignatures(
        [operator3, operator2, operator1],
        true
      )
      const tx = await OasysSccVerifier.accept(
        sccAddress,
        batchHeader,
        signatures
      )

      Fake__OasysStateCommitmentChain.succeedVerification
        .atCall(0)
        .should.be.calledWith(batchHeader)

      await expect(tx)
        .to.emit(OasysSccVerifier, 'StateBatchAccepted')
        .withArgs(sccAddress, batchHeader.batchIndex, batchHeader.batchRoot)
    })
  })

  describe('reject()', () => {
    it('should be rejected', async () => {
      const signatures = await makeSignatures(
        [operator3, operator2, operator1],
        false
      )
      const tx = await OasysSccVerifier.reject(
        sccAddress,
        batchHeader,
        signatures
      )

      Fake__OasysStateCommitmentChain.failVerification
        .atCall(0)
        .should.be.calledWith(batchHeader)

      await expect(tx)
        .to.emit(OasysSccVerifier, 'StateBatchRejected')
        .withArgs(sccAddress, batchHeader.batchIndex, batchHeader.batchRoot)
    })
  })

  describe('verifySignatures()', () => {
    it('should return true', async () => {
      Fake__StakeManager.getTotalStake.returns(toWei('4000'))

      const signatures = await makeSignatures([operator2, operator1], true)
      await OasysSccVerifier.verifySignatures(
        sccAddress,
        batchHeader,
        true,
        signatures
      )
    })

    it('should be reverted by `StakeAmountShortage`', async () => {
      Fake__StakeManager.getTotalStake.returns(toWei('2000'))

      const signatures = await makeSignatures([operator1], true)
      const tx = OasysSccVerifier.verifySignatures(
        sccAddress,
        batchHeader,
        true,
        signatures
      )
      await expect(tx).to.be.revertedWith('StakeAmountShortage')
    })
  })

  describe('getVerifiers()', () => {
    it('should return a list of signed verifiers and stakes', async () => {
      let verifiers: string[]
      let amounts: BigNumber[]

      let signatures = await makeSignatures([operator1], true)
      ;[verifiers, amounts] = await OasysSccVerifier.getVerifiers(
        sccAddress,
        batchHeader,
        true,
        signatures
      )
      expect(verifiers).to.eql([owner1.address])
      expect(amounts.map((x) => x.toString())).to.eql([toWei('1000')])

      signatures = await makeSignatures([operator2, operator1], true)
      ;[verifiers, amounts] = await OasysSccVerifier.getVerifiers(
        sccAddress,
        batchHeader,
        true,
        signatures
      )
      expect(verifiers).to.eql([owner2.address, owner1.address])
      expect(amounts.map((x) => x.toString())).to.eql([
        toWei('2000'),
        toWei('1000'),
      ])

      signatures = await makeSignatures([operator3, operator2, operator1], true)
      ;[verifiers, amounts] = await OasysSccVerifier.getVerifiers(
        sccAddress,
        batchHeader,
        true,
        signatures
      )
      expect(verifiers).to.eql([owner3.address, owner2.address, owner1.address])
      expect(amounts.map((x) => x.toString())).to.eql([
        toWei('4000'),
        toWei('2000'),
        toWei('1000'),
      ])
    })

    it('should be reverted by `OutdatedValidatorAddress`', async () => {
      Fake__StakeManager.getValidatorInfo.returns([
        ZERO_ADDRESS,
        false,
        false,
        '0',
        '0',
      ])

      const signatures = await makeSignatures([operator1], true)
      const tx = OasysSccVerifier.getVerifiers(
        sccAddress,
        batchHeader,
        true,
        signatures
      )
      await expect(tx).to.be.revertedWith('OutdatedValidatorAddress')
    })

    it('should be reverted by `Invalid address sort.`', async () => {
      const signatures = await makeSignatures([operator1, operator1], true)
      const tx = OasysSccVerifier.getVerifiers(
        sccAddress,
        batchHeader,
        true,
        signatures
      )
      await expect(tx).to.be.revertedWith('Invalid address sort.')
    })

    it('should be reverted by `InvalidSignature`', async () => {
      const signatures = await makeSignatures([operator1], true, 1)
      const tx = OasysSccVerifier.getVerifiers(
        sccAddress,
        batchHeader,
        true,
        signatures
      )
      await expect(tx).to.be.revertedWith('InvalidSignature')
    })
  })
})
