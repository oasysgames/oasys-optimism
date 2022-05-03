// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* Contract Imports */
import { ERC721Holder } from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

/* Interface Imports */
import { IL1ERC721Bridge } from "./IL1ERC721Bridge.sol";
import { IL2ERC721Bridge } from "../../L2/messaging/IL2ERC721Bridge.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/* Library Imports */
import { CrossDomainEnabled } from "../../../libraries/bridge/CrossDomainEnabled.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title L1StandardBridge
 * @dev The L1 ETH and ERC20 Bridge is a contract which stores deposited L1 funds and standard
 * tokens that are in use on L2. It synchronizes a corresponding L2 Bridge, informing it of deposits
 * and listening to it for newly finalized withdrawals.
 *
 */
contract L1ERC721Bridge is IL1ERC721Bridge, CrossDomainEnabled, ERC721Holder {
    /********************************
     * External Contract References *
     ********************************/

    address public l2ERC721Bridge;

    // Maps L1 token to L2 token to balance of the L1 token deposited
    // mapping(address => mapping(address => uint256)) public deposits;

    /***************
     * Constructor *
     ***************/

    // This contract lives behind a proxy, so the constructor parameters will go unused.
    constructor() CrossDomainEnabled(address(0)) {}

    /******************
     * Initialization *
     ******************/

    /**
     * @param _l1messenger L1 Messenger address being used for cross-chain communications.
     * @param _l2ERC721Bridge L2 standard bridge address.
     */
    // slither-disable-next-line external-function
    function initialize(address _l1messenger, address _l2ERC721Bridge) public {
        require(messenger == address(0), "initialize only once");
        messenger = _l1messenger;
        l2ERC721Bridge = _l2ERC721Bridge;
    }

    /**************
     * Depositing *
     **************/

    /** @dev Modifier requiring sender to be EOA.  This check could be bypassed by a malicious
     *  contract via initcode, but it takes care of the user error we want to avoid.
     */
    modifier onlyEOA() {
        // Used to stop deposits from contracts (avoid accidentally lost tokens)
        require(!Address.isContract(msg.sender), "Account not EOA");
        _;
    }

    /**
     * @inheritdoc IL1ERC721Bridge
     */
    function depositERC721(
        address _l1Token,
        address _l2Token,
        uint256 _tokenId,
        uint32 _l2Gas,
        bytes calldata _data
    ) external virtual onlyEOA {
        _initiateERC721Deposit(_l1Token, _l2Token, msg.sender, msg.sender, _tokenId, _l2Gas, _data);
    }

    /**
     * @inheritdoc IL1ERC721Bridge
     */
    function depositERC721To(
        address _l1Token,
        address _l2Token,
        address _to,
        uint256 _tokenId,
        uint32 _l2Gas,
        bytes calldata _data
    ) external virtual {
        _initiateERC721Deposit(_l1Token, _l2Token, msg.sender, _to, _tokenId, _l2Gas, _data);
    }

    /**
     * @dev Performs the logic for deposits by informing the L2 Deposited Token
     * contract of the deposit and calling a handler to lock the L1 funds. (e.g. transferFrom)
     *
     * @param _l1Token Address of the L1 ERC721 we are depositing
     * @param _l2Token Address of the L1 respective L2 ERC721
     * @param _from Account to pull the deposit from on L1
     * @param _to Account to give the deposit to on L2
     * @param _tokenId Token Id of the ERC721 to deposit.
     * @param _l2Gas Gas limit required to complete the deposit on L2.
     * @param _data Optional data to forward to L2. This data is provided
     *        solely as a convenience for external contracts. Aside from enforcing a maximum
     *        length, these contracts provide no guarantees about its content.
     */
    function _initiateERC721Deposit(
        address _l1Token,
        address _l2Token,
        address _from,
        address _to,
        uint256 _tokenId,
        uint32 _l2Gas,
        bytes calldata _data
    ) internal {
        // When a deposit is initiated on L1, the L1 Bridge transfers the funds to itself for future
        // withdrawals. safeTransferFrom also checks if the contract has code, so this will fail if
        // _from is an EOA or address(0).
        // slither-disable-next-line reentrancy-events, reentrancy-benign
        IERC721(_l1Token).safeTransferFrom(_from, address(this), _tokenId);

        // Construct calldata for _l2Token.finalizeDeposit(_to, _tokenId)
        bytes memory message = abi.encodeWithSelector(
            IL2ERC721Bridge.finalizeDeposit.selector,
            _l1Token,
            _l2Token,
            _from,
            _to,
            _tokenId,
            _data
        );

        // Send calldata into L2
        // slither-disable-next-line reentrancy-events, reentrancy-benign
        sendCrossDomainMessage(l2ERC721Bridge, _l2Gas, message);

        // slither-disable-next-line reentrancy-events
        emit ERC721DepositInitiated(_l1Token, _l2Token, _from, _to, _tokenId, _data);
    }

    /*************************
     * Cross-chain Functions *
     *************************/

    /**
     * @inheritdoc IL1ERC721Bridge
     */
    function finalizeERC721Withdrawal(
        address _l1Token,
        address _l2Token,
        address _from,
        address _to,
        uint256 _tokenId,
        bytes calldata _data
    ) external onlyFromCrossDomainAccount(l2ERC721Bridge) {
        // When a withdrawal is finalized on L1, the L1 Bridge transfers the funds to the withdrawer
        // slither-disable-next-line reentrancy-events
        IERC721(_l1Token).safeTransferFrom(address(this), _to, _tokenId);

        // slither-disable-next-line reentrancy-events
        emit ERC721WithdrawalFinalized(_l1Token, _l2Token, _from, _to, _tokenId, _data);
    }
}
