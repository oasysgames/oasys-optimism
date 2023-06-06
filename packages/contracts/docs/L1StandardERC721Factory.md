# L1StandardERC721Factory



> L1StandardERC721Factory



*L1StandardERC721Factory deploys the Oasys Standard ERC721 contract.*

## Methods

### createStandardERC721

```solidity
function createStandardERC721(string _name, string _symbol, string _baseTokenURI) external nonpayable
```

Deploys the Oasys Standard ERC721.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _name | string | Name of the ERC721.
| _symbol | string | Symbol of the ERC721.
| _baseTokenURI | string | Base token URI of the ERC721.



## Events

### ERC721Created

```solidity
event ERC721Created(string indexed _symbol, address indexed _address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _symbol `indexed` | string | undefined |
| _address `indexed` | address | undefined |



