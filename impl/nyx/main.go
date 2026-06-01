package main

import (
	"fmt"
	"os"

	"github.com/exprays/nyx/core"
	"github.com/exprays/nyx/isa"
	"github.com/exprays/nyx/sim"
	"github.com/exprays/nyx/trace"
)

func main() {
	// A minimal dummy kernel just to prove the wiring works:
	// CONST R0, #42 → RET
	// We'll replace this with the real assembler in SPR-NYX-1
	dummyProgram := []isa.Instruction{
		{Opcode: isa.OP_CONST, Rd: 0, Imm: 42},
		{Opcode: isa.OP_RET},
	}

	cfg := &core.KernelConfig{
		Name:        "boot-check",
		GridDim:     1,
		BlockDim:    32, // 1 block of 32 threads = 1 warp
		Program:     dummyProgram,
		GlobalMem:   make([]int32, 256),
		SharedMemSz: 64,
	}

	tracer := trace.NewTracer(trace.LevelSummary)

	s, err := sim.New(cfg, tracer)
	if err != nil {
		fmt.Fprintf(os.Stderr, "nyx: failed to initialize: %v\n", err)
		os.Exit(1)
	}

	s.Info()
	fmt.Println("\nSPR-NYX-0 complete — architecture wired up.")
	fmt.Println("Next: SPR-NYX-1 — ISA encoding + Assembler")
}
