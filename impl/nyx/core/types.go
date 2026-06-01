// All the core types that the rest of the simulator is built upon.

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
