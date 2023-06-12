/* External Imports */
import { ethers } from 'hardhat'
import { Signer, ContractFactory, Contract, constants } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import {
  smock,
  MockContractFactory,
  FakeContract,
  MockContract,
} from '@defi-wonderland/smock'

/* Internal Imports */
import { expect } from '../../../../setup'
import { NON_NULL_BYTES32, NON_ZERO_ADDRESS } from '../../../../helpers'
import { getContractInterface } from '../../../../../src'

const ERR_INVALID_MESSENGER = 'OVM_XCHAIN: messenger contract unauthenticated'
const ERR_INVALID_X_DOMAIN_MSG_SENDER =
  'OVM_XCHAIN: wrong sender of cross-domain message'
const ERR_ALREADY_INITIALIZED = 'initialize only once'
const DUMMY_L2_ERC721_ADDRESS = ethers.utils.getAddress(
  '0x' + 'abba'.repeat(10)
)
const DUMMY_L2_BRIDGE_ADDRESS = ethers.utils.getAddress(
  '0x' + 'acdc'.repeat(10)
)

const INITIAL_TOKEN_ID = 12345
const FINALIZATION_GAS = 1_200_000

describe('L1ERC721BridgeV2', () => {
  // init signers
  let l1MessengerImpersonator: Signer
  let alice: Signer
  let bob: Signer
  let bobsAddress: string
  let aliceAddress: string

  // we can just make up this string since it's on the "other" Layer
  let Factory__L1ERC721: MockContractFactory<ContractFactory>
  let IL2ERC721Bridge: Interface
  before(async () => {
    ;[l1MessengerImpersonator, alice, bob] = await ethers.getSigners()

    await smock.fake<Contract>(await ethers.getContractFactory('OVM_ETH'))

    // deploy an ERC721 contract on L1
    Factory__L1ERC721 = await smock.mock(
      '@openzeppelin/contracts/token/ERC721/ERC721.sol:ERC721'
    )

    // get an L2ER20Bridge Interface
    IL2ERC721Bridge = getContractInterface('IL2ERC721Bridge')

    aliceAddress = await alice.getAddress()
    bobsAddress = await bob.getAddress()
  })

  let L1ERC721: MockContract<Contract>
  let L1ERC721BridgeV2: Contract
  let Fake__L1CrossDomainMessenger: FakeContract
  beforeEach(async () => {
    // Get a new mock L1 messenger
    Fake__L1CrossDomainMessenger = await smock.fake<Contract>(
      await ethers.getContractFactory('L1CrossDomainMessenger'),
      { address: await l1MessengerImpersonator.getAddress() } // This allows us to use an ethers override {from: Mock__L2CrossDomainMessenger.address} to mock calls
    )

    // Deploy the contract under test
    L1ERC721BridgeV2 = await (
      await ethers.getContractFactory('L1ERC721BridgeV2')
    ).deploy()
    await L1ERC721BridgeV2.initialize(
      Fake__L1CrossDomainMessenger.address,
      DUMMY_L2_BRIDGE_ADDRESS
    )

    L1ERC721 = await Factory__L1ERC721.deploy('L1ERC721', 'ERC')

    await L1ERC721.setVariable('_balances', {
      [aliceAddress]: 1,
    })
    await L1ERC721.setVariable('_owners', {
      [INITIAL_TOKEN_ID]: aliceAddress,
    })
  })

  describe('initialize', () => {
    it('Should only be callable once', async () => {
      await expect(
        L1ERC721BridgeV2.initialize(
          ethers.constants.AddressZero,
          DUMMY_L2_BRIDGE_ADDRESS
        )
      ).to.be.revertedWith(ERR_ALREADY_INITIALIZED)
    })
  })

  describe('deposits', () => {
    const depositTokenId = INITIAL_TOKEN_ID

    beforeEach(async () => {
      await L1ERC721.connect(alice).approve(
        L1ERC721BridgeV2.address,
        depositTokenId
      )
    })

    it('depositERC721() escrows the deposit amount and sends the correct deposit message', async () => {
      // alice calls deposit on the bridge and the L1 bridge calls transferFrom on the token
      await L1ERC721BridgeV2.connect(alice).depositERC721(
        L1ERC721.address,
        DUMMY_L2_ERC721_ADDRESS,
        depositTokenId,
        FINALIZATION_GAS,
        NON_NULL_BYTES32
      )

      const depositCallToMessenger =
        Fake__L1CrossDomainMessenger.sendMessage.getCall(0)

      const depositerBalance = await L1ERC721.balanceOf(aliceAddress)
      expect(depositerBalance).to.equal(0)

      // bridge's balance is increased
      const bridgeBalance = await L1ERC721.balanceOf(L1ERC721BridgeV2.address)
      expect(bridgeBalance).to.equal(1)

      // token owner has been moved.
      const tokenOwner = await L1ERC721.ownerOf(depositTokenId)
      expect(tokenOwner).to.equal(L1ERC721BridgeV2.address)

      // deposit status changed to true
      const depositStatus = await L1ERC721BridgeV2.deposits(
        L1ERC721.address,
        DUMMY_L2_ERC721_ADDRESS,
        depositTokenId
      )
      expect(depositStatus).to.be.true

      // Check the correct cross-chain call was sent:
      // Message should be sent to the L2 bridge
      expect(depositCallToMessenger.args[0]).to.equal(DUMMY_L2_BRIDGE_ADDRESS)
      // Message data should be a call telling the L2DepositedERC721 to finalize the deposit

      // the L1 bridge sends the correct message to the L1 messenger
      expect(depositCallToMessenger.args[1]).to.equal(
        IL2ERC721Bridge.encodeFunctionData('finalizeDeposit', [
          L1ERC721.address,
          DUMMY_L2_ERC721_ADDRESS,
          aliceAddress,
          aliceAddress,
          depositTokenId,
          NON_NULL_BYTES32,
        ])
      )
      expect(depositCallToMessenger.args[2]).to.equal(FINALIZATION_GAS)
    })

    it('depositERC721To() escrows the deposit amount and sends the correct deposit message', async () => {
      // depositor calls deposit on the bridge and the L1 bridge calls transferFrom on the token
      await L1ERC721BridgeV2.connect(alice).depositERC721To(
        L1ERC721.address,
        DUMMY_L2_ERC721_ADDRESS,
        bobsAddress,
        depositTokenId,
        FINALIZATION_GAS,
        NON_NULL_BYTES32
      )
      const depositCallToMessenger =
        Fake__L1CrossDomainMessenger.sendMessage.getCall(0)

      const depositerBalance = await L1ERC721.balanceOf(aliceAddress)
      expect(depositerBalance).to.equal(0)

      // bridge's balance is increased
      const bridgeBalance = await L1ERC721.balanceOf(L1ERC721BridgeV2.address)
      expect(bridgeBalance).to.equal(1)

      const tokenOwner = await L1ERC721.ownerOf(depositTokenId)
      expect(tokenOwner).to.equal(L1ERC721BridgeV2.address)

      // Check the correct cross-chain call was sent:
      // Message should be sent to the L2DepositedERC721 on L2
      expect(depositCallToMessenger.args[0]).to.equal(DUMMY_L2_BRIDGE_ADDRESS)
      // Message data should be a call telling the L2DepositedERC721 to finalize the deposit

      // the L1 bridge sends the correct message to the L1 messenger
      expect(depositCallToMessenger.args[1]).to.equal(
        IL2ERC721Bridge.encodeFunctionData('finalizeDeposit', [
          L1ERC721.address,
          DUMMY_L2_ERC721_ADDRESS,
          aliceAddress,
          bobsAddress,
          depositTokenId,
          NON_NULL_BYTES32,
        ])
      )
      expect(depositCallToMessenger.args[2]).to.equal(FINALIZATION_GAS)
    })

    it('cannot depositERC721 from a contract account', async () => {
      expect(
        L1ERC721BridgeV2.depositERC721(
          L1ERC721.address,
          DUMMY_L2_ERC721_ADDRESS,
          depositTokenId,
          FINALIZATION_GAS,
          NON_NULL_BYTES32
        )
      ).to.be.revertedWith('Account not EOA')
    })

    it('cannot double deposit', async () => {
      const doDeposit = () =>
        L1ERC721BridgeV2.connect(alice).depositERC721(
          L1ERC721.address,
          DUMMY_L2_ERC721_ADDRESS,
          depositTokenId,
          FINALIZATION_GAS,
          NON_NULL_BYTES32
        )

      await doDeposit()
      await expect(doDeposit()).to.be.revertedWith('Already deposited')
    })
  })

  describe('ERC721 withdrawals', () => {
    it('onlyFromCrossDomainAccount: should revert on calls from a non-crossDomainMessenger L1 account', async () => {
      await expect(
        L1ERC721BridgeV2.connect(alice).finalizeERC721Withdrawal(
          L1ERC721.address,
          DUMMY_L2_ERC721_ADDRESS,
          constants.AddressZero,
          constants.AddressZero,
          1,
          NON_NULL_BYTES32
        )
      ).to.be.revertedWith(ERR_INVALID_MESSENGER)
    })

    it('onlyFromCrossDomainAccount: should revert on calls from the right crossDomainMessenger, but wrong xDomainMessageSender (ie. not the L2DepositedERC721)', async () => {
      Fake__L1CrossDomainMessenger.xDomainMessageSender.returns(
        () => NON_ZERO_ADDRESS
      )

      await expect(
        L1ERC721BridgeV2.finalizeERC721Withdrawal(
          L1ERC721.address,
          DUMMY_L2_ERC721_ADDRESS,
          constants.AddressZero,
          constants.AddressZero,
          1,
          NON_NULL_BYTES32,
          {
            from: Fake__L1CrossDomainMessenger.address,
          }
        )
      ).to.be.revertedWith(ERR_INVALID_X_DOMAIN_MSG_SENDER)
    })

    it('should revert if not deposited', async () => {
      Fake__L1CrossDomainMessenger.xDomainMessageSender.returns(
        () => DUMMY_L2_BRIDGE_ADDRESS
      )

      await expect(
        L1ERC721BridgeV2.finalizeERC721Withdrawal(
          L1ERC721.address,
          DUMMY_L2_ERC721_ADDRESS,
          constants.AddressZero,
          constants.AddressZero,
          1,
          NON_NULL_BYTES32,
          {
            from: Fake__L1CrossDomainMessenger.address,
          }
        )
      ).to.be.revertedWith('Not deposited')
    })

    it('should credit funds to the withdrawer and not use too much gas', async () => {
      // First Alice will 'donate' some tokens so that there's a balance to be withdrawn
      const withdrawalTokenId = INITIAL_TOKEN_ID

      const depositStatus = () =>
        L1ERC721BridgeV2.deposits(
          L1ERC721.address,
          DUMMY_L2_ERC721_ADDRESS,
          withdrawalTokenId
        )

      // deposit state is initially false
      expect(await depositStatus()).to.be.false

      await L1ERC721.connect(alice).approve(
        L1ERC721BridgeV2.address,
        withdrawalTokenId
      )

      await L1ERC721BridgeV2.connect(alice).depositERC721(
        L1ERC721.address,
        DUMMY_L2_ERC721_ADDRESS,
        withdrawalTokenId,
        FINALIZATION_GAS,
        NON_NULL_BYTES32
      )

      const bridgeBalance = await L1ERC721.balanceOf(L1ERC721BridgeV2.address)
      expect(bridgeBalance).to.be.equal(1)

      // deposit status changed to true
      expect(await depositStatus()).to.be.true

      // make sure no balance at start of test
      expect(await L1ERC721.balanceOf(NON_ZERO_ADDRESS)).to.be.equal(0)

      Fake__L1CrossDomainMessenger.xDomainMessageSender.returns(
        () => DUMMY_L2_BRIDGE_ADDRESS
      )

      await L1ERC721BridgeV2.finalizeERC721Withdrawal(
        L1ERC721.address,
        DUMMY_L2_ERC721_ADDRESS,
        NON_ZERO_ADDRESS,
        NON_ZERO_ADDRESS,
        withdrawalTokenId,
        NON_NULL_BYTES32,
        { from: Fake__L1CrossDomainMessenger.address }
      )

      expect(await L1ERC721.balanceOf(NON_ZERO_ADDRESS)).to.be.equal(1)

      // deposit status changed to false
      expect(await depositStatus()).to.be.false
    })
  })
})
