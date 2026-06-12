package main

import (
	"fmt"
	"os"

	"github.com/exprays/nyx/asm"
	"github.com/exprays/nyx/core"
	"github.com/exprays/nyx/sim"
	"github.com/exprays/nyx/trace"
)

const vecaddSrc = `
MUL  R0, %blockIdx, %blockDim
ADD  R0, R0, %threadIdx
CONST R1, #0
CONST R2, #8
CONST R3, #16
ADD  R4, R1, R0
LDR  R4, R4
ADD  R5, R2, R0
LDR  R5, R5
ADD  R6, R4, R5
ADD  R7, R3, R0
STR  R7, R6
RET
`

func main() {
	// Assemble the kernel
	a := asm.New(vecaddSrc)
	kernel, err := a.Assemble()
	if err != nil {
		fmt.Fprintf(os.Stderr, "assemble error: %v\n", err)
		os.Exit(1)
	}

	// Initial memory layout:
	//   [0..7]   = A = {1,2,3,4,5,6,7,8}
	//   [8..15]  = B = {8,7,6,5,4,3,2,1}
	//   [16..23] = C = output (zeros)
	// Expected result: C[i] = 9 for all i
	globalMem := make([]int32, 256)
	for i := 0; i < 8; i++ {
		globalMem[i] = int32(i + 1)   // A
		globalMem[i+8] = int32(8 - i) // B
	}

	cfg := &core.KernelConfig{
		Name:        "vecadd",
		GridDim:     1,  // 1 block
		BlockDim:    32, // 32 threads = 1 warp (only 8 do meaningful work)
		Program:     kernel.Instructions,
		GlobalMem:   globalMem,
		SharedMemSz: 0,
	}

	// LevelThread = full per-thread trace every cycle
	// Change to LevelSummary for less noise
	tracer := trace.NewTracer(trace.LevelSummary)

	s, err := sim.New(cfg, tracer)
	if err != nil {
		fmt.Fprintf(os.Stderr, "sim init error: %v\n", err)
		os.Exit(1)
	}

	s.Info()
	fmt.Println()

	cycles, err := s.Run()
	if err != nil {
		fmt.Fprintf(os.Stderr, "sim run error: %v\n", err)
		os.Exit(1)
	}

	// Show output region of global memory
	tracer.Summary(cycles, s.GlobalMem.Data, [2]int{0, 24})
}
