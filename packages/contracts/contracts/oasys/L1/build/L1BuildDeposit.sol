// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/* External Imports */
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/* Internal Imports */
import { IAllowlist } from "../../libraries/IAllowlist.sol";

/**
 * @title L1BuildDeposit
 * @dev L1BuildAgent manages OAS and ERC20 deposits required to build the Verse-Layer.
 */
contract L1BuildDeposit {
    /**********************
     * Contract Variables *
     **********************/

    address private constant OAS = address(0);

    uint256 public requiredAmount;
    uint256 public lockedBlock;
    address public allowlistAddress;
    address public agentAddress;
    address[] public allowedTokens;

    mapping(address => uint256) private _depositTotal;
    mapping(address => mapping(address => mapping(address => uint256))) private _depositAmount;
    mapping(address => uint256) private _buildBlock;

    /**********
     * Events *
     **********/

    event Deposit(address indexed builder, address depositer, address token, uint256 amount);
    event Withdrawal(address indexed builder, address depositer, address token, uint256 amount);
    event Build(address indexed builder, uint256 block);

    /***************
     * Constructor *
     ***************/

    /**
     * @param _requiredAmount Required amount of token to build the Verse-Layer.
     * @param _lockedBlock Number of blocks to keep tokens locked since building the Verse-Layer
     * @param _allowlist Address of the Allowlist contract.
     * @param _allowedTokens Address list of ERC20 tokens that allow deposits.
     */
    constructor(
        uint256 _requiredAmount,
        uint256 _lockedBlock,
        address _allowlist,
        address[] memory _allowedTokens
    ) {
        requiredAmount = _requiredAmount;
        lockedBlock = _lockedBlock;
        allowlistAddress = _allowlist;
        allowedTokens = _allowedTokens;
    }

    /********************
     * Public Functions *
     ********************/

    /**
     * Sets the address of the L1BuildAgent contract.
     * @param _agentAddress Address of the L1BuildAgent contract.
     */
    function initialize(address _agentAddress) external {
        require(agentAddress == address(0), "initialize only once");
        agentAddress = _agentAddress;
    }

    /**
     * Deposits the OAS token for the Verse-Builder.
     * @param _builder Address of the Verse-Builder.
     */
    function deposit(address _builder) external payable {
        address depositer = msg.sender;
        uint256 amount = msg.value;
        _deposit(_builder, depositer, OAS, amount);

        emit Deposit(_builder, depositer, OAS, amount);
    }

    /**
     * Deposits the ERC20 token for the Verse-Builder.
     * @param _builder Address of the Verse-Builder.
     * @param _token Address of the ERC20 token.
     * @param _amount Amount of the ERC20 token.
     */
    function depositERC20(
        address _builder,
        address _token,
        uint256 _amount
    ) external {
        require(_contains(allowedTokens, _token), "ERC20 not allowed");

        address depositer = msg.sender;
        _deposit(_builder, depositer, _token, _amount);

        bool success = IERC20(_token).transferFrom(depositer, address(this), _amount);
        require(success, "ERC20 transfer failed");

        emit Deposit(_builder, depositer, _token, _amount);
    }

    /**
     * Withdraw the OAS token deposited by myself.
     * @param _builder Address of the Verse-Builder.
     * @param _amount Amount of the OAS token.
     */
    function withdraw(address _builder, uint256 _amount) external {
        address depositer = msg.sender;
        _withdraw(_builder, depositer, OAS, _amount);

        (bool success, ) = depositer.call{ value: _amount }("");
        require(success, "OAS transfer failed");

        emit Withdrawal(_builder, depositer, OAS, _amount);
    }

    /**
     * Withdraw the ERC20 token deposited by myself.
     * @param _builder Address of the Verse-Builder.
     * @param _token Address of the ERC20 token.
     * @param _amount Amount of the ERC20 token.
     */
    function withdrawERC20(
        address _builder,
        address _token,
        uint256 _amount
    ) external {
        require(_contains(allowedTokens, _token), "ERC20 not allowed");

        address depositer = msg.sender;
        _withdraw(_builder, depositer, _token, _amount);

        bool success = IERC20(_token).transfer(depositer, _amount);
        require(success, "ERC20 transfer failed");

        emit Withdrawal(_builder, depositer, _token, _amount);
    }

    /**
     * Build if the required amount of the OAS tokens is deposited.
     * @param _builder Address of the Verse-Builder.
     */
    function build(address _builder) external {
        require(msg.sender == agentAddress, "only L1BuildAgent can call me");
        require(_depositTotal[_builder] >= requiredAmount, "deposit amount shortage");
        require(_buildBlock[_builder] == 0, "already built by builder");

        _buildBlock[_builder] = block.number;

        emit Build(_builder, block.number);
    }

    /**
     * Returns the total amount of the OAS tokens.
     * @param _builder Address of the Verse-Builder.
     * @return amount Total amount of the OAS tokens.
     */
    function getDepositTotal(address _builder) external view returns (uint256) {
        return _depositTotal[_builder];
    }

    /**
     * Returns the amount of the OAS tokens by the depositer.
     * @param _builder Address of the Verse-Builder.
     * @param _depositer Address of the depositer.
     * @return amount Amount of the tokens by the depositer.
     */
    function getDepositAmount(address _builder, address _depositer)
        external
        view
        returns (uint256)
    {
        return _depositAmount[OAS][_builder][_depositer];
    }

    /**
     * Returns the amount of the OAS tokens by the depositer.
     * @param _builder Address of the Verse-Builder.
     * @param _depositer Address of the depositer.
     * @param _token Address of the token.
     * @return amount Amount of the tokens by the depositer.
     */
    function getDepositERC20Amount(
        address _builder,
        address _depositer,
        address _token
    ) external view returns (uint256) {
        return _depositAmount[_token][_builder][_depositer];
    }

    /**
     * Returns the block number built the Verse-Layer.
     * @param _builder Address of the Verse-Builder.
     * @return block Block number.
     */
    function getBuildBlock(address _builder) external view returns (uint256) {
        return _buildBlock[_builder];
    }

    /**********************
     * Internal Functions *
     **********************/

    function _deposit(
        address _builder,
        address _depositer,
        address _token,
        uint256 _amount
    ) internal {
        require(_builder != address(0), "builder is zero address");
        require(IAllowlist(allowlistAddress).containsAddress(_builder), "builder not allowed");
        require(_amount > 0, "amount is zero");
        require(_depositTotal[_builder] + _amount <= requiredAmount, "over deposit amount");

        _depositTotal[_builder] += _amount;
        _depositAmount[_token][_builder][_depositer] += _amount;
    }

    function _withdraw(
        address _builder,
        address _depositer,
        address _token,
        uint256 _amount
    ) internal {
        require(_builder != address(0), "builder is zero address");
        require(_amount > 0, "amount is zero");

        uint256 buildBlock = _buildBlock[_builder];
        require(buildBlock == 0 || buildBlock + lockedBlock < block.number, "while locked");
        require(
            _depositAmount[_token][_builder][_depositer] >= _amount,
            "your deposit amount shortage"
        );

        _depositTotal[_builder] -= _amount;
        _depositAmount[_token][_builder][_depositer] -= _amount;
    }

    function _contains(address[] memory list, address item) internal pure returns (bool) {
        uint256 length = list.length;
        for (uint256 i = 0; i < length; i++) {
            if (list[i] == item) {
                return true;
            }
        }
        return false;
    }
}
