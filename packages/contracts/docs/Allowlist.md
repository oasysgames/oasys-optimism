# Allowlist



> Allowlist



*Allowlist manages the allowed addresses. This contract allows all addresses after renouncing ownership.*

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

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### removeAddress

```solidity
function removeAddress(address _address) external nonpayable
```

Remove the address from the allowlist.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _address | address | Removed address.

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined



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

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |



