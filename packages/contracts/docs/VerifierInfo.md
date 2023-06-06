# VerifierInfo









## Methods

### addAddress

```solidity
function addAddress(string _name, address _address) external nonpayable
```

Add the verifier address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _name | string | Verifier name.
| _address | address | Verifier address.

### computeNameHash

```solidity
function computeNameHash(string _name) external pure returns (bytes32)
```

Computes the hash of a name.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _name | string | Name to compute a hash for.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | Hash of the given name.

### getAddresses

```solidity
function getAddresses(string _name) external view returns (address[])
```

Return the addresses associated with a given name.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _name | string | Verifier name.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | Addresses associated with the given name.

### getNameHash

```solidity
function getNameHash(address _address) external view returns (bytes32)
```

Returns the verifier name hash.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _address | address | Verifier address.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | Verifier name hash.

### removeAddress

```solidity
function removeAddress(string _name, address _address) external nonpayable
```

Remove the verifier address.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _name | string | Verifier name.
| _address | address | Verifier address.



## Events

### AddressAdded

```solidity
event AddressAdded(string indexed _name, address _address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _name `indexed` | string | undefined |
| _address  | address | undefined |

### AddressRemoved

```solidity
event AddressRemoved(string indexed _name, address _address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _name `indexed` | string | undefined |
| _address  | address | undefined |



