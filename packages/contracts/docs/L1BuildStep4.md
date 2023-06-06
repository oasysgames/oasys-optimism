# L1BuildStep4



> L1BuildStep3



*L1BuildStep3 is the parial contract to build the Verse-Layer.*

## Methods

### agentAddress

```solidity
function agentAddress() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### build

```solidity
function build(uint256 _chainId, address _builder) external nonpayable
```

Deploys the contracts of L1StandardBridge and L1ERC721Bridge.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _chainId | uint256 | Chain ID of the Verse-Layer network.
| _builder | address | Address of the verse builder.

### initialize

```solidity
function initialize(address _agentAddress, address _paramAddress) external nonpayable
```

Sets the addresses of the L1BuildAgent and L1BuildParam contract.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _agentAddress | address | Address of the L1BuildAgent contract.
| _paramAddress | address | Address of the L1BuildParam contract.

### paramAddress

```solidity
function paramAddress() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined




