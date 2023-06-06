# OasysStateCommitmentChain



> OasysStateCommitmentChain



*The Oasys State Commitment Chain is the contract that adds verifiability by the verifier to the State Commitment Chain (SCC).*

## Methods

### FRAUD_PROOF_WINDOW

```solidity
function FRAUD_PROOF_WINDOW() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### SEQUENCER_PUBLISH_WINDOW

```solidity
function SEQUENCER_PUBLISH_WINDOW() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### appendStateBatch

```solidity
function appendStateBatch(bytes32[] _batch, uint256 _shouldStartAtElement) external nonpayable
```

Appends a batch of state roots to the chain.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _batch | bytes32[] | Batch of state roots.
| _shouldStartAtElement | uint256 | Index of the element at which this batch should start.

### batches

```solidity
function batches() external view returns (contract IChainStorageContainer)
```

Accesses the batch storage container.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IChainStorageContainer | Reference to the batch storage container.

### deleteStateBatch

```solidity
function deleteStateBatch(Lib_OVMCodec.ChainBatchHeader _batchHeader) external nonpayable
```

Deletes all state roots after (and including) a given batch.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _batchHeader | Lib_OVMCodec.ChainBatchHeader | Header of the batch to start deleting from.

### failVerification

```solidity
function failVerification(Lib_OVMCodec.ChainBatchHeader _batchHeader) external nonpayable
```

Method called by the OasysStateCommitmentChainVerifier after a verification failure.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _batchHeader | Lib_OVMCodec.ChainBatchHeader | Target batch header.

### getLastSequencerTimestamp

```solidity
function getLastSequencerTimestamp() external view returns (uint256 _lastSequencerTimestamp)
```

Retrieves the timestamp of the last batch submitted by the sequencer.




#### Returns

| Name | Type | Description |
|---|---|---|
| _lastSequencerTimestamp | uint256 | Last sequencer batch timestamp.

### getTotalBatches

```solidity
function getTotalBatches() external view returns (uint256 _totalBatches)
```

Retrieves the total number of batches submitted.




#### Returns

| Name | Type | Description |
|---|---|---|
| _totalBatches | uint256 | Total submitted batches.

### getTotalElements

```solidity
function getTotalElements() external view returns (uint256 _totalElements)
```

Retrieves the total number of elements submitted.




#### Returns

| Name | Type | Description |
|---|---|---|
| _totalElements | uint256 | Total submitted elements.

### insideFraudProofWindow

```solidity
function insideFraudProofWindow(Lib_OVMCodec.ChainBatchHeader _batchHeader) external view returns (bool _inside)
```

Checks whether a given batch has exceeded the verification threshold, or is still inside its fraud proof window.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _batchHeader | Lib_OVMCodec.ChainBatchHeader | Header of the batch to check.

#### Returns

| Name | Type | Description |
|---|---|---|
| _inside | bool | Whether or not the batch is verified, or inside the fraud proof window.

### libAddressManager

```solidity
function libAddressManager() external view returns (contract Lib_AddressManager)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract Lib_AddressManager | undefined

### nextIndex

```solidity
function nextIndex() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### resolve

```solidity
function resolve(string _name) external view returns (address)
```

Resolves the address associated with a given name.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _name | string | Name to resolve an address for.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | Address associated with the given name.

### succeedVerification

```solidity
function succeedVerification(Lib_OVMCodec.ChainBatchHeader _batchHeader) external nonpayable
```

Method called by the OasysStateCommitmentChainVerifier after a verification successful.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _batchHeader | Lib_OVMCodec.ChainBatchHeader | Target batch header.

### verifyStateCommitment

```solidity
function verifyStateCommitment(bytes32 _element, Lib_OVMCodec.ChainBatchHeader _batchHeader, Lib_OVMCodec.ChainInclusionProof _proof) external view returns (bool)
```

Verifies a batch inclusion proof.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _element | bytes32 | Hash of the element to verify a proof for.
| _batchHeader | Lib_OVMCodec.ChainBatchHeader | Header of the batch in which the element was included.
| _proof | Lib_OVMCodec.ChainInclusionProof | Merkle inclusion proof for the element.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined



## Events

### StateBatchAppended

```solidity
event StateBatchAppended(uint256 indexed _batchIndex, bytes32 _batchRoot, uint256 _batchSize, uint256 _prevTotalElements, bytes _extraData)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _batchIndex `indexed` | uint256 | undefined |
| _batchRoot  | bytes32 | undefined |
| _batchSize  | uint256 | undefined |
| _prevTotalElements  | uint256 | undefined |
| _extraData  | bytes | undefined |

### StateBatchDeleted

```solidity
event StateBatchDeleted(uint256 indexed _batchIndex, bytes32 _batchRoot)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _batchIndex `indexed` | uint256 | undefined |
| _batchRoot  | bytes32 | undefined |

### StateBatchFailed

```solidity
event StateBatchFailed(uint256 indexed _batchIndex, bytes32 _batchRoot)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _batchIndex `indexed` | uint256 | undefined |
| _batchRoot  | bytes32 | undefined |

### StateBatchVerified

```solidity
event StateBatchVerified(uint256 indexed _batchIndex, bytes32 _batchRoot)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _batchIndex `indexed` | uint256 | undefined |
| _batchRoot  | bytes32 | undefined |



