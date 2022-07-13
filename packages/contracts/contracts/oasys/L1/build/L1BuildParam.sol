// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/**
 * @title L1BuildParam
 * @dev L1BuildParam has parameters and contract code for Verse-Layer builds.
 */
contract L1BuildParam {
    /**********************
     * Contract Variables *
     **********************/

    uint256 public maxTransactionGasLimit;
    uint256 public l2GasDiscountDivisor;
    uint256 public enqueueGasCost;
    uint256 public fraudProofWindow;
    uint256 public sequencerPublishWindow;
    bytes public l1StandardBridgeCode;
    bytes public l1ERC721BridgeCode;

    /***************
     * Constructor *
     ***************/

    /**
     * @param _maxTransactionGasLimit Max transaction gas limit.
     * @param _l2GasDiscountDivisor L2(Vserse-Layer) gas discount divisor.
     * @param _enqueueGasCost Enqueue gas cost.
     * @param _fraudProofWindow Fraud proof window.
     * @param _sequencerPublishWindow Sequencer publish window.
     */
    constructor(
        uint256 _maxTransactionGasLimit,
        uint256 _l2GasDiscountDivisor,
        uint256 _enqueueGasCost,
        uint256 _fraudProofWindow,
        uint256 _sequencerPublishWindow
    ) {
        maxTransactionGasLimit = _maxTransactionGasLimit;
        l2GasDiscountDivisor = _l2GasDiscountDivisor;
        enqueueGasCost = _enqueueGasCost;
        fraudProofWindow = _fraudProofWindow;
        sequencerPublishWindow = _sequencerPublishWindow;
    }

    /********************
     * Public Functions *
     ********************/

    /**
     * Sets the code of the L1StandardBridge code.
     * @param _code Code of the L1StandardBridge code.
     */
    function setL1StandardBridgeCode(bytes memory _code) external {
        require(l1StandardBridgeCode.length == 0, "the code has already been set");
        l1StandardBridgeCode = _code;
    }

    /**
     * Sets the code of the L1ERC721Bridge code.
     * @param _code Code of the L1ERC721Bridge code.
     */
    function setL1ERC721BridgeCode(bytes memory _code) external {
        require(l1ERC721BridgeCode.length == 0, "the code has already been set");
        l1ERC721BridgeCode = _code;
    }

    /**
     * Returns the code hash of the L1StandardBridge code.
     */
    function l1StandardBridgeCodeHash() external view returns (bytes32) {
        return keccak256(l1StandardBridgeCode);
    }

    /**
     * Returns the code hash of the L1ERC721Bridge code.
     */
    function l1ERC721BridgeCodeHash() external view returns (bytes32) {
        return keccak256(l1ERC721BridgeCode);
    }
}
