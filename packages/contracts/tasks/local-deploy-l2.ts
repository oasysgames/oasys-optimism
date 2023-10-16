/* Imports: External */
import { task } from 'hardhat/config'
import * as types from 'hardhat/internal/core/params/argumentTypes'

import { predeploys } from '../src'

const L1_ERC721_BRIDGE_ADDRESS = '0x8D736Ad22D106dE9Cf50D0D18D571041a47DD333'

task('deploy:L2:messaging').setAction(async (taskArgs, hre) => {
  console.log('Deploying messaging Contract... ')
  const [signer] = await hre.ethers.getSigners()

  const l2ERC721BridgeFactory = await hre.ethers.getContractFactory(
    'L2ERC721Bridge'
  )

  const l2ERC721Bridge = await l2ERC721BridgeFactory
    .connect(signer)
    .deploy(predeploys.L2CrossDomainMessenger, L1_ERC721_BRIDGE_ADDRESS)

  console.log(
    `L2_ERC721_BRIDGE_ADDRESS is deployed to ${l2ERC721Bridge.address}`
  )
})

task('deploy:L2:token')
  .addParam(
    'l2ERC721BridgeAddress',
    'L2_ERC721_BRIDGE_ADDRESS',
    '',
    types.string
  )
  .addParam('l1ERC721Address', 'L1_ERC721_ADDRESS', '', types.string)
  .addParam('tokenName', 'ERC721 Name', '', types.string)
  .addParam('tokenSymbol', 'ERC721 Symbol', '', types.string)
  .setAction(async (taskArgs, hre) => {
    console.log('Deploying token Contract... ')
    const [signer] = await hre.ethers.getSigners()

    const l2StandardERC721Factory = await hre.ethers.getContractFactory(
      'L2StandardERC721'
    )

    const l2StandardERC721 = await l2StandardERC721Factory
      .connect(signer)
      .deploy(
        taskArgs.l2ERC721BridgeAddress,
        taskArgs.l1ERC721Address,
        taskArgs.tokenName,
        taskArgs.tokenSymbol
      )

    console.log(
      `L2_STANDARD_ERC721_FACTORY_ADDRESS is deployed to ${l2StandardERC721.address}`
    )
  })
