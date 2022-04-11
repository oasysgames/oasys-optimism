// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IVerifierInfo.sol";

contract VerifierInfo is IVerifierInfo {
    /*************
     * Variables *
     *************/

    mapping(bytes32 => address[]) private addresses;
    mapping(address => bytes32) private verifiers;

    /********************
     * Public Functions *
     ********************/

    /**
     * Add the verifier address.
     * @param _name Verifier name.
     * @param _address Verifier address.
     */
    function addAddress(string memory _name, address _address) external {
        require(verifiers[_address] == 0, "already added");
        bytes32 nameHash = _computeNameHash(_name);
        address[] storage currentAddresses = addresses[nameHash];
        require(
            currentAddresses.length == 0 || _contains(currentAddresses, msg.sender),
            "only the contained address is allowed"
        );

        currentAddresses.push(_address);
        verifiers[_address] = nameHash;

        emit AddressAdded(_name, _address);
    }

    /**
     * Remove the verifier address.
     * @param _name Verifier name.
     * @param _address Verifier address.
     */
    function removeAddress(string memory _name, address _address) external {
        bytes32 nameHash = _computeNameHash(_name);
        require(nameHash == verifiers[_address], "name not matched");
        address[] storage currentAddresses = addresses[nameHash];
        require(_contains(currentAddresses, msg.sender), "only the contained address is allowed");

        uint256 length = currentAddresses.length;
        bool addressMatched = false;
        for (uint256 i = 0; i < length - 1; i++) {
            if (!addressMatched && currentAddresses[i] == _address) {
                addressMatched = true;
            }
            if (addressMatched) {
                currentAddresses[i] = currentAddresses[i + 1];
            }
        }
        currentAddresses.pop();
        delete verifiers[_address];

        emit AddressRemoved(_name, _address);
    }

    /**
     * Return the addresses associated with a given name.
     * @param _name Verifier name.
     * @return Addresses associated with the given name.
     */
    function getAddresses(string memory _name) external view returns (address[] memory) {
        return addresses[_computeNameHash(_name)];
    }

    /**
     * Returns the verifier name hash.
     * @param _address Verifier address.
     * @return Verifier name hash.
     */
    function getNameHash(address _address) external view returns (bytes32) {
        return verifiers[_address];
    }

    /**
     * Computes the hash of a name.
     * @param _name Name to compute a hash for.
     * @return Hash of the given name.
     */
    function computeNameHash(string memory _name) external pure returns (bytes32) {
        return _computeNameHash(_name);
    }

    /**********************
     * Internal Functions *
     **********************/

    /**
     * Computes the hash of a name.
     * @param _name Name to compute a hash for.
     * @return Hash of the given name.
     */
    function _computeNameHash(string memory _name) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_name));
    }

    /**
     * Check if the array of address contains the address.
     * @param _addresses Array of address.
     * @param _address address.
     * @return Contains of not.
     */
    function _contains(address[] memory _addresses, address _address) internal pure returns (bool) {
        uint256 length = _addresses.length;
        for (uint256 i = 0; i < length; i++) {
            if (_addresses[i] == _address) {
                return true;
            }
        }
        return false;
    }
}
