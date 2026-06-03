export const INITIAL_FILES: Record<string, string> = {
	"main.go": `package main

import (
	"fmt"
	"os"

	"github.com/exprays/nyx/asm"
	"github.com/exprays/nyx/isa"
)

const vecaddSrc = \`
; vecadd.nyx
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
\`

const matmulSrc = \`
; matmul.nyx
MUL  R0, %blockIdx, %blockDim
ADD  R0, R0, %threadIdx
CONST R1, #1
CONST R2, #2
CONST R3, #0
CONST R4, #4
CONST R5, #8
DIV  R6, R0, R2
MUL  R7, R6, R2
SUB  R7, R0, R7
CONST R8, #0
CONST R9, #0
LOOP:
    MUL  R10, R6, R2
    ADD  R10, R10, R9
    ADD  R10, R10, R3
    LDR  R10, R10
    MUL  R11, R9, R2
    ADD  R11, R11, R7
    ADD  R11, R11, R4
    LDR  R11, R11
    MUL  R12, R10, R11
    ADD  R8, R8, R12
    ADD  R9, R9, R1
    CMP  R9, R2
    BRN  LOOP
ADD  R10, R5, R0
STR  R10, R8
RET
\`

func main() {
	fmt.Println("╔══════════════════════════════════════════════╗")
	fmt.Println("║               NYX Assembler                  ║")
	fmt.Println("╚══════════════════════════════════════════════╝")

	assembleAndPrint("vecadd", vecaddSrc)
	fmt.Println()
	assembleAndPrint("matmul", matmulSrc)
}

func assembleAndPrint(name, src string) {
	a := asm.New(src)
	kernel, err := a.Assemble()
	if err != nil {
		fmt.Fprintf(os.Stderr, "assemble %s: %v\\n", name, err)
		os.Exit(1)
	}

	fmt.Printf("\\n── %s (%d instructions) ──\\n", name, len(kernel.Instructions))

	// Print labels map
	if len(kernel.Labels) > 0 {
		fmt.Println("  Labels:")
		for label, idx := range kernel.Labels {
			fmt.Printf("    %-12s → pc=%d\\n", label, idx)
		}
	}

	// Print disassembly with encoding
	fmt.Printf("\\n  %-4s  %-10s  %-30s  %s\\n", "PC", "HEX", "DISASM", "SOURCE")
	fmt.Println("  " + "─────────────────────────────────────────────────────────")
	for i, instr := range kernel.Instructions {
		encoded, err := isa.Encode(instr)
		if err != nil {
			fmt.Fprintf(os.Stderr, "encode error at pc=%d: %v\\n", i, err)
			os.Exit(1)
		}

		srcLine := ""
		if i < len(kernel.SourceLines) {
			srcLine = kernel.SourceLines[i]
		}

		disasm := isa.Disassemble(instr)
		fmt.Printf("  %-4d  0x%08X  %-30s  ; %s\\n",
			i, encoded, disasm, srcLine)
	}

	// Verify round-trip: encode → decode → re-encode must match
	fmt.Println("\\n  Round-trip check (encode → decode → encode):")
	allOk := true
	for i, instr := range kernel.Instructions {
		enc1, _ := isa.Encode(instr)
		dec, err := isa.Decode(enc1)
		if err != nil {
			fmt.Printf("    pc=%d DECODE ERROR: %v\\n", i, err)
			allOk = false
			continue
		}
		enc2, _ := isa.Encode(dec)
		if enc1 != enc2 {
			fmt.Printf("    pc=%d MISMATCH: 0x%08X → 0x%08X\\n", i, enc1, enc2)
			allOk = false
		}
	}
	if allOk {
		fmt.Println("  ✓ all instructions encode/decode correctly")
	}
}`,
	"config.json": `{
  "name": "custom-kernel",
  "gridDim": 1,
  "blockDim": 32,
  "sharedMemSz": 64
}`,
	"Makefile": `.PHONY: all setup install build build-wasm run-impl run-web test clean help

all: help

help:
	@echo "Available commands:"
	@echo "  make setup      - Install dependencies for backend and frontend"
	@echo "  make build      - Build both the Go backend and Next.js frontend"
	@echo "  make build-wasm - Compile Go simulator package to browser WebAssembly"
	@echo "  make run-impl   - Run the Go simulator"
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

run-impl:
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
	"isa/encoding.go": `// Package isa provides the instruction set architecture (ISA) definitions and utilities for the Nyx GPU simulator.
// It includes opcode constants, instruction structure, encoding/decoding logic, and disassembly functionality.

package isa

import "fmt"

// 32-bit instruction encoding layout:
//
// Bits [31:28] — opcode     (4 bits)
// Bits [27:24] — Rd         (4 bits, destination register)
// Bits [23:20] — Rs1        (4 bits, source register 1)
// Bits [19:16] — Rs2        (4 bits, source register 2)
// Bits [15:13] — NZP mask   (3 bits, for BRnzp only)
// Bits [15:0]  — immediate  (16 bits signed, for CONST/BRnzp — overlaps Rs2/NZP)
//
// Instructions that use immediate:
//   CONST  → [31:28]=opcode [27:24]=Rd  [15:0]=imm16
//   BRnzp  → [31:28]=opcode [15:13]=nzp [12:0]=offset13 (signed)
//
// Instructions that use registers:
//   ADD/SUB/MUL/DIV/CMP → [31:28]=opcode [27:24]=Rd [23:20]=Rs1 [19:16]=Rs2
//   LDR  → [31:28]=opcode [27:24]=Rd  [23:20]=Rs1
//   STR  → [31:28]=opcode [27:24]=Rs1 [23:20]=Rs2
//   LDSH → [31:28]=opcode [27:24]=Rd  [15:0]=offset16
//   STSH → [31:28]=opcode [27:24]=Rs1 [15:0]=offset16
//   SYNC → [31:28]=opcode (rest unused)
//   RET  → [31:28]=opcode (rest unused)

func Encode(instr Instruction) (uint32, error) {
	op := uint32(instr.Opcode) << 28

	switch instr.Opcode {
	case OP_ADD, OP_SUB, OP_MUL, OP_DIV:
		return op |
			(uint32(instr.Rd)&0xF)<<24 |
			(uint32(instr.Rs1)&0xF)<<20 |
			(uint32(instr.Rs2)&0xF)<<16, nil

	case OP_CMP:
		return op |
			(uint32(instr.Rs1)&0xF)<<20 |
			(uint32(instr.Rs2)&0xF)<<16, nil

	case OP_BRnzp:
		offset := uint32(instr.Imm) & 0x1FFF // 13 bits signed
		nzp := uint32(instr.NZPMask) & 0x7
		return op | (nzp << 13) | offset, nil

	case OP_LDR:
		return op |
			(uint32(instr.Rd)&0xF)<<24 |
			(uint32(instr.Rs1)&0xF)<<20, nil

	case OP_STR:
		return op |
			(uint32(instr.Rs1)&0xF)<<24 |
			(uint32(instr.Rs2)&0xF)<<20, nil

	case OP_LDSH:
		offset := uint32(instr.Imm) & 0xFFFF
		return op |
			(uint32(instr.Rd)&0xF)<<24 |
			offset, nil

	case OP_STSH:
		offset := uint32(instr.Imm) & 0xFFFF
		return op |
			(uint32(instr.Rs1)&0xF)<<24 |
			offset, nil

	case OP_CONST:
		imm := uint32(instr.Imm) & 0xFFFF
		return op |
			(uint32(instr.Rd)&0xF)<<24 |
			imm, nil

	case OP_SYNC, OP_RET:
		return op, nil

	default:
		return 0, fmt.Errorf("encode: unknown opcode %d", instr.Opcode)
	}
}

func Decode(word uint32) (Instruction, error) {
	opcode := Opcode(word >> 28)

	switch opcode {
	case OP_ADD, OP_SUB, OP_MUL, OP_DIV:
		return Instruction{
			Opcode: opcode,
			Rd:     uint8((word >> 24) & 0xF),
			Rs1:    uint8((word >> 20) & 0xF),
			Rs2:    uint8((word >> 16) & 0xF),
		}, nil

	case OP_CMP:
		return Instruction{
			Opcode: opcode,
			Rs1:    uint8((word >> 20) & 0xF),
			Rs2:    uint8((word >> 16) & 0xF),
		}, nil

	case OP_BRnzp:
		// sign extend 13-bit offset
		raw := int32(word & 0x1FFF)
		if raw&0x1000 != 0 {
			raw |= ^int32(0x1FFF) // sign extend
		}
		return Instruction{
			Opcode:  opcode,
			NZPMask: uint8((word >> 13) & 0x7),
			Imm:     raw,
		}, nil

	case OP_LDR:
		return Instruction{
			Opcode: opcode,
			Rd:     uint8((word >> 24) & 0xF),
			Rs1:    uint8((word >> 20) & 0xF),
		}, nil

	case OP_STR:
		return Instruction{
			Opcode: opcode,
			Rs1:    uint8((word >> 24) & 0xF),
			Rs2:    uint8((word >> 20) & 0xF),
		}, nil

	case OP_LDSH:
		raw := int32(word & 0xFFFF)
		return Instruction{
			Opcode: opcode,
			Rd:     uint8((word >> 24) & 0xF),
			Imm:    raw,
		}, nil

	case OP_STSH:
		raw := int32(word & 0xFFFF)
		return Instruction{
			Opcode: opcode,
			Rs1:    uint8((word >> 24) & 0xF),
			Imm:    raw,
		}, nil

	case OP_CONST:
		// sign extend 16-bit immediate
		raw := int32(word & 0xFFFF)
		if raw&0x8000 != 0 {
			raw |= ^int32(0xFFFF)
		}
		return Instruction{
			Opcode: opcode,
			Rd:     uint8((word >> 24) & 0xF),
			Imm:    raw,
		}, nil

	case OP_SYNC, OP_RET:
		return Instruction{Opcode: opcode}, nil

	default:
		return Instruction{}, fmt.Errorf("decode: unknown opcode %d", opcode)
	}
}

// Disassemble returns a human-readable string for an instruction
// This is what the trace viewer prints next to each instruction
func Disassemble(instr Instruction) string {
	regName := func(r uint8) string {
		switch r {
		case 13:
			return "%threadIdx"
		case 14:
			return "%blockIdx"
		case 15:
			return "%blockDim"
		default:
			return fmt.Sprintf("R%d", r)
		}
	}

	switch instr.Opcode {
	case OP_ADD:
		return fmt.Sprintf("ADD  %s, %s, %s",
			regName(instr.Rd), regName(instr.Rs1), regName(instr.Rs2))
	case OP_SUB:
		return fmt.Sprintf("SUB  %s, %s, %s",
			regName(instr.Rd), regName(instr.Rs1), regName(instr.Rs2))
	case OP_MUL:
		return fmt.Sprintf("MUL  %s, %s, %s",
			regName(instr.Rd), regName(instr.Rs1), regName(instr.Rs2))
	case OP_DIV:
		return fmt.Sprintf("DIV  %s, %s, %s",
			regName(instr.Rd), regName(instr.Rs1), regName(instr.Rs2))
	case OP_CMP:
		return fmt.Sprintf("CMP  %s, %s",
			regName(instr.Rs1), regName(instr.Rs2))
	case OP_BRnzp:
		cond := nzpMaskStr(instr.NZPMask)
		return fmt.Sprintf("BR%s  #%d", cond, instr.Imm)
	case OP_LDR:
		return fmt.Sprintf("LDR  %s, [%s]",
			regName(instr.Rd), regName(instr.Rs1))
	case OP_STR:
		return fmt.Sprintf("STR  [%s], %s",
			regName(instr.Rs1), regName(instr.Rs2))
	case OP_LDSH:
		return fmt.Sprintf("LDSH %s, shm[%d]", regName(instr.Rd), instr.Imm)
	case OP_STSH:
		return fmt.Sprintf("STSH shm[%d], %s", instr.Imm, regName(instr.Rs1))
	case OP_CONST:
		return fmt.Sprintf("CONST %s, #%d", regName(instr.Rd), instr.Imm)
	case OP_SYNC:
		return "SYNC"
	case OP_RET:
		return "RET"
	default:
		return fmt.Sprintf("??? (0x%08X)", instr.Opcode)
	}
}

func nzpMaskStr(mask uint8) string {
	s := ""
	if mask&0b100 != 0 {
		s += "n"
	}
	if mask&0b010 != 0 {
		s += "z"
	}
	if mask&0b001 != 0 {
		s += "p"
	}
	if s == "" {
		s = "nzp"
	}
	return s
}
`,
	"asm/assembler.go": `// A working single-pass assembler with a label resolution pass. Takes .nyx source text and emits []isa.Instruction.

package asm

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/exprays/nyx/isa"
)

// AssembledKernel is the output of the assembler
type AssembledKernel struct {
	Instructions []isa.Instruction
	// Source lines parallel to Instructions for error reporting and trace
	SourceLines []string
	// Labels maps label name → instruction index
	Labels map[string]int
}

// Assembler parses .nyx source and emits instructions
type Assembler struct {
	source string
	lines  []string
	labels map[string]int // label → line index in instruction list
	// pending label references that need resolving after first pass
	pending []pendingLabel
}

type pendingLabel struct {
	instrIdx int
	label    string
}

func New(source string) *Assembler {
	return &Assembler{
		source:  source,
		labels:  make(map[string]int),
		pending: make([]pendingLabel, 0),
	}
}

// Assemble runs the full two-pass assembly process
func (a *Assembler) Assemble() (*AssembledKernel, error) {
	raw := strings.Split(a.source, "\\n")
	instrs := make([]isa.Instruction, 0, len(raw))
	srcLines := make([]string, 0, len(raw))

	// Pass 1 — collect labels and emit instructions with placeholder offsets
	for lineNum, rawLine := range raw {
		line := stripComment(rawLine)
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Label definition: "LOOP:" or "END:"
		if strings.HasSuffix(line, ":") {
			label := strings.TrimSuffix(line, ":")
			label = strings.TrimSpace(label)
			a.labels[label] = len(instrs)
			continue
		}

		instr, err := a.parseLine(line, len(instrs))
		if err != nil {
			return nil, fmt.Errorf("line %d: %w", lineNum+1, err)
		}

		instrs = append(instrs, instr)
		srcLines = append(srcLines, strings.TrimSpace(rawLine))
	}

	// Pass 2 — resolve label references into PC-relative offsets
	for _, p := range a.pending {
		target, ok := a.labels[p.label]
		if !ok {
			return nil, fmt.Errorf("undefined label: %q", p.label)
		}
		// offset is relative to the instruction AFTER the branch
		offset := int32(target - (p.instrIdx + 1))
		instrs[p.instrIdx].Imm = offset
	}

	return &AssembledKernel{
		Instructions: instrs,
		SourceLines:  srcLines,
		Labels:       a.labels,
	}, nil
}

func (a *Assembler) parseLine(line string, instrIdx int) (isa.Instruction, error) {
	parts := tokenize(line)
	if len(parts) == 0 {
		return isa.Instruction{}, fmt.Errorf("empty instruction")
	}

	mnemonic := strings.ToUpper(parts[0])

	switch mnemonic {
	case "ADD":
		return a.parseRRR(isa.OP_ADD, parts)
	case "SUB":
		return a.parseRRR(isa.OP_SUB, parts)
	case "MUL":
		return a.parseRRR(isa.OP_MUL, parts)
	case "DIV":
		return a.parseRRR(isa.OP_DIV, parts)

	case "CMP":
		return a.parseRR(isa.OP_CMP, parts)

	case "BRN":
		return a.parseBranch(isa.NZP_N, parts, instrIdx)
	case "BRZ":
		return a.parseBranch(isa.NZP_Z, parts, instrIdx)
	case "BRP":
		return a.parseBranch(isa.NZP_P, parts, instrIdx)
	case "BRNZ":
		return a.parseBranch(isa.NZP_N|isa.NZP_Z, parts, instrIdx)
	case "BRNP":
		return a.parseBranch(isa.NZP_N|isa.NZP_P, parts, instrIdx)
	case "BRZP":
		return a.parseBranch(isa.NZP_Z|isa.NZP_P, parts, instrIdx)
	case "BRNZP":
		return a.parseBranch(isa.NZP_N|isa.NZP_Z|isa.NZP_P, parts, instrIdx)

	case "LDR":
		return a.parseLDR(parts)
	case "STR":
		return a.parseSTR(parts)
	case "LDSH":
		return a.parseLDSH(parts)
	case "STSH":
		return a.parseSTSH(parts)

	case "CONST":
		return a.parseCONST(parts)

	case "SYNC":
		return isa.Instruction{Opcode: isa.OP_SYNC}, nil
	case "RET":
		return isa.Instruction{Opcode: isa.OP_RET}, nil

	default:
		return isa.Instruction{}, fmt.Errorf("unknown mnemonic %q", mnemonic)
	}
}

// ── register/immediate parsers ──────────────────────────────────────────────

func (a *Assembler) parseRRR(op isa.Opcode, parts []string) (isa.Instruction, error) {
	if len(parts) != 4 {
		return isa.Instruction{}, fmt.Errorf("%s expects 3 operands", parts[0])
	}
	rd, err := parseReg(parts[1])
	if err != nil {
		return isa.Instruction{}, err
	}
	rs1, err := parseReg(parts[2])
	if err != nil {
		return isa.Instruction{}, err
	}
	rs2, err := parseReg(parts[3])
	if err != nil {
		return isa.Instruction{}, err
	}
	return isa.Instruction{Opcode: op, Rd: rd, Rs1: rs1, Rs2: rs2}, nil
}

func (a *Assembler) parseRR(op isa.Opcode, parts []string) (isa.Instruction, error) {
	if len(parts) != 3 {
		return isa.Instruction{}, fmt.Errorf("%s expects 2 operands", parts[0])
	}
	rs1, err := parseReg(parts[1])
	if err != nil {
		return isa.Instruction{}, err
	}
	rs2, err := parseReg(parts[2])
	if err != nil {
		return isa.Instruction{}, err
	}
	return isa.Instruction{Opcode: op, Rs1: rs1, Rs2: rs2}, nil
}

func (a *Assembler) parseBranch(mask uint8, parts []string, instrIdx int) (isa.Instruction, error) {
	if len(parts) != 2 {
		return isa.Instruction{}, fmt.Errorf("branch expects a label or offset")
	}
	target := parts[1]

	// Is it a numeric offset?
	if strings.HasPrefix(target, "#") {
		imm, err := parseImm(target)
		if err != nil {
			return isa.Instruction{}, err
		}
		return isa.Instruction{Opcode: isa.OP_BRnzp, NZPMask: mask, Imm: imm}, nil
	}

	// It's a label — schedule resolution in pass 2
	a.pending = append(a.pending, pendingLabel{instrIdx: instrIdx, label: target})
	return isa.Instruction{Opcode: isa.OP_BRnzp, NZPMask: mask, Imm: 0}, nil
}

func (a *Assembler) parseLDR(parts []string) (isa.Instruction, error) {
	// LDR Rd, Rs
	if len(parts) != 3 {
		return isa.Instruction{}, fmt.Errorf("LDR expects: LDR Rd, Rs")
	}
	rd, err := parseReg(parts[1])
	if err != nil {
		return isa.Instruction{}, err
	}
	rs1, err := parseReg(parts[2])
	if err != nil {
		return isa.Instruction{}, err
	}
	return isa.Instruction{Opcode: isa.OP_LDR, Rd: rd, Rs1: rs1}, nil
}

func (a *Assembler) parseSTR(parts []string) (isa.Instruction, error) {
	// STR Rs1, Rs2   →  Mem[Rs1] = Rs2
	if len(parts) != 3 {
		return isa.Instruction{}, fmt.Errorf("STR expects: STR Rs1, Rs2")
	}
	rs1, err := parseReg(parts[1])
	if err != nil {
		return isa.Instruction{}, err
	}
	rs2, err := parseReg(parts[2])
	if err != nil {
		return isa.Instruction{}, err
	}
	return isa.Instruction{Opcode: isa.OP_STR, Rs1: rs1, Rs2: rs2}, nil
}

func (a *Assembler) parseLDSH(parts []string) (isa.Instruction, error) {
	// LDSH Rd, #offset
	if len(parts) != 3 {
		return isa.Instruction{}, fmt.Errorf("LDSH expects: LDSH Rd, #offset")
	}
	rd, err := parseReg(parts[1])
	if err != nil {
		return isa.Instruction{}, err
	}
	imm, err := parseImm(parts[2])
	if err != nil {
		return isa.Instruction{}, err
	}
	return isa.Instruction{Opcode: isa.OP_LDSH, Rd: rd, Imm: imm}, nil
}

func (a *Assembler) parseSTSH(parts []string) (isa.Instruction, error) {
	// STSH #offset, Rs
	if len(parts) != 3 {
		return isa.Instruction{}, fmt.Errorf("STSH expects: STSH #offset, Rs")
	}
	imm, err := parseImm(parts[1])
	if err != nil {
		return isa.Instruction{}, err
	}
	rs1, err := parseReg(parts[2])
	if err != nil {
		return isa.Instruction{}, err
	}
	return isa.Instruction{Opcode: isa.OP_STSH, Rs1: rs1, Imm: imm}, nil
}

func (a *Assembler) parseCONST(parts []string) (isa.Instruction, error) {
	// CONST Rd, #imm
	if len(parts) != 3 {
		return isa.Instruction{}, fmt.Errorf("CONST expects: CONST Rd, #imm")
	}
	rd, err := parseReg(parts[1])
	if err != nil {
		return isa.Instruction{}, err
	}
	imm, err := parseImm(parts[2])
	if err != nil {
		return isa.Instruction{}, err
	}
	return isa.Instruction{Opcode: isa.OP_CONST, Rd: rd, Imm: imm}, nil
}

// ── helpers ──────────────────────────────────────────────────────────────────

func parseReg(s string) (uint8, error) {
	s = strings.TrimSpace(s)
	upper := strings.ToUpper(s)
	switch upper {
	case "%THREADIDX":
		return isa.REG_THREAD_IDX, nil
	case "%BLOCKIDX":
		return isa.REG_BLOCK_IDX, nil
	case "%BLOCKDIM":
		return isa.REG_BLOCK_DIM, nil
	}
	if !strings.HasPrefix(upper, "R") {
		return 0, fmt.Errorf("expected register, got %q", s)
	}
	n, err := strconv.ParseUint(upper[1:], 10, 8)
	if err != nil || n > 12 {
		return 0, fmt.Errorf("invalid register %q (R0–R12 only)", s)
	}
	return uint8(n), nil
}

func parseImm(s string) (int32, error) {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "#") {
		s = s[1:]
	}
	n, err := strconv.ParseInt(s, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("invalid immediate %q", s)
	}
	return int32(n), nil
}

// tokenize splits a line on whitespace and commas, dropping empties
func tokenize(line string) []string {
	// replace commas with spaces so "ADD R0, R1, R2" and "ADD R0 R1 R2" both work
	line = strings.ReplaceAll(line, ",", " ")
	raw := strings.Fields(line)
	out := make([]string, 0, len(raw))
	for _, f := range raw {
		f = strings.TrimSpace(f)
		if f != "" {
			out = append(out, f)
		}
	}
	return out
}

// stripComment removes everything from ";" onward
func stripComment(line string) string {
	if idx := strings.Index(line, ";"); idx >= 0 {
		return line[:idx]
	}
	return line
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
	"kernels/vecadd.nyx": `; vecadd.nyx — vector addition kernel
; A[i] + B[i] → C[i]  for i in 0..7
;
; Memory layout:
;   [0..7]   = A
;   [8..15]  = B
;   [16..23] = C  (output)

; i = blockIdx * blockDim + threadIdx
MUL  R0, %blockIdx, %blockDim
ADD  R0, R0, %threadIdx        ; R0 = global thread id = i

CONST R1, #0                   ; baseA = 0
CONST R2, #8                   ; baseB = 8
CONST R3, #16                  ; baseC = 16

ADD  R4, R1, R0                ; addr(A[i]) = baseA + i
LDR  R4, R4                    ; R4 = A[i]

ADD  R5, R2, R0                ; addr(B[i]) = baseB + i
LDR  R5, R5                    ; R5 = B[i]

ADD  R6, R4, R5                ; R6 = A[i] + B[i]

ADD  R7, R3, R0                ; addr(C[i]) = baseC + i
STR  R7, R6                    ; C[i] = R6

RET`,
	"kernels/matmul.nyx": `; matmul.nyx — 2x2 matrix multiplication
; C = A * B
;
; Memory layout:
;   [0..3]  = A (row-major: A[0][0] A[0][1] A[1][0] A[1][1])
;   [4..7]  = B
;   [8..11] = C (output)

; i = blockIdx * blockDim + threadIdx
MUL  R0, %blockIdx, %blockDim
ADD  R0, R0, %threadIdx        ; R0 = i (0..3)

CONST R1, #1                   ; increment
CONST R2, #2                   ; N = 2 (matrix dimension)
CONST R3, #0                   ; baseA
CONST R4, #4                   ; baseB
CONST R5, #8                   ; baseC

DIV  R6, R0, R2                ; row = i / N
MUL  R7, R6, R2
SUB  R7, R0, R7                ; col = i % N  (= i - row*N)

CONST R8, #0                   ; acc = 0
CONST R9, #0                   ; k = 0

LOOP:
    MUL  R10, R6, R2
    ADD  R10, R10, R9
    ADD  R10, R10, R3          ; addr(A[row][k]) = row*N + k + baseA
    LDR  R10, R10              ; R10 = A[row][k]

    MUL  R11, R9, R2
    ADD  R11, R11, R7
    ADD  R11, R11, R4          ; addr(B[k][col]) = k*N + col + baseB
    LDR  R11, R11              ; R11 = B[k][col]

    MUL  R12, R10, R11
    ADD  R8, R8, R12           ; acc += A[row][k] * B[k][col]

    ADD  R9, R9, R1            ; k++

    CMP  R9, R2                ; compare k with N
    BRN  LOOP                  ; if k - N < 0 (k < N), loop

ADD  R10, R5, R0               ; addr(C[i]) = baseC + i
STR  R10, R8                   ; C[i] = acc

RET`,
	"go.mod": `module github.com/exprays/nyx

go 1.22`,
};
