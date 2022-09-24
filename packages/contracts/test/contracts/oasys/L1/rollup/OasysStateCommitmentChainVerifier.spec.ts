/* External Imports */
import web3 from 'web3'
import chai from 'chai'
import { ethers, network } from 'hardhat'
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
    const address = '0x0000000000000000000000000000000000001001'

    // write fake bytecode.
    await network.provider.send('hardhat_setCode', [address, '0xff'])
    Fake__StakeManager = await smock.fake<Contract>(
      await ethers.getContractAt('IStakeManager', address),
      { address }
    )
  })

  let Fake__OasysStateCommitmentChain: FakeContract
  let sccAddress: string
  let verifiers: [Account, Account, string][] // owner, operator, stake
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
    ;[operator1, operator2, operator3] = verifiers.map((x) => x[1])
  })

  beforeEach(async () => {
    Fake__StakeManager.getValidatorInfo.returns(
      (params: { validator: string; epoch: BigNumber }) => {
        const find = verifiers.find(
          (x) =>
            x[0].address === params.validator && params.epoch.toNumber() === 0
        )
        if (find) {
          return [find[1].address, true, true, true, find[2]]
        }
        return [ZERO_ADDRESS, false, false, false, '0']
      }
    )

    Fake__StakeManager.operatorToOwner.returns(
      (params: { operator: string }) => {
        const find = verifiers.find((x) => x[1].address === params.operator)
        if (find) {
          return find[0].address
        }
        return ZERO_ADDRESS
      }
    )
  })

  const makeSignatures = async (
    _verifiers: Account[],
    approved: boolean,
    batchIndex: number = batchHeader.batchIndex.toNumber(),
    batchRoot: string = batchHeader.batchRoot
  ): Promise<string[]> => {
    const hash = ethers.utils.keccak256(
      web3.utils.encodePacked(
        { type: 'uint256', value: '31337' }, // Hardhat chain id
        { type: 'address', value: sccAddress },
        { type: 'uint256', value: batchIndex as any },
        { type: 'bytes32', value: batchRoot },
        { type: 'bool', value: approved as any }
      )
    )
    return Promise.all(_verifiers.map((x) => x.signMessage(toBuffer(hash))))
  }

  describe('approve()', () => {
    it('should be successful', async () => {
      const signatures = await makeSignatures(
        [operator3, operator2, operator1],
        true
      )
      const tx = await OasysSccVerifier.approve(
        sccAddress,
        batchHeader,
        signatures
      )

      Fake__OasysStateCommitmentChain.succeedVerification
        .atCall(0)
        .should.be.calledWith(batchHeader)

      await expect(tx)
        .to.emit(OasysSccVerifier, 'StateBatchApproved')
        .withArgs(sccAddress, batchHeader.batchIndex, batchHeader.batchRoot)
    })
  })

  describe('reject()', () => {
    it('should be successful', async () => {
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

  describe('errors', () => {
    it('should be reverted by `InvalidSignature`', async () => {
      const signatures = await makeSignatures([operator1], true, 1)
      signatures[0] = signatures[0].slice(0, -4)

      const tx = OasysSccVerifier.approve(sccAddress, batchHeader, signatures)
      await expect(tx).to.be.revertedWith('InvalidSignature')
    })

    it('should be reverted by `InvalidAddressSort`', async () => {
      const signatures = await makeSignatures([operator1, operator1], true)
      const tx = OasysSccVerifier.approve(sccAddress, batchHeader, signatures)
      await expect(tx).to.be.revertedWith('InvalidAddressSort')
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
      const tx = OasysSccVerifier.approve(sccAddress, batchHeader, signatures)
      await expect(tx).to.be.revertedWith('OutdatedValidatorAddress')
    })

    it('should be reverted by `StakeAmountShortage`', async () => {
      const signatures = await makeSignatures(
        [operator3, operator2, operator1],
        true
      )

      // required = 7000.26 (13726 * 51%)
      Fake__StakeManager.getTotalStake.returns(toWei('13726'))
      let tx = OasysSccVerifier.approve(sccAddress, batchHeader, signatures)
      await expect(tx).to.be.revertedWith('StakeAmountShortage')

      // required = 6999.75 (13725 * 51%)
      Fake__StakeManager.getTotalStake.returns(toWei('13725'))
      tx = OasysSccVerifier.approve(sccAddress, batchHeader, signatures)
      await expect(tx)
        .to.emit(OasysSccVerifier, 'StateBatchApproved')
        .withArgs(sccAddress, batchHeader.batchIndex, batchHeader.batchRoot)
    })
  })
})
