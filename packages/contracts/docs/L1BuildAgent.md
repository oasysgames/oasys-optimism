# L1BuildAgent



> L1BuildAgent



*L1BuildAgent deploys the contracts needed to build Verse-Layer(L2) on Hub-Layer(L1).*

## Methods

### build

```solidity
function build(uint256 _chainId, address _sequencer, address _proposer) external nonpayable
```

Deploys the contracts needed to build Verse-Layer(L2) on Hub-Layer(L1).



#### Parameters

| Name | Type | Description |
|---|---|---|
| _chainId | uint256 | Chain ID of the Verse-Layer network.
| _sequencer | address | Address of the Verse-Layer Sequencer.
| _proposer | address | Address of the Verse-Layer Proposer.

### depositAddress

```solidity
function depositAddress() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### getAddressManager

```solidity
function getAddressManager(uint256 _chainId) external view returns (address)
```

Returns the address of the AddressManager contract of the Chain ID.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _chainId | uint256 | Chain ID of the Verse-Layer network.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | _proposer Address of the Verse-Layer Proposer.

### getBuilts

```solidity
function getBuilts(uint256 cursor, uint256 howMany) external view returns (address[], uint256[], uint256)
```

Returns an array of Builder and Chain ID of built Verse-Layers.



#### Parameters

| Name | Type | Description |
|---|---|---|
| cursor | uint256 | The index of the first item being requested.
| howMany | uint256 | Indicates how many items should be returned.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | (builders, chainIds, newCursor) Array of Builder and Chain ID of built Verse-Layers.
| _1 | uint256[] | undefined
| _2 | uint256 | undefined

### getNamedAddress

```solidity
function getNamedAddress(uint256 _chainId, string _name) external view returns (address)
```

Returns the address of the Verse-Layer contract on Hub-Layer.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _chainId | uint256 | Chain ID of the Verse-Layer network.
| _name | string | Name of the Verse-Layer contract on Hub-Layer.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | address Address of the Verse-Layer contract on Hub-Layer.

### getNamedAddresses

```solidity
function getNamedAddresses(uint256 _chainId) external view returns (string[], address[])
```

Returns the array of the name and address of the Verse-Layer contracts on Hub-Layer.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _chainId | uint256 | Chain ID of the Verse-Layer network.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string[] | (names, addresses) Array of the name and address of the Verse-Layer contracts on Hub-Layer.
| _1 | address[] | undefined

### setStep1Addresses

```solidity
function setStep1Addresses(uint256 _chainId, address _addressManager, address _sequencer, address _proposer, address _canonicalTransactionChain, address _ctcBatches) external nonpayable
```

Sets the addresses of AddressManager, Sequencer and Proposer.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _chainId | uint256 | Chain ID of the Verse-Layer network.
| _addressManager | address | Address of the Verse-Layer AddressManager contract.
| _sequencer | address | Address of the Verse-Layer Sequencer.
| _proposer | address | Address of the Verse-Layer Proposer.
| _canonicalTransactionChain | address | Address of the CanonicalTransactionChain contract.
| _ctcBatches | address | Address of the CTC-Batches contract.

### setStep2Addresses

```solidity
function setStep2Addresses(uint256 _chainId, address _stateCommitmentChain, address _sccBatches, address _bondManager) external nonpayable
```

Sets the addresses of CanonicalTransactionChain, CTC-Batches, StateCommitmentChain , SCC-Batches and BondManager.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _chainId | uint256 | Chain ID of the Verse-Layer network.
| _stateCommitmentChain | address | Address of the StateCommitmentChain contract.
| _sccBatches | address | Address of the SCC-Batches contract.
| _bondManager | address | Address of the BondManager contract.

### setStep3Addresses

```solidity
function setStep3Addresses(uint256 _chainId, address _l1CrossDomainMessenger, address _l1CrossDomainMessengerProxy, address _l1StandardBridgeProxy, address _l1ERC721BridgeProxy) external nonpayable
```

Sets the addresses of L1CrossDomainMessenger, L1CrossDomainMessengerProxy L1StandardBridgeProxy, L1ERC721BridgeProxy



#### Parameters

| Name | Type | Description |
|---|---|---|
| _chainId | uint256 | Chain ID of the Verse-Layer network.
| _l1CrossDomainMessenger | address | Address of the L1CrossDomainMessenger contract.
| _l1CrossDomainMessengerProxy | address | Address of the L1CrossDomainMessengerProxy contract.
| _l1StandardBridgeProxy | address | Address of the L1StandardBridgeProxy contract.
| _l1ERC721BridgeProxy | address | Address of the L1ERC721BridgeProxy contract.

### step1Address

```solidity
function step1Address() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### step2Address

```solidity
function step2Address() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### step3Address

```solidity
function step3Address() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### step4Address

```solidity
function step4Address() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined



## Events

### Build

```solidity
event Build(address indexed builder, uint256 indexed chainId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| builder `indexed` | address | undefined |
| chainId `indexed` | uint256 | undefined |



