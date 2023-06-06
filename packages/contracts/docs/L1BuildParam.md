# L1BuildParam



> L1BuildParam



*L1BuildParam has parameters and contract code for Verse-Layer builds.*

## Methods

### enqueueGasCost

```solidity
function enqueueGasCost() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### fraudProofWindow

```solidity
function fraudProofWindow() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### l1ERC721BridgeCode

```solidity
function l1ERC721BridgeCode() external view returns (bytes)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined

### l1ERC721BridgeCodeHash

```solidity
function l1ERC721BridgeCodeHash() external view returns (bytes32)
```

Returns the code hash of the L1ERC721Bridge code.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined

### l1StandardBridgeCode

```solidity
function l1StandardBridgeCode() external view returns (bytes)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined

### l1StandardBridgeCodeHash

```solidity
function l1StandardBridgeCodeHash() external view returns (bytes32)
```

Returns the code hash of the L1StandardBridge code.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined

### l2GasDiscountDivisor

```solidity
function l2GasDiscountDivisor() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### maxTransactionGasLimit

```solidity
function maxTransactionGasLimit() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### sequencerPublishWindow

```solidity
function sequencerPublishWindow() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### setL1ERC721BridgeCode

```solidity
function setL1ERC721BridgeCode(bytes _code) external nonpayable
```

Sets the code of the L1ERC721Bridge code.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _code | bytes | Code of the L1ERC721Bridge code.

### setL1StandardBridgeCode

```solidity
function setL1StandardBridgeCode(bytes _code) external nonpayable
```

Sets the code of the L1StandardBridge code.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _code | bytes | Code of the L1StandardBridge code.




