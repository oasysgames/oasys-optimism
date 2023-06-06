# L2StandardTokenFactoryV2



> L2StandardTokenFactoryV2



*It includes all the features of the {L2StandardTokenFactory}. Additionally, a method has been added to create burnable L2 token.*

## Methods

### createBurnableL2Token

```solidity
function createBurnableL2Token(address _l1Token, string _name, string _symbol) external nonpayable
```



*Creates an instance of the burnable ERC20 token on L2.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _l1Token | address | Address of the corresponding L1 token.
| _name | string | ERC20 name.
| _symbol | string | ERC20 symbol.

### createStandardL2Token

```solidity
function createStandardL2Token(address _l1Token, string _name, string _symbol) external nonpayable
```



*Creates an instance of the standard ERC20 token on L2.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _l1Token | address | Address of the corresponding L1 token.
| _name | string | ERC20 name.
| _symbol | string | ERC20 symbol.



## Events

### BurnableL2TokenCreated

```solidity
event BurnableL2TokenCreated(address indexed _l1Token, address indexed _l2Token)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _l1Token `indexed` | address | undefined |
| _l2Token `indexed` | address | undefined |

### StandardL2TokenCreated

```solidity
event StandardL2TokenCreated(address indexed _l1Token, address indexed _l2Token)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _l1Token `indexed` | address | undefined |
| _l2Token `indexed` | address | undefined |



