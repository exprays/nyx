export const INITIAL_FILES: Record<string, string> = {
	"main.go": `package main

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
}`,
	"config.json": `{
  "name": "custom-kernel",
  "gridDim": 1,
  "blockDim": 32,
  "sharedMemSz": 64
}`,
	"Makefile": `.PHONY: all setup install build build-wasm run-sim run-web test clean help

all: help

help:
	@echo "Available commands:"
	@echo "  make setup      - Install dependencies for backend and frontend"
	@echo "  make build      - Build both the Go backend and Next.js frontend"
	@echo "  make build-wasm - Compile Go simulator package to browser WebAssembly"
	@echo "  make run-sim    - Run the Go simulator"
	@echo "  make run-web    - Run the Next.js dev server"
	@echo "  make test       - Run tests for Go backend"
	@echo "  make clean      - Clean build artifacts"

setup: install

install:
	@echo "Setting up Go dependencies..."
	cd impl/nyx && go mod tidy
	@echo "Setting up Web dependencies..."
	cd web && npm install

build-wasm:
	@echo "Building Go simulator to WebAssembly..."
	GOOS=js GOARCH=wasm go build -o web/public/sim.wasm impl/nyx/main.go

build: build-wasm
	@echo "Building Go backend..."
	mkdir -p bin
	cd impl/nyx && go build -o ../../bin/nyx
	@echo "Building Web frontend..."
	cd web && npm run build

run-sim:
	@echo "Running Go simulator..."
	cd impl/nyx && go run main.go

run-web:
	@echo "Running Web frontend dev server..."
	cd web && npm run dev

test:
	@echo "Running Go backend tests..."
	cd impl/nyx && go test ./...

clean:
	@echo "Cleaning Go build..."
	cd impl/nyx && go clean
	rm -rf bin
	@echo "Cleaning Web build..."
	rm -rf web/.next
`,
	"sim/sim.go": `// The top-level simulation config and entry point

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
	fmt.Printf("║  NYX GPU                                     ║\n")
	fmt.Println("╠══════════════════════════════════════════════╣")
	fmt.Printf("║  Kernel        : %-28s║\n", s.Config.Name)
	fmt.Printf("║  Grid dim      : %-28d║\n", s.Config.GridDim)
	fmt.Printf("║  Block dim     : %-28d║\n", s.Config.BlockDim)
	fmt.Printf("║  Total threads : %-28d║\n", total)
	fmt.Printf("║  Warps/block   : %-28d║\n", warpsPerBlock)
	fmt.Printf("║  SMs           : %-28d║\n", NumSMs)
	fmt.Printf("║  Program size  : %-28d║\n", len(s.Config.Program))
	fmt.Println("╚══════════════════════════════════════════════╝")
}
`,
	"core/types.go": `// All the core types that the rest of the simulator is built upon.

package core

import "github.com/exprays/nyx/isa"

// ThreadState represents what a single thread is currently doing
type ThreadState uint8

const (
	ThreadIdle     ThreadState = iota
	ThreadFetch                // fetching instruction from program memory
	ThreadDecode               // decoding the fetched instruction
	ThreadExecute              // executing ALU operation
	ThreadMemReq               // waiting to send a memory request
	ThreadMemWait              // waiting for memory response
	ThreadSyncWait             // waiting at a SYNC barrier
	ThreadDone                 // hit RET, finished execution
)

func (s ThreadState) String() string {
	switch s {
	case ThreadIdle:
		return "IDLE"
	case ThreadFetch:
		return "FETCH"
	case ThreadDecode:
		return "DECODE"
	case ThreadExecute:
		return "EXECUTE"
	case ThreadMemReq:
		return "MEM_REQ"
	case ThreadMemWait:
		return "MEM_WAIT"
	case ThreadSyncWait:
		return "SYNC_WAIT"
	case ThreadDone:
		return "DONE"
	default:
		return "???"
	}
}

// NZPReg is the condition register set by CMP, read by BRnzp
type NZPReg uint8

const (
	NZP_NEGATIVE NZPReg = 0b100
	NZP_ZERO     NZPReg = 0b010
	NZP_POSITIVE NZPReg = 0b001
)

// Thread is a single execution unit — the atomic unit of GPU compute.
// Every thread has its own PC, registers, NZP register, and state.
// Threads are grouped into warps and executed in SIMD fashion.
type Thread struct {
	ID        int // global thread ID
	BlockID   int // which block this thread belongs to
	ThreadIdx int // index within its block
	BlockDim  int // total threads in its block

	PC        int32                // program counter
	Registers [isa.REG_COUNT]int32 // register file
	NZP       NZPReg               // condition register

	State ThreadState

	// Memory transaction in flight (LDR/STR)
	MemAddr   int32
	MemValue  int32
	MemIsLoad bool
}

// WarpState represents what a warp is doing this cycle
type WarpState uint8

const (
	WarpReady    WarpState = iota // all threads ready for next instruction
	WarpRunning                   // currently executing
	WarpMemWait                   // one or more threads waiting on memory
	WarpSyncWait                  // threads at a barrier
	WarpDone                      // all threads hit RET
)

func (s WarpState) String() string {
	switch s {
	case WarpReady:
		return "READY"
	case WarpRunning:
		return "RUNNING"
	case WarpMemWait:
		return "MEM_WAIT"
	case WarpSyncWait:
		return "SYNC_WAIT"
	case WarpDone:
		return "DONE"
	default:
		return "???"
	}
}

// Warp is a group of 32 threads that execute the same instruction in lockstep.
// The active mask tracks which threads are currently active (not diverged/done).
type Warp struct {
	ID         int
	Threads    []*Thread
	ActiveMask uint32 // bitmask — bit i set means thread i is active
	State      WarpState
	PC         int32 // shared PC for all active threads in the warp
}

// Block is a group of warps assigned to a single SM for execution.
// Threads within a block share the same shared memory.
type Block struct {
	ID          int
	Warps       []*Warp
	SharedMem   []int32 // shared memory space for this block
	SharedMemSz int
}

// SMState is the state of a streaming multiprocessor
type SMState uint8

const (
	SMIdle SMState = iota
	SMRunning
	SMDone
)

func (s SMState) String() string {
	switch s {
	case SMIdle:
		return "IDLE"
	case SMRunning:
		return "RUNNING"
	case SMDone:
		return "DONE"
	default:
		return "???"
	}
}

// SM (Streaming Multiprocessor) is the main compute unit.
// It receives blocks from the dispatcher, runs all their warps,
// and reports back when done.
type SM struct {
	ID          int
	State       SMState
	ActiveBlock *Block
}

// KernelConfig holds everything needed to launch a kernel
type KernelConfig struct {
	Name        string
	GridDim     int               // number of blocks in the grid
	BlockDim    int               // number of threads per block (must be multiple of 32)
	Program     []isa.Instruction // compiled instructions
	GlobalMem   []int32           // initial global memory state
	SharedMemSz int               // shared memory bytes per block
}
`,
	"isa/isa.go": `// Package isa provides the instruction set architecture for Nyx.  Every opcode NYX will ever understand. We define it all here upfront so every other package imports from one source of truth.

package isa

// Opcode is a 4-bit instruction identifier.
// The opcode values are defined as:
// - 0x0: OP_ADD   (ADD Rd, Rs1, Rs2)
// - 0x1: OP_SUB   (SUB Rd, Rs1, Rs2)
// - 0x2: OP_MUL   (MUL Rd, Rs1, Rs2)
// - 0x3: OP_DIV   (DIV Rd, Rs1, Rs2)
// - 0x4: OP_CMP   (CMP Rs1, Rs2)
// - 0x5: OP_BRnzp (BRnzp mask, offset)
// - 0x6: OP_LDR   (LDR Rd, Rs)
// - 0x7: OP_STR   (STR Rs1, Rs2)
// - 0x8: OP_LDSH  (LDSH Rd, offset)
// - 0x9: OP_STSH  (STSH offset, Rs)
// - 0xA: OP_CONST (CONST Rd, #imm)
// - 0xB: OP_SYNC  (SYNC)
// - 0xC: OP_RET   (RET)
type Opcode uint8

const (
	// Arithmetic
	OP_ADD Opcode = 0x0 // ADD  Rd, Rs1, Rs2     — Rd = Rs1 + Rs2
	OP_SUB Opcode = 0x1 // SUB  Rd, Rs1, Rs2     — Rd = Rs1 - Rs2
	OP_MUL Opcode = 0x2 // MUL  Rd, Rs1, Rs2     — Rd = Rs1 * Rs2
	OP_DIV Opcode = 0x3 // DIV  Rd, Rs1, Rs2     — Rd = Rs1 / Rs2

	// Comparison & branching
	OP_CMP   Opcode = 0x4 // CMP  Rs1, Rs2         — set NZP from Rs1 - Rs2
	OP_BRnzp Opcode = 0x5 // BRnzp mask, offset   — branch if NZP matches mask

	// Memory
	OP_LDR  Opcode = 0x6 // LDR  Rd, Rs           — Rd = GlobalMem[Rs]
	OP_STR  Opcode = 0x7 // STR  Rs1, Rs2         — GlobalMem[Rs1] = Rs2
	OP_LDSH Opcode = 0x8 // LDSH Rd, offset       — Rd = SharedMem[offset]  (shared memory load)
	OP_STSH Opcode = 0x9 // STSH offset, Rs       — SharedMem[offset] = Rs  (shared memory store)

	// Immediate
	OP_CONST Opcode = 0xA // CONST Rd, #imm       — Rd = immediate value

	// Control
	OP_SYNC Opcode = 0xB // SYNC                 — barrier: wait for all threads in block
	OP_RET  Opcode = 0xC // RET                  — thread done
)

// NZP condition bits for BRnzp
// These are OR-able flags. BRnzp with mask 0b110 means "branch if negative or zero"
const (
	NZP_P uint8 = 0b001 // positive
	NZP_Z uint8 = 0b010 // zero
	NZP_N uint8 = 0b100 // negative
)

// Register indices — 16 total registers per thread
// R0–R12: general purpose read/write
// R13–R15: read-only, injected by the runtime per thread
const (
	REG_COUNT = 16

	R0  = 0
	R1  = 1
	R2  = 2
	R3  = 3
	R4  = 4
	R5  = 5
	R6  = 6
	R7  = 7
	R8  = 8
	R9  = 9
	R10 = 10
	R11 = 11
	R12 = 12

	// Read-only special registers (injected at thread launch)
	REG_THREAD_IDX = 13 // %threadIdx — thread index within the block
	REG_BLOCK_IDX  = 14 // %blockIdx  — block index within the grid
	REG_BLOCK_DIM  = 15 // %blockDim  — number of threads per block (warp size)
)

// Instruction is the decoded form of a 32-bit encoded instruction
type Instruction struct {
	Opcode  Opcode
	Rd      uint8 // destination register
	Rs1     uint8 // source register 1
	Rs2     uint8 // source register 2
	Imm     int32 // immediate value (for CONST, BRnzp offset)
	NZPMask uint8 // condition mask for BRnzp
}

// OpName returns a human-readable name for an opcode (used in trace output)
func OpName(op Opcode) string {
	switch op {
	case OP_ADD:
		return "ADD"
	case OP_SUB:
		return "SUB"
	case OP_MUL:
		return "MUL"
	case OP_DIV:
		return "DIV"
	case OP_CMP:
		return "CMP"
	case OP_BRnzp:
		return "BRnzp"
	case OP_LDR:
		return "LDR"
	case OP_STR:
		return "STR"
	case OP_LDSH:
		return "LDSH"
	case OP_STSH:
		return "STSH"
	case OP_CONST:
		return "CONST"
	case OP_SYNC:
		return "SYNC"
	case OP_RET:
		return "RET"
	default:
		return "???"
	}
}
`,
	"memory/memory.go": `// The actual memory. Global memory with simulated read/write latency

package memory

import "fmt"

const (
	GlobalMemSize = 65536 // 64K int32 words of global memory
	ReadLatency   = 4     // cycles to complete a read
	WriteLatency  = 4     // cycles to complete a write
	MaxBandwidth  = 16    // max concurrent memory transactions per cycle
)

// Request is a pending memory transaction from a thread
type Request struct {
	ThreadID   int
	WarpID     int
	SMID       int
	Addr       int32
	IsWrite    bool
	WriteVal   int32
	CyclesLeft int // counts down to 0 when done
}

// Response is what comes back from memory when a request completes
type Response struct {
	ThreadID int
	WarpID   int
	SMID     int
	Addr     int32
	Value    int32
	IsWrite  bool
}

// GlobalMemory is the main off-chip memory store.
// It simulates bandwidth limits by only processing MaxBandwidth requests per cycle.
type GlobalMemory struct {
	Data      []int32
	pending   []*Request
	responses []Response
}

func NewGlobalMemory(size int) *GlobalMemory {
	return &GlobalMemory{
		Data:    make([]int32, size),
		pending: make([]*Request, 0),
	}
}

// Load initial data into memory starting at address 0
func (m *GlobalMemory) LoadData(data []int32) {
	copy(m.Data, data)
}

// Read returns the value at addr immediately (used by assembler/debug)
func (m *GlobalMemory) Read(addr int32) (int32, error) {
	if addr < 0 || int(addr) >= len(m.Data) {
		return 0, fmt.Errorf("global memory read out of bounds: addr=%d", addr)
	}
	return m.Data[addr], nil
}

// Write sets addr immediately (used by assembler/debug)
func (m *GlobalMemory) Write(addr int32, val int32) error {
	if addr < 0 || int(addr) >= len(m.Data) {
		return fmt.Errorf("global memory write out of bounds: addr=%d", addr)
	}
	m.Data[addr] = val
	return nil
}

// Submit queues a memory request from a thread (async path used by simulator)
func (m *GlobalMemory) Submit(req *Request) {
	if req.IsWrite {
		req.CyclesLeft = WriteLatency
	} else {
		req.CyclesLeft = ReadLatency
	}
	m.pending = append(m.pending, req)
}

// Tick advances the memory controller by one cycle.
// It processes up to MaxBandwidth requests, counting down their latency.
// Completed requests are moved to the response queue.
func (m *GlobalMemory) Tick() []Response {
	m.responses = m.responses[:0]

	processed := 0
	remaining := make([]*Request, 0, len(m.pending))

	for _, req := range m.pending {
		if processed < MaxBandwidth {
			req.CyclesLeft--
			processed++

			if req.CyclesLeft <= 0 {
				// Request is complete
				var val int32
				if req.IsWrite {
					m.Data[req.Addr] = req.WriteVal
					val = req.WriteVal
				} else {
					val = m.Data[req.Addr]
				}
				m.responses = append(m.responses, Response{
					ThreadID: req.ThreadID,
					WarpID:   req.WarpID,
					SMID:     req.SMID,
					Addr:     req.Addr,
					Value:    val,
					IsWrite:  req.IsWrite,
				})
				continue // don't keep in remaining
			}
		}
		remaining = append(remaining, req)
	}

	m.pending = remaining
	return m.responses
}

// PendingCount returns how many requests are in flight
func (m *GlobalMemory) PendingCount() int {
	return len(m.pending)
}

// SharedMemory is per-block fast memory.
// No latency — accessible in the same cycle.
type SharedMemory struct {
	Data []int32
	Size int
}

func NewSharedMemory(size int) *SharedMemory {
	return &SharedMemory{
		Data: make([]int32, size),
		Size: size,
	}
}

func (s *SharedMemory) Read(offset int32) (int32, error) {
	if offset < 0 || int(offset) >= s.Size {
		return 0, fmt.Errorf("shared memory read out of bounds: offset=%d size=%d", offset, s.Size)
	}
	return s.Data[offset], nil
}

func (s *SharedMemory) Write(offset int32, val int32) error {
	if offset < 0 || int(offset) >= s.Size {
		return fmt.Errorf("shared memory write out of bounds: offset=%d size=%d", offset, s.Size)
	}
	s.Data[offset] = val
	return nil
}
`,
	"trace/trace.go": `// Nyx tracer
// Shows traces for every cycle, every thread, every warp!

package trace

import (
	"fmt"
	"strings"
	"time"
)

// Level controls how much trace detail is shown
type Level int

const (
	LevelSilent  Level = iota // no output
	LevelSummary              // only cycle count and SM states
	LevelWarp                 // per-warp state each cycle
	LevelThread               // full per-thread detail each cycle
)

// Event is a single trace event emitted during simulation
type Event struct {
	Cycle    int
	SMID     int
	WarpID   int
	ThreadID int
	Kind     string // "FETCH", "EXECUTE", "MEM_REQ", "MEM_RESP", "BRANCH", "RET", "SYNC"
	Detail   string // human readable detail
}

// Tracer collects and displays trace events
type Tracer struct {
	Level     Level
	Events    []Event
	StartTime time.Time
}

func NewTracer(level Level) *Tracer {
	return &Tracer{
		Level:     level,
		Events:    make([]Event, 0, 1024),
		StartTime: time.Now(),
	}
}

func (t *Tracer) Emit(e Event) {
	t.Events = append(t.Events, e)
	if t.Level == LevelSilent {
		return
	}
	t.print(e)
}

func (t *Tracer) print(e Event) {
	switch t.Level {
	case LevelSummary:
		// Only print non-thread events
		if e.ThreadID == -1 {
			fmt.Printf("[cycle %04d] SM%d W%d | %s %s\n",
				e.Cycle, e.SMID, e.WarpID, e.Kind, e.Detail)
		}
	case LevelWarp:
		if e.ThreadID == -1 {
			fmt.Printf("[cycle %04d] SM%d W%02d         | %-10s %s\n",
				e.Cycle, e.SMID, e.WarpID, e.Kind, e.Detail)
		}
	case LevelThread:
		if e.ThreadID >= 0 {
			fmt.Printf("[cycle %04d] SM%d W%02d T%03d     | %-10s %s\n",
				e.Cycle, e.SMID, e.WarpID, e.ThreadID, e.Kind, e.Detail)
		} else {
			fmt.Printf("[cycle %04d] SM%d W%02d           | %-10s %s\n",
				e.Cycle, e.SMID, e.WarpID, e.Kind, e.Detail)
		}
	}
}

// CycleBanner prints a divider at the start of each cycle
func (t *Tracer) CycleBanner(cycle int) {
	if t.Level >= LevelWarp {
		fmt.Printf("\n%s CYCLE %04d %s\n",
			strings.Repeat("─", 20), cycle, strings.Repeat("─", 20))
	}
}

// Summary prints final stats at the end of simulation
func (t *Tracer) Summary(totalCycles int, globalMem []int32, showMemRange [2]int) {
	elapsed := time.Since(t.StartTime)

	fmt.Println()
	fmt.Println(strings.Repeat("═", 52))
	fmt.Println("  NYX SIMULATION COMPLETE")
	fmt.Println(strings.Repeat("═", 52))
	fmt.Printf("  Total cycles   : %d\n", totalCycles)
	fmt.Printf("  Total events   : %d\n", len(t.Events))
	fmt.Printf("  Wall time      : %s\n", elapsed.Round(time.Millisecond))
	fmt.Println(strings.Repeat("─", 52))

	// Print a slice of global memory so you can see results
	start := showMemRange[0]
	end := showMemRange[1]
	if end > len(globalMem) {
		end = len(globalMem)
	}
	fmt.Printf("  Global mem [%d..%d]:\n", start, end-1)
	for i := start; i < end; i++ {
		fmt.Printf("    [%03d] = %d\n", i, globalMem[i])
	}
	fmt.Println(strings.Repeat("═", 52))
}
`,
	"go.mod": `module github.com/exprays/nyx

go 1.22`,
};
