// The top-level simulation config and entry point

package sim

import (
	"fmt"

	"github.com/exprays/nyx/core"
	"github.com/exprays/nyx/memory"
	"github.com/exprays/nyx/trace"
)

const (
	WarpSize  = 32     // threads per warp — fixed at 32 like real GPUs
	MaxWarps  = 8      // max warps per SM
	NumSMs    = 4      // number of streaming multiprocessors
	MaxCycles = 100000 // safety limit to prevent infinite loops
)

// Sim is the top-level simulator
type Sim struct {
	Config    *core.KernelConfig
	GlobalMem *memory.GlobalMemory
	SMs       [NumSMs]*core.SM
	Tracer    *trace.Tracer
	Cycle     int
}

// New creates a new simulator from a kernel config
func New(cfg *core.KernelConfig, tracer *trace.Tracer) (*Sim, error) {
	if err := validateConfig(cfg); err != nil {
		return nil, fmt.Errorf("invalid kernel config: %w", err)
	}

	gm := memory.NewGlobalMemory(memory.GlobalMemSize)
	gm.LoadData(cfg.GlobalMem)

	s := &Sim{
		Config:    cfg,
		GlobalMem: gm,
		Tracer:    tracer,
	}

	// Initialize SMs
	for i := 0; i < NumSMs; i++ {
		s.SMs[i] = &core.SM{
			ID:    i,
			State: core.SMIdle,
		}
	}

	return s, nil
}

func validateConfig(cfg *core.KernelConfig) error {
	if cfg.BlockDim == 0 {
		return fmt.Errorf("BlockDim must be > 0")
	}
	if cfg.BlockDim%WarpSize != 0 {
		return fmt.Errorf("BlockDim (%d) must be a multiple of WarpSize (%d)", cfg.BlockDim, WarpSize)
	}
	if cfg.GridDim == 0 {
		return fmt.Errorf("GridDim must be > 0")
	}
	if len(cfg.Program) == 0 {
		return fmt.Errorf("program is empty")
	}
	return nil
}

// Info prints a summary of the kernel about to run
func (s *Sim) Info() {
	total := s.Config.GridDim * s.Config.BlockDim
	warpsPerBlock := s.Config.BlockDim / WarpSize
	fmt.Println("╔══════════════════════════════════════════════╗")
	fmt.Printf(" ║  NYX GPU                                      ║\n")
	fmt.Println("╠══════════════════════════════════════════════╣")
	fmt.Printf(" ║  Kernel        : %-28s║\n", s.Config.Name)
	fmt.Printf(" ║  Grid dim      : %-28d║\n", s.Config.GridDim)
	fmt.Printf(" ║  Block dim     : %-28d║\n", s.Config.BlockDim)
	fmt.Printf(" ║  Total threads : %-28d║\n", total)
	fmt.Printf(" ║  Warps/block   : %-28d║\n", warpsPerBlock)
	fmt.Printf(" ║  SMs           : %-28d║\n", NumSMs)
	fmt.Printf(" ║  Program size  : %-28d║\n", len(s.Config.Program))
	fmt.Println("╚══════════════════════════════════════════════╝")
}
