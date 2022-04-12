import * as path from 'path'
import * as fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

import * as mkdirp from 'mkdirp'
import { ethers } from 'ethers'
import { task } from 'hardhat/config'
import * as types from 'hardhat/internal/core/params/argumentTypes'
import { remove0x } from '@eth-optimism/core-utils'

import { predeploys } from '../src/predeploys'
import { getContractFromArtifact } from '../src/deploy-utils'
import { getDeployConfig } from '../src/deploy-config'
import { names } from '../src/address-names'
import { isAddress } from 'ethers/lib/utils'

task('take-dump')
  .addOptionalParam(
    'l1TokenBridge',
    'Address of the L1StandardBridge.',
    undefined,
    types.string
  )
  .addOptionalParam(
    'l1CrossDomainMessenger',
    'Address of the Proxy__OVM_L1CrossDomainMessenger.',
    undefined,
    types.string
  )
  .addOptionalParam(
    'l1ERC721Bridge',
    'Address of the Proxy__OVM_L1ERC721Bridge.',
    undefined,
    types.string
  )
  .addOptionalParam('out', 'Output destination path.', undefined, types.string)
  .setAction(
    async (
      { l1TokenBridge, l1CrossDomainMessenger, l1ERC721Bridge, out },
      hre
    ) => {
      /* eslint-disable @typescript-eslint/no-var-requires */

      // Needs to be imported here or hardhat will throw a fit about hardhat being imported from
      // within the configuration file.
      const {
        computeStorageSlots,
        getStorageLayout,
      } = require('@defi-wonderland/smock/dist/src/utils')

      // Needs to be imported here because the artifacts can only be generated after the contracts have
      // been compiled, but compiling the contracts will import the config file which, as a result,
      // will import this file.
      const { getContractArtifact } = require('../src/contract-artifacts')

      /* eslint-enable @typescript-eslint/no-var-requires */

      // Make sure we have a deploy config for this network
      const deployConfig = getDeployConfig(hre.network.name)

      // Basic warning so users know that the whitelist will be disabled if the owner is the zero address.
      if (
        deployConfig.ovmWhitelistOwner === undefined ||
        deployConfig.ovmWhitelistOwner === ethers.constants.AddressZero
      ) {
        console.log(
          'WARNING: whitelist owner is undefined or address(0), whitelist will be disabled'
        )
      }

      if (!l1TokenBridge) {
        l1TokenBridge = (
          await getContractFromArtifact(
            hre,
            names.managed.contracts.Proxy__OVM_L1StandardBridge
          )
        ).address
      }
      if (!l1CrossDomainMessenger) {
        l1CrossDomainMessenger = (
          await getContractFromArtifact(
            hre,
            names.managed.contracts.Proxy__OVM_L1CrossDomainMessenger
          )
        ).address
      }

      const variables = {
        OVM_DeployerWhitelist: {
          owner: deployConfig.ovmWhitelistOwner,
        },
        OVM_GasPriceOracle: {
          _owner: deployConfig.ovmGasPriceOracleOwner,
          gasPrice: deployConfig.gasPriceOracleL2GasPrice,
          l1BaseFee: deployConfig.gasPriceOracleL1BaseFee,
          overhead: deployConfig.gasPriceOracleOverhead,
          scalar: deployConfig.gasPriceOracleScalar,
          decimals: deployConfig.gasPriceOracleDecimals,
        },
        L2StandardBridge: {
          l1TokenBridge,
          messenger: predeploys.L2CrossDomainMessenger,
        },
        OVM_SequencerFeeVault: {
          l1FeeWallet: deployConfig.ovmFeeWalletAddress,
        },
        OVM_ETH: {
          l2Bridge: predeploys.L2StandardBridge,
          l1Token: ethers.constants.AddressZero,
          _name: 'Ether',
          _symbol: 'ETH',
        },
        L2CrossDomainMessenger: {
          // We default the xDomainMsgSender to this value to save gas.
          // See usage of this default in the L2CrossDomainMessenger contract.
          xDomainMsgSender: '0x000000000000000000000000000000000000dEaD',
          l1CrossDomainMessenger,
          // Set the messageNonce to a high value to avoid overwriting old sent messages.
          messageNonce: 100000,
        },
        WETH9: {
          name: 'Wrapped Ether',
          symbol: 'WETH',
          decimals: 18,
        },
      }

      // Add the Oasys L2 Standard bridge.
      if (l1ERC721Bridge) {
        if (!isAddress(l1ERC721Bridge)) {
          throw new Error('L1ERC721Bridge address is invalid.')
        }
        // @ts-ignore
        predeploys.L2ERC721Bridge = '0x6200000000000000000000000000000000000001'
        // @ts-ignore
        variables.L2ERC721Bridge = {
          messenger: predeploys.L2CrossDomainMessenger,
          l1ERC721Bridge,
        }
      }

      const dump = {}
      for (const predeployName of Object.keys(predeploys)) {
        const predeployAddress = predeploys[predeployName]
        dump[predeployAddress] = {
          balance: '00',
          storage: {},
        }

        if (predeployName === 'OVM_L1BlockNumber') {
          // OVM_L1BlockNumber is a special case where we just inject a specific bytecode string.
          // We do this because it uses the custom L1BLOCKNUMBER opcode (0x4B) which cannot be
          // directly used in Solidity (yet). This bytecode string simply executes the 0x4B opcode
          // and returns the address given by that opcode.
          dump[predeployAddress].code = '0x4B60005260206000F3'
        } else {
          const artifact = getContractArtifact(predeployName)
          dump[predeployAddress].code = artifact.deployedBytecode
        }

        // Compute and set the required storage slots for each contract that needs it.
        if (predeployName in variables) {
          const storageLayout = await getStorageLayout(predeployName)
          const slots = computeStorageSlots(
            storageLayout,
            variables[predeployName]
          )
          for (const slot of slots) {
            dump[predeployAddress].storage[slot.key] = slot.val
          }
        }
      }

      // Grab the commit hash so we can stick it in the genesis file.
      let commit: string
      try {
        const { stdout } = await promisify(exec)('git rev-parse HEAD')
        commit = stdout.replace('\n', '')
      } catch {
        console.log('unable to get commit hash, using empty hash instead')
        commit = '0000000000000000000000000000000000000000'
      }

      const genesis = {
        commit,
        config: {
          chainId: deployConfig.l2ChainId,
          homesteadBlock: 0,
          eip150Block: 0,
          eip155Block: 0,
          eip158Block: 0,
          byzantiumBlock: 0,
          constantinopleBlock: 0,
          petersburgBlock: 0,
          istanbulBlock: 0,
          muirGlacierBlock: 0,
          berlinBlock: deployConfig.hfBerlinBlock,
          clique: {
            period: 0,
            epoch: 30000,
          },
        },
        difficulty: '1',
        gasLimit: deployConfig.l2BlockGasLimit.toString(10),
        extradata:
          '0x' +
          '00'.repeat(32) +
          remove0x(deployConfig.ovmBlockSignerAddress) +
          '00'.repeat(65),
        alloc: dump,
      }

      // Make sure the output location exists
      const outdir = path.resolve(__dirname, '../genesis')
      let outfile = path.join(outdir, `${hre.network.name}.json`)
      if (out) {
        outfile = out
      } else {
        mkdirp.sync(outdir)
      }

      // Write the genesis file
      fs.writeFileSync(outfile, JSON.stringify(genesis, null, 4))
    }
  )
