# L1BuildDeposit



> L1BuildDeposit



*L1BuildAgent manages OAS and ERC20 deposits required to build the Verse-Layer.*

## Methods

### agentAddress

```solidity
function agentAddress() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### allowedTokens

```solidity
function allowedTokens(uint256) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### allowlistAddress

```solidity
function allowlistAddress() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### build

```solidity
function build(address _builder) external nonpayable
```

Build if the required amount of the OAS tokens is deposited.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _builder | address | Address of the Verse-Builder.

### deposit

```solidity
function deposit(address _builder) external payable
```

Deposits the OAS token for the Verse-Builder.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _builder | address | Address of the Verse-Builder.

### depositERC20

```solidity
function depositERC20(address _builder, address _token, uint256 _amount) external nonpayable
```

Deposits the ERC20 token for the Verse-Builder.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _builder | address | Address of the Verse-Builder.
| _token | address | Address of the ERC20 token.
| _amount | uint256 | Amount of the ERC20 token.

### getBuildBlock

```solidity
function getBuildBlock(address _builder) external view returns (uint256)
```

Returns the block number built the Verse-Layer.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _builder | address | Address of the Verse-Builder.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | block Block number.

### getDepositAmount

```solidity
function getDepositAmount(address _builder, address _depositer) external view returns (uint256)
```

Returns the amount of the OAS tokens by the depositer.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _builder | address | Address of the Verse-Builder.
| _depositer | address | Address of the depositer.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | amount Amount of the tokens by the depositer.

### getDepositERC20Amount

```solidity
function getDepositERC20Amount(address _builder, address _depositer, address _token) external view returns (uint256)
```

Returns the amount of the OAS tokens by the depositer.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _builder | address | Address of the Verse-Builder.
| _depositer | address | Address of the depositer.
| _token | address | Address of the token.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | amount Amount of the tokens by the depositer.

### getDepositTotal

```solidity
function getDepositTotal(address _builder) external view returns (uint256)
```

Returns the total amount of the OAS tokens.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _builder | address | Address of the Verse-Builder.

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | amount Total amount of the OAS tokens.

### initialize

```solidity
function initialize(address _agentAddress) external nonpayable
```

Sets the address of the L1BuildAgent contract.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _agentAddress | address | Address of the L1BuildAgent contract.

### lockedBlock

```solidity
function lockedBlock() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### requiredAmount

```solidity
function requiredAmount() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### withdraw

```solidity
function withdraw(address _builder, uint256 _amount) external nonpayable
```

Withdraw the OAS token deposited by myself.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _builder | address | Address of the Verse-Builder.
| _amount | uint256 | Amount of the OAS token.

### withdrawERC20

```solidity
function withdrawERC20(address _builder, address _token, uint256 _amount) external nonpayable
```

Withdraw the ERC20 token deposited by myself.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _builder | address | Address of the Verse-Builder.
| _token | address | Address of the ERC20 token.
| _amount | uint256 | Amount of the ERC20 token.



## Events

### Build

```solidity
event Build(address indexed builder, uint256 block)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| builder `indexed` | address | undefined |
| block  | uint256 | undefined |

### Deposit

```solidity
event Deposit(address indexed builder, address depositer, address token, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| builder `indexed` | address | undefined |
| depositer  | address | undefined |
| token  | address | undefined |
| amount  | uint256 | undefined |

### Withdrawal

```solidity
event Withdrawal(address indexed builder, address depositer, address token, uint256 amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| builder `indexed` | address | undefined |
| depositer  | address | undefined |
| token  | address | undefined |
| amount  | uint256 | undefined |



