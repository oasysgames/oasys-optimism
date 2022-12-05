package core

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"strconv"

	"github.com/ethereum-optimism/optimism/l2geth/common"
	"github.com/ethereum-optimism/optimism/l2geth/core/state"
	"github.com/ethereum-optimism/optimism/l2geth/log"
)

var (
	setStorageConfig = make(map[uint64]map[common.Address]map[common.Hash]common.Hash)
)

/*
Load the contract storage update configuration file(json format).

Example:
{
  "100": {
    "0xfC76559Ffd6EF3b79C2A8Ab1A8179134d1e88953": {
      "0x0000000000000000000000000000000000000000000000000000000000000001": "0x000000000000000000000000464110713EAF4E7834D93E68a23B2aD8cCd7b28B",
      "0x0000000000000000000000000000000000000000000000000000000000000002": "0x00000000000000000000000059BCA8bFfB73900261012c7c72515ecD2e529c97"
    }
  }
}
*/
func LoadContractStorageConfig(filepath string) {
	data, err := ioutil.ReadFile(filepath)
	if err != nil {
		panic(fmt.Sprintf("Failed to read the storage update configuration file: %s", err.Error()))
	}

	parsed := make(map[string]map[common.Address]map[common.Hash]common.Hash)
	if err = json.Unmarshal(data, &parsed); err != nil {
		panic(fmt.Sprintf("Failed to unmarshal the storage update configuration file: %s", err.Error()))
	}

	for snum, storage := range parsed {
		if u64num, err := strconv.ParseUint(snum, 10, 64); err == nil {
			setStorageConfig[u64num] = storage
		} else {
			panic(fmt.Sprintf("Failed to parse block number: %s, err: %s", snum, err.Error()))
		}
	}
}

// Update contract storage. Affects the state root of the block.
func UpdateContractStorage(state *state.StateDB, block uint64, on string) {
	alloc, ok := setStorageConfig[block]
	if !ok {
		return
	}

	for address, storage := range alloc {
		for slot, value := range storage {
			state.SetState(address, slot, value)
			log.Info("Updated contract storage", "on", on,
				"block", block, "address", address, "slot", slot, "value", value)
		}
	}
}
