// Assigns blocks to idle SMs. Simple round-robin.

package sim

import (
	"github.com/exprays/nyx/core"
)

// Dispatcher manages the assignment of blocks to SMs.
// It keeps a queue of unassigned blocks and feeds them
// to idle SMs each cycle.
type Dispatcher struct {
	blocks    []*core.Block // all blocks to be executed
	nextBlock int           // index of next unassigned block
	done      bool
}

func NewDispatcher(cfg *core.KernelConfig) *Dispatcher {
	totalBlocks := cfg.GridDim
	blocks := make([]*core.Block, totalBlocks)
	for i := 0; i < totalBlocks; i++ {
		blocks[i] = core.NewBlock(i, cfg.BlockDim, cfg.SharedMemSz)
	}
	return &Dispatcher{
		blocks:    blocks,
		nextBlock: 0,
	}
}

// Assign gives each idle SM a block if one is available.
// Returns how many assignments were made this cycle.
func (d *Dispatcher) Assign(sms [NumSMs]*core.SM) int {
	assigned := 0
	for _, sm := range sms {
		if sm.State != core.SMIdle {
			continue
		}
		if d.nextBlock >= len(d.blocks) {
			break
		}
		sm.ActiveBlock = d.blocks[d.nextBlock]
		sm.State = core.SMRunning
		d.nextBlock++
		assigned++
	}
	return assigned
}

// AllDispatched returns true when every block has been handed out
func (d *Dispatcher) AllDispatched() bool {
	return d.nextBlock >= len(d.blocks)
}

// TotalBlocks returns the total number of blocks in this kernel
func (d *Dispatcher) TotalBlocks() int {
	return len(d.blocks)
}
