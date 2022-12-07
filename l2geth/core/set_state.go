package core

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"strconv"

	"github.com/ethereum-optimism/optimism/l2geth/core/state"
	"github.com/ethereum-optimism/optimism/l2geth/log"
)

var (
	contractUpdateConfig = make(map[uint64]GenesisAlloc)
)

/*
Load the contract update configuration file(json format).

Example:
{
  "100": {
    "0xfC76559Ffd6EF3b79C2A8Ab1A8179134d1e88953": {
	  "balance": "0",
	  "code": "0x73000000000000000000000000000000000000000030146080604052600080fdfea2646970667358221220184afaf8d58620cf6631ca9af99040ca3677ef4e6257938d587162f4e5edb88664736f6c63430008090033",
	  "storage": {
        "0x0000000000000000000000000000000000000000000000000000000000000001": "0x000000000000000000000000464110713EAF4E7834D93E68a23B2aD8cCd7b28B",
        "0x0000000000000000000000000000000000000000000000000000000000000002": "0x00000000000000000000000059BCA8bFfB73900261012c7c72515ecD2e529c97"
	  }
    }
  }
}
*/
func LoadContractUpdateConfig(filepath string) {
	data, err := ioutil.ReadFile(filepath)
	if err != nil {
		panic(fmt.Sprintf("Failed to read the contract update configuration file: %s", err.Error()))
	}

	parsed := make(map[string]GenesisAlloc)
	if err = json.Unmarshal(data, &parsed); err != nil {
		panic(fmt.Sprintf("Failed to unmarshal the contract update configuration file: %s", err.Error()))
	}

	for snum, alloc := range parsed {
		if u64num, err := strconv.ParseUint(snum, 10, 64); err == nil {
			contractUpdateConfig[u64num] = alloc
		} else {
			panic(fmt.Sprintf("Failed to parse block number: %s, err: %s", snum, err.Error()))
		}
	}
}

// Update contract. Affects the state root of the block.
func UpdateContract(state *state.StateDB, block uint64, on string) {
	alloc, ok := contractUpdateConfig[block]
	if !ok {
		return
	}

	for address, acc := range alloc {
		if acc.Code != nil {
			oldHash := state.GetCodeHash(address)
			state.SetCode(address, acc.Code)
			newHash := state.GetCodeHash(address)

			log.Info("Updated contract code", "on", on,
				"block", block, "address", address,
				"old-hash", oldHash.String(), "new-hash", newHash.String())
		}

		for slot, value := range acc.Storage {
			oldValue := state.GetState(address, slot)
			state.SetState(address, slot, value)

			log.Info("Updated contract storage", "on", on,
				"block", block, "address", address,
				"slot", slot, "old-value", oldValue.String(), "new-value", value.String())
		}
	}
}
