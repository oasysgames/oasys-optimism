# L1BuildStep3



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

Deploys the contracts of CrossDomainMessenger, L1StandardBridgeProxy and L1ERC721BridgeProxy.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _chainId | uint256 | Chain ID of the Verse-Layer network.
| _builder | address | Address of the verse builder.

### initialize

```solidity
function initialize(address _agentAddress) external nonpayable
```

Sets the address of the L1BuildAgent contract.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _agentAddress | address | Address of the L1BuildAgent contract.




