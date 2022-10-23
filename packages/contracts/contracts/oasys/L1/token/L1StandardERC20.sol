// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @dev {ERC20} token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
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
contract L1StandardERC20 is Context, AccessControlEnumerable, ERC20Burnable, ERC20Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE` and `PAUSER_ROLE` to the
     * account that deploys the contract.
     *
     * See {ERC20-constructor}.
     */
    constructor(
        address owner,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, owner);

        _setupRole(MINTER_ROLE, owner);
        _setupRole(PAUSER_ROLE, owner);
    }

    /**
     * @dev Creates `amount` new tokens for `to`.
     *
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint256 amount) public virtual {
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "L1StandardERC20: must have minter role to mint"
        );
        _mint(to, amount);
    }

    /**
     * Bulk mint
     * @param tos List of receipient address.
     * @param amounts List of amount.
     */
    function mint(address[] memory tos, uint256[] memory amounts) public virtual {
        require(tos.length == amounts.length, "L1StandardERC20: bulk mint args must be equals");
        require(
            hasRole(MINTER_ROLE, _msgSender()),
            "L1StandardERC20: must have minter role to mint"
        );
        for (uint256 i; i < tos.length; i++) {
            _mint(tos[i], amounts[i]);
        }
    }

    /**
     * Bulk transfer
     * @param recipients List of receipient address.
     * @param amounts List of amount.
     */
    function transfer(address[] memory recipients, uint256[] memory amounts) public virtual {
        require(
            recipients.length == amounts.length,
            "L1StandardERC20: bulk transfer args must be equals"
        );
        for (uint256 i; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }

    /**
     * Bulk transferFrom
     * @param senders List of sender address.
     * @param recipients List of receipient address.
     * @param amounts List of amount.
     */
    function transferFrom(
        address[] memory senders,
        address[] memory recipients,
        uint256[] memory amounts
    ) public virtual returns (bool) {
        require(
            senders.length == recipients.length && recipients.length == amounts.length,
            "L1StandardERC20: bulk transfer args must be equals"
        );
        for (uint256 i; i < senders.length; i++) {
            transferFrom(senders[i], recipients[i], amounts[i]);
        }
        return true;
    }

    /**
     * @dev Pauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_pause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function pause() public virtual {
        require(
            hasRole(PAUSER_ROLE, _msgSender()),
            "L1StandardERC20: must have pauser role to pause"
        );
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * See {ERC20Pausable} and {Pausable-_unpause}.
     *
     * Requirements:
     *
     * - the caller must have the `PAUSER_ROLE`.
     */
    function unpause() public virtual {
        require(
            hasRole(PAUSER_ROLE, _msgSender()),
            "L1StandardERC20: must have pauser role to unpause"
        );
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
