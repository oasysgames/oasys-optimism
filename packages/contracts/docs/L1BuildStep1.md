# L1BuildStep1



> L1BuildStep1



*L1BuildStep1 is the parial contract to build the Verse-Layer.*

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
function build(uint256 _chainId, address _sequencer, address _proposer) external nonpayable
```

Deploys the contracts of AddressManager.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _chainId | uint256 | Chain ID of the Verse-Layer network.
| _sequencer | address | Address of the Verse-Layer Sequencer.
| _proposer | address | Address of the Verse-Layer Proposer.

### initialize

```solidity
function initialize(address _agentAddress, address _paramAddress) external nonpayable
```

Sets the address of the L1BuildAgent contract.



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




