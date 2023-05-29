/* External Imports */
import { ethers } from 'hardhat'
import { Signer, ContractFactory, Contract } from 'ethers'
import { smock, FakeContract, MockContract } from '@defi-wonderland/smock'

/* Internal Imports */
import { expect } from '../../../../setup'
import { NON_NULL_BYTES32, NON_ZERO_ADDRESS } from '../../../../helpers'
import { getContractInterface } from '../../../../../src'

const ERR_INVALID_MESSENGER = 'OVM_XCHAIN: messenger contract unauthenticated'
const ERR_INVALID_X_DOMAIN_MSG_SENDER =
  'OVM_XCHAIN: wrong sender of cross-domain message'
const DUMMY_L1BRIDGE_ADDRESS: string =
  '0x1234123412341234123412341234123412341234'
const DUMMY_L1TOKEN_ADDRESS: string =
  '0x2234223412342234223422342234223422342234'

describe('L2ERC721Bridge', () => {
  let alice: Signer
  let aliceAddress: string
  let bob: Signer
  let bobsAddress: string
  let l2MessengerImpersonator: Signer
  let Factory__L1ERC721Bridge: ContractFactory
  const INITIAL_TOTAL_SUPPLY = 20
  const ALICE_INITIAL_BALANCE = 10
  before(async () => {
    // Create a special signer which will enable us to send messages from the L2Messenger contract
    ;[alice, bob, l2MessengerImpersonator] = await ethers.getSigners()
    aliceAddress = await alice.getAddress()
    bobsAddress = await bob.getAddress()
    Factory__L1ERC721Bridge = await ethers.getContractFactory('L1ERC721Bridge')

    // get an IL2ERC721Bridge Interface
    getContractInterface('IL2ERC721Bridge')
  })

  let L2ERC721Bridge: Contract
  let L2ERC721: Contract
  let Fake__L2CrossDomainMessenger: FakeContract
  beforeEach(async () => {
    // Get a new mock L2 messenger
    Fake__L2CrossDomainMessenger = await smock.fake<Contract>(
      await ethers.getContractFactory('L2CrossDomainMessenger'),
      // This allows us to use an ethers override {from: Mock__L2CrossDomainMessenger.address} to mock calls
      { address: await l2MessengerImpersonator.getAddress() }
    )

    // Deploy the contract under test
    L2ERC721Bridge = await (
      await ethers.getContractFactory('L2ERC721Bridge')
    ).deploy(Fake__L2CrossDomainMessenger.address, DUMMY_L1BRIDGE_ADDRESS)

    // Deploy an L2 ERC721
    L2ERC721 = await (
      await ethers.getContractFactory('L2StandardERC721', alice)
    ).deploy(L2ERC721Bridge.address, DUMMY_L1TOKEN_ADDRESS, 'L2Token', 'L2T')
  })

  // test the transfer flow of moving a token from L2 to L1
  describe('finalizeDeposit', () => {
    it('onlyFromCrossDomainAccount: should revert on calls from a non-crossDomainMessenger L2 account', async () => {
      await expect(
        L2ERC721Bridge.finalizeDeposit(
          DUMMY_L1TOKEN_ADDRESS,
          NON_ZERO_ADDRESS,
          NON_ZERO_ADDRESS,
          NON_ZERO_ADDRESS,
          1,
          NON_NULL_BYTES32
        )
      ).to.be.revertedWith(ERR_INVALID_MESSENGER)
    })

    it('onlyFromCrossDomainAccount: should revert on calls from the right crossDomainMessenger, but wrong xDomainMessageSender (ie. not the L1L1ERC721Bridge)', async () => {
      Fake__L2CrossDomainMessenger.xDomainMessageSender.returns(
        NON_ZERO_ADDRESS
      )

      await expect(
        L2ERC721Bridge.connect(l2MessengerImpersonator).finalizeDeposit(
          DUMMY_L1TOKEN_ADDRESS,
          NON_ZERO_ADDRESS,
          NON_ZERO_ADDRESS,
          NON_ZERO_ADDRESS,
          1,
          NON_NULL_BYTES32,
          {
            from: Fake__L2CrossDomainMessenger.address,
          }
        )
      ).to.be.revertedWith(ERR_INVALID_X_DOMAIN_MSG_SENDER)
    })

    it('should initialize a withdrawal if the L2 token is not compliant', async () => {
      // Deploy a non compliant ERC721
      const NonCompliantERC721 = await (
        await ethers.getContractFactory(
          '@openzeppelin/contracts/token/ERC721/ERC721.sol:ERC721'
        )
      ).deploy('L2Token', 'L2T')

      L2ERC721Bridge.connect(l2MessengerImpersonator).finalizeDeposit(
        DUMMY_L1TOKEN_ADDRESS,
        NON_ZERO_ADDRESS,
        NON_ZERO_ADDRESS,
        NON_ZERO_ADDRESS,
        1,
        NON_NULL_BYTES32,
        {
          from: Fake__L2CrossDomainMessenger.address,
        }
      )

      Fake__L2CrossDomainMessenger.xDomainMessageSender.returns(
        () => DUMMY_L1BRIDGE_ADDRESS
      )

      await L2ERC721Bridge.connect(l2MessengerImpersonator).finalizeDeposit(
        DUMMY_L1TOKEN_ADDRESS,
        NonCompliantERC721.address,
        aliceAddress,
        bobsAddress,
        100,
        NON_NULL_BYTES32,
        {
          from: Fake__L2CrossDomainMessenger.address,
        }
      )

      const withdrawalCallToMessenger =
        Fake__L2CrossDomainMessenger.sendMessage.getCall(1)

      expect(withdrawalCallToMessenger.args[0]).to.equal(DUMMY_L1BRIDGE_ADDRESS)
      expect(withdrawalCallToMessenger.args[1]).to.equal(
        Factory__L1ERC721Bridge.interface.encodeFunctionData(
          'finalizeERC721Withdrawal',
          [
            DUMMY_L1TOKEN_ADDRESS,
            NonCompliantERC721.address,
            bobsAddress,
            aliceAddress,
            100,
            NON_NULL_BYTES32,
          ]
        )
      )
    })

    it('should credit funds to the depositor', async () => {
      const depositTokenId = 12345

      Fake__L2CrossDomainMessenger.xDomainMessageSender.returns(
        () => DUMMY_L1BRIDGE_ADDRESS
      )

      await L2ERC721Bridge.connect(l2MessengerImpersonator).finalizeDeposit(
        DUMMY_L1TOKEN_ADDRESS,
        L2ERC721.address,
        aliceAddress,
        bobsAddress,
        depositTokenId,
        NON_NULL_BYTES32,
        {
          from: Fake__L2CrossDomainMessenger.address,
        }
      )

      const bobsBalance = await L2ERC721.balanceOf(bobsAddress)
      const tokenOwner = await L2ERC721.ownerOf(depositTokenId)
      bobsBalance.should.equal(1)
      tokenOwner.should.equal(bobsAddress)
    })
  })

  describe('withdrawals', () => {
    const withdrawTokenId = 12345
    let Mock__L2Token: MockContract<Contract>

    beforeEach(async () => {
      // Deploy a smodded gateway so we can give some tokens to withdraw
      Mock__L2Token = await (
        await smock.mock('L2StandardERC721')
      ).deploy(L2ERC721Bridge.address, DUMMY_L1TOKEN_ADDRESS, 'L2Token', 'L2T')

      await Mock__L2Token.setVariable('l2Bridge', bobsAddress)
      for (let i = 0; i < INITIAL_TOTAL_SUPPLY - ALICE_INITIAL_BALANCE; i++) {
        await Mock__L2Token.connect(bob).mint(bobsAddress, i)
      }

      await Mock__L2Token.setVariable('l2Bridge', aliceAddress)
      for (let i = 0; i < ALICE_INITIAL_BALANCE; i++) {
        await Mock__L2Token.connect(alice).mint(
          aliceAddress,
          withdrawTokenId + i
        )
      }

      await Mock__L2Token.setVariable('l2Bridge', L2ERC721Bridge.address)
    })

    it('withdraw() burns and sends the correct withdrawal message', async () => {
      await L2ERC721Bridge.withdraw(
        Mock__L2Token.address,
        withdrawTokenId,
        0,
        NON_NULL_BYTES32
      )
      const withdrawalCallToMessenger =
        Fake__L2CrossDomainMessenger.sendMessage.getCall(0)

      // Assert Alice's balance went down
      const aliceBalance = await Mock__L2Token.balanceOf(aliceAddress)
      expect(aliceBalance).to.deep.equal(
        ethers.BigNumber.from(ALICE_INITIAL_BALANCE - 1)
      )

      // Assert totalSupply went down
      const newTotalSupply = await Mock__L2Token.totalSupply()
      expect(newTotalSupply).to.deep.equal(
        ethers.BigNumber.from(INITIAL_TOTAL_SUPPLY - 1)
      )

      // Assert the correct cross-chain call was sent:
      // Message should be sent to the L1L1ERC721Bridge on L1
      expect(withdrawalCallToMessenger.args[0]).to.equal(DUMMY_L1BRIDGE_ADDRESS)
      // Message data should be a call telling the L1L1ERC721Bridge to finalize the withdrawal
      expect(withdrawalCallToMessenger.args[1]).to.equal(
        Factory__L1ERC721Bridge.interface.encodeFunctionData(
          'finalizeERC721Withdrawal',
          [
            DUMMY_L1TOKEN_ADDRESS,
            Mock__L2Token.address,
            aliceAddress,
            aliceAddress,
            withdrawTokenId,
            NON_NULL_BYTES32,
          ]
        )
      )
      // gaslimit should be correct
      expect(withdrawalCallToMessenger.args[2]).to.equal(0)
    })

    it('withdrawTo() burns and sends the correct withdrawal message', async () => {
      await L2ERC721Bridge.withdrawTo(
        Mock__L2Token.address,
        bobsAddress,
        withdrawTokenId,
        0,
        NON_NULL_BYTES32
      )
      const withdrawalCallToMessenger =
        Fake__L2CrossDomainMessenger.sendMessage.getCall(0)

      // Assert Alice's balance went down
      const aliceBalance = await Mock__L2Token.balanceOf(aliceAddress)
      expect(aliceBalance).to.deep.equal(
        ethers.BigNumber.from(ALICE_INITIAL_BALANCE - 1)
      )

      // Assert totalSupply went down
      const newTotalSupply = await Mock__L2Token.totalSupply()
      expect(newTotalSupply).to.deep.equal(
        ethers.BigNumber.from(INITIAL_TOTAL_SUPPLY - 1)
      )

      // Assert the correct cross-chain call was sent.
      // Message should be sent to the L1L1ERC721Bridge on L1
      expect(withdrawalCallToMessenger.args[0]).to.equal(DUMMY_L1BRIDGE_ADDRESS)
      // The message data should be a call telling the L1L1ERC721Bridge to finalize the withdrawal
      expect(withdrawalCallToMessenger.args[1]).to.equal(
        Factory__L1ERC721Bridge.interface.encodeFunctionData(
          'finalizeERC721Withdrawal',
          [
            DUMMY_L1TOKEN_ADDRESS,
            Mock__L2Token.address,
            aliceAddress,
            bobsAddress,
            withdrawTokenId,
            NON_NULL_BYTES32,
          ]
        )
      )
      // gas value is ignored and set to 0.
      expect(withdrawalCallToMessenger.args[2]).to.equal(0)
    })
  })

  describe('standard erc721', () => {
    it('should not allow anyone but the L2 bridge to mint and burn', async () => {
      expect(
        L2ERC721.connect(alice).mint(aliceAddress, 100)
      ).to.be.revertedWith('Only L2 Bridge can mint and burn')
      expect(
        L2ERC721.connect(alice).burn(aliceAddress, 100)
      ).to.be.revertedWith('Only L2 Bridge can mint and burn')
    })

    it('should return the correct interface support', async () => {
      const supportsERC165 = await L2ERC721.supportsInterface(0x01ffc9a7)
      expect(supportsERC165).to.be.true

      const supportsL2TokenInterface = await L2ERC721.supportsInterface(
        0x1d1d8b63
      )
      expect(supportsL2TokenInterface).to.be.true

      const badSupports = await L2ERC721.supportsInterface(0xffffffff)
      expect(badSupports).to.be.false
    })

    it('should be withdrawable only by the token owner', async () => {
      const tokenId = 12345

      const Mock__L2Token = await (
        await smock.mock('L2StandardERC721')
      ).deploy(L2ERC721Bridge.address, DUMMY_L1TOKEN_ADDRESS, 'L2Token', 'L2T')

      await Mock__L2Token.setVariable('l2Bridge', bobsAddress)
      await Mock__L2Token.connect(bob).mint(bobsAddress, tokenId)

      await Mock__L2Token.setVariable('l2Bridge', L2ERC721Bridge.address)

      await expect(
        L2ERC721Bridge.withdraw(
          Mock__L2Token.address,
          tokenId,
          0,
          NON_NULL_BYTES32
        )
      ).to.be.revertedWith('Not owner of the token')

      await L2ERC721Bridge.connect(bob).withdraw(
        Mock__L2Token.address,
        tokenId,
        0,
        NON_NULL_BYTES32
      )
    })
  })
})
