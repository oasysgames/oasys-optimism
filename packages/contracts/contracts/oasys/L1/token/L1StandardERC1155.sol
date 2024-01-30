// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @dev {ERC1155} token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - allow to receive ERC1155 tokens
 *  - a minter role that allows for token minting (creation)
 *  - a pauser role that allows to stop all token transfers
 *
 * This contract uses {AccessControl} to lock permissioned functions using the
 * different roles - head to its documentation for details.
 *
 * The account that deploys the contract will be granted the minter and pauser
 * roles, as well as the default admin role, which will let it grant both minter
 * and pauser roles to other accounts.
 */
contract L1StandardERC1155 is Context, AccessControlEnumerable, ERC1155Burnable, ERC1155Pausable, ERC1155Holder {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` to the
     * account that deploys the contract.
     *
     * See {ERC1155-constructor}.
     */
    constructor(
        address owner,
        string memory uri_
    ) ERC1155(uri_) {
        _setupRole(DEFAULT_ADMIN_ROLE, owner);

        _setupRole(MINTER_ROLE, owner);
        _setupRole(PAUSER_ROLE, owner);
    }

    /**
     * @dev Creates `amount` new tokens for `to`.
     *
     * See {ERC1155-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual {
        // bellow validation is done by _mint
        // require(account != address(0));

        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "L1StandardERC1155: must have minter role to mint"
        );
        _mint(account, id, amount, data);
    }

    /**
     * Bulk mint
     * @param tos List of receipient address.
     * @param ids List of token id.
     * @param amounts List of amount.
     * @param data Data to pass to onERC1155Received() function when minting.
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual {
        // bellow validation is done by _mintBatch
        // require(to != address(0));
        // require(ids.length == amounts.length);
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "L1StandardERC1155: must have minter role to mint"
        );
        _mintBatch(to, ids, amounts, data);
    }

    // bulk transfer is supported by ERC1155
    // function safeBatchTransferFrom(...)

    // bulk burn is supported by ERC1155Burnable
    // function burnBatch(...)

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC1155Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public virtual {
        require(
            hasRole(PAUSER_ROLE, _msgSender()),
            "L1StandardERC1155: must have pauser role to pause"
        );
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC1155Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public virtual {
        require(
            hasRole(PAUSER_ROLE, _msgSender()),
            "L1StandardERC1155: must have pauser role to unpause"
        );
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC1155, ERC1155Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
