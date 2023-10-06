# Local development
This section describes how to run message-relayer developed locally.

## Remove unused local message-relayer image
```shell
docker rmi $(docker images -q local/message-relayer)
```

## Create a local message-relayer image
Create a docker image reflecting the modification of message-relayer in local.

### Set local message-relayer image name
Modify `ops/docker-compose.yml` at `oasys-optimism` to set the local message-relayer image name.

```yaml
relayer:
    depends_on:
      - l1_chain
      - l2geth
    deploy:
      replicas: 0
    build:
      context: ..
      dockerfile: ./ops/docker/Dockerfile.packages
      target: message-relayer
    # image: ethereumoptimism/message-relayer:${DOCKER_TAG_MESSAGE_RELAYER:-latest}
    image: local/message-relayer:latest # Add this part
    ...
```

### Create a docker image
To create local message-relayer image, execute the following command at `oasys-optimism`.

```shell
cd ops
docker-compose build --build-arg NODE_OPTIONS="--max-old-space-size=4096" relayer
```

**prerequisite**
To create an optimism docker image, a minimum of 8 GB of MEMORY space must be available in docker.
So please change the memory capacity in `docker-desktop` if necessary.

[Ops: @eth-optimism/contracts fails to build](https://github.com/ethereum-optimism/optimism/issues/2191#issuecomment-1035254729)

## Set local message-relayer image to verse-layer-optimism
```yaml
message-relayer:
    <<: *common
    # image: ghcr.io/oasysgames/oasys-optimism/message-relayer:v0.1.1
    image: local/message-relayer:latest # add this part
    entrypoint: /bin/sh /assets/message-relayer/run.sh
```

## Setup Oasys-hub and Oasys-verse
Follow the steps below to set up the hub layer and verse-layer in the local environment.

[Setup private network](https://github.com/oasysgames/validator-publication/tree/main/private-net)

If you already have it up and running, please down everything and delete the DATA VOLUME and rebuild it.

# How to check L2→L1 bridge performance at local
This section describes how to check the modification of message-relayer in the local environment.

Each time a modification to the message-relayer in local, start over with the [local development](#local-development) described above.

## Modify bridge tutorial setting to bridge at local
To bridge at local, modify setting of [l1-l2-bridge-tutorial](https://github.com/oasysgames/l1-l2-bridge-tutorial).

At `hardhat.config.ts`, set local verse and local hub.
```typescript
networks: {
  l1: {
    // url: 'https://rpc.testnet.oasys.games/',
    // chainId: 9372,
    url: 'http://localhost:8545',
    chainId: 12345,
    accounts: [process.env.PRIVATE_KEY],
  },
  l2: {
    // url: 'https://rpc.sandverse.oasys.games/',
    // chainId: 20197,
    url: 'http://localhost:18545',
    chainId: 420,
    accounts: [process.env.PRIVATE_KEY],
    gasPrice: 0,
  },
},
```

At `scripts/common.ts`, set local L1 contract for verse.

```typescript
l1: {
  // Oasys pre-deployed contracts.
  L1StandardERC20Factory: '0x5200000000000000000000000000000000000004',
  L1StandardERC721Factory: '0x5200000000000000000000000000000000000005',

  // Sand Verse Contracts. Address is different for each Verse-Layer.
  // Proxy__OVM_L1CrossDomainMessenger:
  //   '0xa04B03350eE9E3fdd1C2f63fAD5e0CabBb476594',
  // Proxy__OVM_L1StandardBridge: '0x9245e19eB88de2534E03E764FB2a5f194e6d97AD',
  // Proxy__OVM_L1ERC721Bridge: '0x8D736Ad22D106dE9Cf50D0D18D571041a47DD333',

  // Local verse
  Proxy__OVM_L1CrossDomainMessenger:
    '0xb6B18AA53111D21F9bc892F04815930030C42EFD',
  Proxy__OVM_L1StandardBridge: '0xA16517A9796bAc73eFA7d07269F9818b7978dc2A',
  Proxy__OVM_L1ERC721Bridge: '0x1931994b20c8E7BbA4eE7d6032fae4aEE64e929d',
},
```

## Stop message-relayer
```shell
docker-compose stop message-relayer
```

## bridge OAS from L1 to L2
Using `scripts/bridge-OAS-multiple.ts` at [l1-l2-bridge-tutorial](https://github.com/oasysgames/l1-l2-bridge-tutorial), bridge OAS from L1 to L2

Modify code at `scripts/bridge-OAS-multiple.ts`
```typescript
const main = async () => {
  await bridge_L1_L2()
  // await bridge_L2_L1()
}

main()
```

Execute command.
```shell
npx hardhat run scripts/bridge-OAS-multiple.ts
```

## 10 times bridge OAS from L1 to L2
Modify code at `scripts/bridge-OAS-multiple.ts`
```typescript
const main = async () => {
  // await bridge_L1_L2()
  await bridge_L2_L1()
}

main()
```

Execute command.
```shell
npx hardhat run scripts/bridge-OAS-multiple.ts
```

You can check bridge_transactions at the log.
```shell
bridgeTxs [
  '0xfd8e4a7d0c96dcefce0fb9f2510377dc6c64accbe696f384a554e32e8edcd25c',
  '0x65bd8c255e171c036c64efa228f110431c4d5a937036f1e5b44c960b051eeedb',
  '0x0177074d08c38e54a2efd2bbc6b9ab80a7d6cd42ed45b05beeef83e648d158aa',
  '0x4e6e84e488ea7d9772b350b627c95f76c36ef538ceefcba908b0942812e38f12',
  '0x24ddc7d8774a4824b16693a6bdf2b981f85ed002ec14ce53ced2e4e173be19cb',
  '0x2a069b7c0c6738594d590037f1d30489eca7a0444c640873da3d644295c5c5bb',
  '0x14ad2615b87986d9707f935b8fd246991b7c93517696c4e4d42ae934e68fe98d',
  '0xd2cd9847379d8f70910dbdee1763251e18c0e9efe063c2c0db0e461189139ef3',
  '0x56fb973ce383acffc4e1e395e642e7b660231adcad347a464685d8b8999afc37',
  '0xbdb0313d79bd47e73d88133990a75f1be13794efec910a650bc77e7f14cfda14'
]
```

## Wait for verse-verification
You can check verse-verification completion in `verse-verifier` log.

## Modify bridge-OAS-multiple.ts to check bridge performance
Modify code at `scripts/bridge-OAS-multiple.ts`
```typescript
const main = async () => {
  // await bridge_L1_L2()
  await bridge_L2_L1()
}

// main()

// todo: set bridgeTxs from a result of bridge_L2_L1
const bridgeTxs = [
  '0xfd8e4a7d0c96dcefce0fb9f2510377dc6c64accbe696f384a554e32e8edcd25c',
  '0x65bd8c255e171c036c64efa228f110431c4d5a937036f1e5b44c960b051eeedb',
  '0x0177074d08c38e54a2efd2bbc6b9ab80a7d6cd42ed45b05beeef83e648d158aa',
  '0x4e6e84e488ea7d9772b350b627c95f76c36ef538ceefcba908b0942812e38f12',
  '0x24ddc7d8774a4824b16693a6bdf2b981f85ed002ec14ce53ced2e4e173be19cb',
  '0x2a069b7c0c6738594d590037f1d30489eca7a0444c640873da3d644295c5c5bb',
  '0x14ad2615b87986d9707f935b8fd246991b7c93517696c4e4d42ae934e68fe98d',
  '0xd2cd9847379d8f70910dbdee1763251e18c0e9efe063c2c0db0e461189139ef3',
  '0x56fb973ce383acffc4e1e395e642e7b660231adcad347a464685d8b8999afc37',
  '0xbdb0313d79bd47e73d88133990a75f1be13794efec910a650bc77e7f14cfda14'
];
watch_L2_L1_Bridges(bridgeTxs)
```

## Restart message-relayer and check bridge performance
```shell
# At verse-layer-optimism
docker-compose restart message-relayer
```

```shell
# At bridge tutorial
npx hardhat run scripts/bridge-OAS-multiple.ts
```

You can check bridge performance in the log.
```shell
done
    elapsed: 7.978 sec
    relayer tx: 0x83c39b7b99b6aac0349d036673ae7bb9c4bdb9090b217ec7e27146e59ab1d089 (gas: 440668)
    message hash: 0x17e7a81a36afed418d2f98ba3a1573305d5e0ee859dec421b0e039a7cd7063d1
    balance on Hub-Layer  : 9974099155489840608
    balance on Verse-Layer: 9990000

done
    elapsed: 17.907 sec
    relayer tx: 0xb0c4ddaf6d4baeb93d6b5a2adc43d61988f2fc765bcad4aae826f0297f5d2009 (gas: 471162)
    message hash: 0x8791ac7b900dcf2db1c3b866016a012ae933f25808036079e5754d21fd5f54d0
    balance on Hub-Layer  : 9974099155489841608
    balance on Verse-Layer: 9990000
...

time: 98.096 sec
```
