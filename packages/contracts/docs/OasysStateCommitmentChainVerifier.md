# OasysStateCommitmentChainVerifier



> OasysStateCommitmentChainVerifier



*The Oasys State Commitment Chain Verifier is a contract that verifies based on the verifier&#39;s total stake.*

## Methods

### approve

```solidity
function approve(address stateCommitmentChain, Lib_OVMCodec.ChainBatchHeader batchHeader, bytes[] signatures) external nonpayable
```

Approve the state batch.



#### Parameters

| Name | Type | Description |
|---|---|---|
| stateCommitmentChain | address | Address of the target OasysStateCommitmentChain.
| batchHeader | Lib_OVMCodec.ChainBatchHeader | Target batch header.
| signatures | bytes[] | List of signatures.

### reject

```solidity
function reject(address stateCommitmentChain, Lib_OVMCodec.ChainBatchHeader batchHeader, bytes[] signatures) external nonpayable
```

Reject the state batch.



#### Parameters

| Name | Type | Description |
|---|---|---|
| stateCommitmentChain | address | Address of the target OasysStateCommitmentChain.
| batchHeader | Lib_OVMCodec.ChainBatchHeader | Target batch header.
| signatures | bytes[] | List of signatures.



## Events

### StateBatchApproved

```solidity
event StateBatchApproved(address indexed stateCommitmentChain, uint256 indexed batchIndex, bytes32 batchRoot)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| stateCommitmentChain `indexed` | address | undefined |
| batchIndex `indexed` | uint256 | undefined |
| batchRoot  | bytes32 | undefined |

### StateBatchRejected

```solidity
event StateBatchRejected(address indexed stateCommitmentChain, uint256 indexed batchIndex, bytes32 batchRoot)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| stateCommitmentChain `indexed` | address | undefined |
| batchIndex `indexed` | uint256 | undefined |
| batchRoot  | bytes32 | undefined |



## Errors

### InvalidAddressSort

```solidity
error InvalidAddressSort(address signer)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| signer | address | undefined |

### InvalidSignature

```solidity
error InvalidSignature(bytes signature, string reason)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| signature | bytes | undefined |
| reason | string | undefined |

### StakeAmountShortage

```solidity
error StakeAmountShortage(uint256 required, uint256 verified)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| required | uint256 | undefined |
| verified | uint256 | undefined |


