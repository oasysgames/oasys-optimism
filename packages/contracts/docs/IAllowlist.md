# IAllowlist



> IAllowlist



*Allowlist interface.*

## Methods

### addAddress

```solidity
function addAddress(address _address) external nonpayable
```

Add the address into the allowlist.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _address | address | Allowed address.

### containsAddress

```solidity
function containsAddress(address _address) external view returns (bool)
```

Check if the allowlist contains the address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _address | address | Target address.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### getAllowlist

```solidity
function getAllowlist() external view returns (address[])
```

Returns the allowlist.




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | undefined

### removeAddress

```solidity
function removeAddress(address _address) external nonpayable
```

Remove the address from the allowlist.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _address | address | Removed address.



## Events

### AllowlistAdded

```solidity
event AllowlistAdded(address _address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _address  | address | undefined |

### AllowlistRemoved

```solidity
event AllowlistRemoved(address _address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _address  | address | undefined |



