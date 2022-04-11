// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IVerifierInfo {
    /**********
     * Events *
     **********/

    event AddressAdded(string indexed _name, address _address);
    event AddressRemoved(string indexed _name, address _address);

    /********************
     * Public Functions *
     ********************/

    /**
     * Add the verifier address.
     * @param _name Verifier name.
     * @param _address Verifier address.
     */
    function addAddress(string memory _name, address _address) external;

    /**
     * Remove the verifier address.
     * @param _name Verifier name.
     * @param _address Verifier address.
     */
    function removeAddress(string memory _name, address _address) external;

    /**
     * Return the addresses associated with a given name.
     * @param _name Verifier name.
     * @return Addresses associated with the given name.
     */
    function getAddresses(string memory _name) external view returns (address[] memory);

    /**
     * Returns the verifier name hash.
     * @param _address Verifier address.
     * @return Verifier name hash.
     */
    function getNameHash(address _address) external view returns (bytes32);

    /**
     * Computes the hash of a name.
     * @param _name Name to compute a hash for.
     * @return Hash of the given name.
     */
    function computeNameHash(string memory _name) external pure returns (bytes32);
}
