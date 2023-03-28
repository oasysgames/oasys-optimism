![logo1](https://user-images.githubusercontent.com/107421475/227834490-3a3a9834-21a8-4079-8166-f6fe571d6b8d.png)
# Oasys Validator 
Verse client for Oasys. Forked from Optimism.

  <a href="https://github.com/ethereum-optimism/optimism/actions/workflows/ts-packages.yml?query=branch%3Amaster"><img src="https://github.com/ethereum-optimism/optimism/workflows/typescript%20/%20contracts/badge.svg" /></a>
  <a href="https://github.com/ethereum-optimism/optimism/actions/workflows/integration.yml?query=branch%3Amaster"><img src="https://github.com/ethereum-optimism/optimism/workflows/integration/badge.svg" /></a>
  <a href="https://github.com/ethereum-optimism/optimism/actions/workflows/geth.yml?query=branch%3Amaster"><img src="https://github.com/ethereum-optimism/optimism/workflows/geth%20unit%20tests/badge.svg" /></a>

## About Oasys Layer 2 

Oasys Verse Layer provides zero gas fee for users. 
1,000,000 OAS is required run the Verse-Layer node. There's a 180 days lockup period on the first deployment for a builder wallet. But on the Testnet, it's free; You can try the Verse Testnet with Faucet(10OAS is sufficient to deploy contract) and build Verse-Layer node.


## Documentation

- Documentation for setting up is available [here](https://docs.oasys.games/docs/verse-developer/how-to-build-verse/1-2-manual)
- Extensive documentation is available [here](http://community.optimism.io/).

## Community

Join our discord! [discord](https://discord.gg/oasysgames)

## Directory Structure

<pre>
root
├── <a href="./packages">packages</a>
│   ├── <a href="./packages/contracts">contracts</a>: L1 and L2 smart contracts for Optimism
│   ├── <a href="./packages/core-utils">core-utils</a>: Low-level utilities that make building Optimism easier
│   ├── <a href="./packages/common-ts">common-ts</a>: Common tools for building apps in TypeScript
│   ├── <a href="./packages/data-transport-layer">data-transport-layer</a>: Service for indexing Optimism-related L1 data
│   ├── <a href="./packages/message-relayer">message-relayer</a>: Tool for automatically relaying L1<>L2 messages in development
│   └── <a href="./packages/replica-healthcheck">replica-healthcheck</a>: Service for monitoring the health of a replica node
├── <a href="./go">go</a>
│   ├── <a href="./go/batch-submitter">batch-submitter</a>: Service for submitting batches of transactions and results to L1
│   ├── <a href="./go/bss-core">bss-core</a>: Core batch-submitter logic and utilities
│   ├── <a href="./go/gas-oracle">gas-oracle</a>: Service for updating L1 gas prices on L2
│   └── <a href="./go/proxyd">proxyd</a>: Configurable RPC request router and proxy
├── <a href="./l2geth">l2geth</a>: Optimism client software, a fork of <a href="https://github.com/ethereum/go-ethereum/tree/v1.9.10">geth v1.9.10</a>
├── <a href="./integration-tests">integration-tests</a>: Various integration tests for the Optimism network
└── <a href="./ops">ops</a>: Tools for running Optimism nodes and networks
</pre>

## Branching Model and Releases

<!-- TODO: explain about changesets + how we do npm publishing + docker publishing -->

### Active Branches

| Branch          | Status                                                                           |
| --------------- | -------------------------------------------------------------------------------- |
| [develop](https://github.com/oasysgames/oasys-optimism)                 | Accepts PRs that are compatible with `master` OR from `release/X.X.X` branches. 
| release/X.X.X                                                                          | Accepts PRs for all changes, particularly those not backwards compatible with `develop` and `master`. |



### The `develop` branch

Our primary development branch is [`develop`](https://github.com/ethereum-optimism/optimism/tree/develop/).
`develop` contains the most up-to-date software that remains backwards compatible with our latest experimental [network deployments](https://community.optimism.io/docs/useful-tools/networks/).
If you're making a backwards compatible change, please direct your pull request towards `develop`.

**Changes to contracts within `packages/contracts/contracts` are usually NOT considered backwards compatible and SHOULD be made against a release candidate branch**.
Some exceptions to this rule exist for cases in which we absolutely must deploy some new contract after a release candidate branch has already been fully deployed.
If you're changing or adding a contract and you're unsure about which branch to make a PR into, default to using the latest release candidate branch.
See below for info about release candidate branches.

## License

Code forked from [`go-ethereum`](https://github.com/ethereum/go-ethereum) under the name [`l2geth`](https://github.com/ethereum-optimism/optimism/tree/master/l2geth) is licensed under the [GNU GPLv3](https://gist.github.com/kn9ts/cbe95340d29fc1aaeaa5dd5c059d2e60) in accordance with the [original license](https://github.com/ethereum/go-ethereum/blob/master/COPYING).

All other files within this repository are licensed under the [MIT License](https://github.com/ethereum-optimism/optimism/blob/master/LICENSE) unless stated otherwise.
