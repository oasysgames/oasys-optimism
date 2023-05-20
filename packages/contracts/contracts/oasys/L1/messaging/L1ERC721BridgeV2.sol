// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/* Interface Imports */
import { IL2ERC721Bridge } from "../../L2/messaging/IL2ERC721Bridge.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/* Internal Imports */
import { L1ERC721Bridge } from "./L1ERC721Bridge.sol";

contract L1ERC721BridgeV2 is L1ERC721Bridge {
    /********************************
     * External Contract References *
     ********************************/

    // Maps the deposit status of L1 token to L2 token
    mapping(address => mapping(address => mapping(uint256 => bool))) public deposits;

    /**************
     * Depositing *
     **************/

    /**
     * @inheritdoc L1ERC721Bridge
     */
    function _initiateERC721Deposit(
        address _l1Token,
        address _l2Token,
        address _from,
        address _to,
        uint256 _tokenId,
        uint32 _l2Gas,
        bytes calldata _data
    ) internal override {
        require(!deposits[_l1Token][_l2Token][_tokenId], "Already deposited");

        // slither-disable-next-line reentrancy-events, reentrancy-benign
        IERC721(_l1Token).transferFrom(_from, address(this), _tokenId);

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

        // slither-disable-next-line reentrancy-benign
        deposits[_l1Token][_l2Token][_tokenId] = true;

        // slither-disable-next-line reentrancy-events
        emit ERC721DepositInitiated(_l1Token, _l2Token, _from, _to, _tokenId, _data);
    }

    /*************************
     * Cross-chain Functions *
     *************************/

    /**
     * @inheritdoc L1ERC721Bridge
     */
    function finalizeERC721Withdrawal(
        address _l1Token,
        address _l2Token,
        address _from,
        address _to,
        uint256 _tokenId,
        bytes calldata _data
    ) external override onlyFromCrossDomainAccount(l2ERC721Bridge) {
        require(deposits[_l1Token][_l2Token][_tokenId], "Not deposited");

        deposits[_l1Token][_l2Token][_tokenId] = false;

        // When a withdrawal is finalized on L1, the L1 Bridge transfers the funds to the withdrawer
        // slither-disable-next-line reentrancy-events
        IERC721(_l1Token).transferFrom(address(this), _to, _tokenId);

        // slither-disable-next-line reentrancy-events
        emit ERC721WithdrawalFinalized(_l1Token, _l2Token, _from, _to, _tokenId, _data);
    }
}
