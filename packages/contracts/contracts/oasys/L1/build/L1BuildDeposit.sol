// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import { IAllowlist } from "../../libraries/IAllowlist.sol";

/**
 * @title L1BuildDeposit
 * @dev L1BuildAgent maanages OAS deposits required to build the Verse-Layer.
 */
contract L1BuildDeposit {
    /**********************
     * Contract Variables *
     **********************/

    uint256 public requiredAmount;
    uint256 public lockedBlock;
    address public allowlistAddress;
    address public agentAddress;

    mapping(address => uint256) private _depositTotal;
    mapping(address => mapping(address => uint256)) private _depositAmount;
    mapping(address => uint256) private _buildBlock;

    /**********
     * Events *
     **********/

    event Deposit(address indexed builder, address depositer, uint256 amount);
    event Withdrawal(address indexed builder, address depositer, uint256 amount);
    event Build(address indexed builder, uint256 block);

    /***************
     * Constructor *
     ***************/

    /**
     * @param _requiredAmount Required amount of the OAS token to build the Verse-Layer.
     * @param _lockedBlock Number of blocks to keep OAS tokens locked since building the Verse-Layer
     * @param _allowlist Address of the Allowlist contract.
     */
    constructor(
        uint256 _requiredAmount,
        uint256 _lockedBlock,
        address _allowlist
    ) {
        requiredAmount = _requiredAmount;
        lockedBlock = _lockedBlock;
        allowlistAddress = _allowlist;
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
        require(_builder != address(0), "builder is zero address");
        require(msg.value > 0, "no OAS");
        require(IAllowlist(allowlistAddress).containsAddress(_builder), "builder not allowed");

        address depositer = msg.sender;
        uint256 amount = msg.value;
        require(_depositTotal[_builder] + amount <= requiredAmount, "over deposit amount");

        _depositTotal[_builder] += amount;
        _depositAmount[_builder][depositer] += amount;

        emit Deposit(_builder, depositer, amount);
    }

    /**
     * Withdraw the OAS token deposited by myself.
     * @param _builder Address of the Verse-Builder.
     * @param _amount Amount of the OAS token.
     */
    function withdraw(address _builder, uint256 _amount) external {
        require(_builder != address(0), "builder is zero address");
        require(_amount > 0, "amount is zero");

        address depositer = msg.sender;
        uint256 buildBlock = _buildBlock[_builder];
        require(buildBlock == 0 || buildBlock + lockedBlock < block.number, "while OAS locked");
        require(_depositAmount[_builder][depositer] >= _amount, "your deposit amount shortage");

        _depositTotal[_builder] -= _amount;
        _depositAmount[_builder][depositer] -= _amount;
        (bool success, ) = depositer.call{ value: _amount }("");
        require(success, "OAS transfer failed");

        emit Withdrawal(_builder, depositer, _amount);
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
     * @return amount Amount of the OAS tokens by the depositer.
     */
    function getDepositAmount(address _builder, address _depositer)
        external
        view
        returns (uint256)
    {
        return _depositAmount[_builder][_depositer];
    }

    /**
     * Returns the block number built the Verse-Layer.
     * @param _builder Address of the Verse-Builder.
     * @return block Block number.
     */
    function getBuildBlock(address _builder) external view returns (uint256) {
        return _buildBlock[_builder];
    }
}
