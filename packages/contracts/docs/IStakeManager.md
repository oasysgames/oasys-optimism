# IStakeManager



> IStakeManager





## Methods

### getOperatorStakes

```solidity
function getOperatorStakes(address operator, uint256 epoch) external view returns (uint256 stakes)
```

Returns the staked amount of the operator.



#### Parameters

| Name | Type | Description |
|---|---|---|
| operator | address | Operator address.
| epoch | uint256 | Target epoch number.

#### Returns

| Name | Type | Description |
|---|---|---|
| stakes | uint256 | Staked amounts.

### getTotalStake

```solidity
function getTotalStake(uint256 epoch) external view returns (uint256 stakes)
```

Returns total staked amount.



#### Parameters

| Name | Type | Description |
|---|---|---|
| epoch | uint256 | Target epoch number.

#### Returns

| Name | Type | Description |
|---|---|---|
| stakes | uint256 | Total staked amount.




