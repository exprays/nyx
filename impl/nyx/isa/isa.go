// Package isa provides the instruction set architecture for Nyx.  Every opcode NYX will ever understand. We define it all here upfront so every other package imports from one source of truth.

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
