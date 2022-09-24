import { ethers, network } from 'hardhat'
import { SignerWithAddress as Account } from '@nomiclabs/hardhat-ethers/signers'
import { toWei } from 'web3-utils'
import { expect } from 'chai'

import { DeployVerseBuilder } from '../../../../helpers/oasys/l1/build/setup'
import {
  Allowlist,
  L1BuildAgent,
  L1BuildDeposit,
} from '../../../../../dist/types'

const chainID = 12345
const sequencer = '0x1000000000000000000000000000000000000000'
const proposer = '0x2000000000000000000000000000000000000000'

describe('L1BuildAgent', () => {
  let deployer: Account
  let depositer: Account
  let builders: Account[]

  let allowlist: Allowlist
  let l1BuildAgent: L1BuildAgent
  let l1BuildDeposit: L1BuildDeposit

  before(async () => {
    const accounts = await ethers.getSigners()
    deployer = accounts[1]
    depositer = accounts[2]
    builders = accounts.slice(3, 10)
  })

  beforeEach(async () => {
    await network.provider.send('hardhat_reset')
  })

  beforeEach(async () => {
    ;({ allowlist, l1BuildAgent, l1BuildDeposit, allowlist } =
      await DeployVerseBuilder(deployer))

    await Promise.all(
      builders.map(async (x) => {
        await allowlist.connect(deployer).addAddress(x.address)

        await l1BuildDeposit
          .connect(depositer)
          .deposit(x.address, { value: toWei('100') })
      })
    )
  })

  describe('build()', () => {
    it('normally', async () => {
      await l1BuildAgent
        .connect(builders[0])
        .build(chainID, sequencer, proposer)
    })

    it('already built', async () => {
      await l1BuildAgent
        .connect(builders[0])
        .build(chainID, sequencer, proposer)

      const tx = l1BuildAgent
        .connect(builders[0])
        .build(chainID, sequencer, proposer)
      await expect(tx).to.be.revertedWith('already built')
    })
  })

  it('getBuilts()', async () => {
    await Promise.all(
      builders.map((x, i) =>
        l1BuildAgent.connect(x).build(chainID + i, sequencer, proposer)
      )
    )

    let result = await l1BuildAgent.getBuilts(0, 3)
    expect(result[0]).to.eql([
      builders[0].address,
      builders[1].address,
      builders[2].address,
    ])
    expect(result[1].map((x) => x.toNumber())).to.eql([
      chainID + 0,
      chainID + 1,
      chainID + 2,
    ])
    expect(result[2]).to.equal(3)

    result = await l1BuildAgent.getBuilts(3, 3)
    expect(result[0]).to.eql([
      builders[3].address,
      builders[4].address,
      builders[5].address,
    ])
    expect(result[1].map((x) => x.toNumber())).to.eql([
      chainID + 3,
      chainID + 4,
      chainID + 5,
    ])
    expect(result[2]).to.equal(6)

    result = await l1BuildAgent.getBuilts(6, 3)
    expect(result[0]).to.eql([builders[6].address])
    expect(result[1].map((x) => x.toNumber())).to.eql([chainID + 6])
    expect(result[2]).to.equal(7)
  })

  it('getAddressManager()', async () => {
    await l1BuildAgent.connect(builders[0]).build(chainID, sequencer, proposer)

    const actual = await l1BuildAgent.getAddressManager(chainID)
    expect(actual).to.equal('0xB0e9d02CC44e31BDbf4E7FeDdF4Ab0020aDD4f14')
  })

  it('getNamedAddresses()', async () => {
    await l1BuildAgent.connect(builders[0]).build(chainID, sequencer, proposer)

    const actual = await l1BuildAgent.getNamedAddresses(chainID)
    expect(actual).to.eql([
      [
        'OVM_Sequencer',
        'OVM_Proposer',
        'CanonicalTransactionChain',
        'ChainStorageContainer-CTC-batches',
        'StateCommitmentChain',
        'ChainStorageContainer-SCC-batches',
        'BondManager',
        'OVM_L1CrossDomainMessenger',
        'Proxy__OVM_L1CrossDomainMessenger',
        'Proxy__OVM_L1StandardBridge',
        'Proxy__OVM_L1ERC721Bridge',
        'L2CrossDomainMessenger',
      ],
      [
        '0x1000000000000000000000000000000000000000',
        '0x2000000000000000000000000000000000000000',
        '0x407192179288e8982a2f641599B2026f48e044CA',
        '0x82f6D66bC5756FED0Ed1A555a8A7897AF1A37AA9',
        '0x86ddf91aD46F5712318D705cFA176714B28Fe217',
        '0xd68e62Fd2Ac02eB35bD1EE07f8dcb5F92c773e5e',
        '0x245E5D86cd152ebf20B98eC4Ec8e2B1B41A9469e',
        '0xD371Be014093588e5C0E443B32b385c6F50267e1',
        '0x676382cc8965291d4c547576DF135d8547A173E0',
        '0x184055E7dc40639FBd40aA2e178Ef364A09BB020',
        '0x37722364515d180B7be738512c413E8C580A630c',
        '0x4200000000000000000000000000000000000007',
      ],
    ])
  })

  describe('getNamedAddress()', () => {
    beforeEach(async () => {
      await l1BuildAgent
        .connect(builders[0])
        .build(chainID, sequencer, proposer)
    })

    it('normally', async () => {
      const actual = await l1BuildAgent.getNamedAddress(
        chainID,
        'L2CrossDomainMessenger'
      )
      expect(actual).to.equal('0x4200000000000000000000000000000000000007')
    })

    it('not found', async () => {
      const tx = l1BuildAgent.getNamedAddress(
        chainID + 1,
        'L2CrossDomainMessenger'
      )
      await expect(tx).to.be.revertedWith('not found')
    })
  })
})
