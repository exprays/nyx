// A complete per-thread state machine: FETCH → DECODE → EXECUTE → UPDATE.
// Every stage is explicit. No shortcuts.

package core

import (
	"fmt"

	"github.com/exprays/nyx/isa"
	"github.com/exprays/nyx/memory"
)

// StepResult is what a thread reports after one cycle tick
type StepResult struct {
	ThreadID   int
	State      ThreadState
	PC         int32
	Instr      isa.Instruction
	Disasm     string
	MemRequest *memory.Request // non-nil if thread is issuing a memory op
	Done       bool
	Err        error
}

// Tick advances a single thread by one cycle.
// program is the full instruction slice.
// memResponses is the set of memory responses that arrived this cycle.
// sharedMem is the block's shared memory.
func (t *Thread) Tick(
	program []isa.Instruction,
	memResponses []memory.Response,
	sharedMem *memory.SharedMemory,
) StepResult {

	result := StepResult{
		ThreadID: t.ID,
		State:    t.State,
		PC:       t.PC,
	}

	switch t.State {

	// ── FETCH ────────────────────────────────────────────────────────────────
	case ThreadFetch:
		if int(t.PC) >= len(program) {
			result.Err = fmt.Errorf("thread %d: PC %d out of program bounds (%d instructions)",
				t.ID, t.PC, len(program))
			t.State = ThreadDone
			result.State = t.State
			return result
		}
		// Latch the instruction — in a real GPU this would be an async
		// fetch from instruction cache. We model it as instant for now
		// (cache is Part 6). Transition straight to DECODE.
		instr := program[t.PC]
		result.Instr = instr
		result.Disasm = isa.Disassemble(instr)
		t.State = ThreadDecode
		result.State = t.State
		return result

	// ── DECODE ───────────────────────────────────────────────────────────────
	case ThreadDecode:
		// Re-read the instruction at current PC (already latched conceptually)
		instr := program[t.PC]
		result.Instr = instr
		result.Disasm = isa.Disassemble(instr)

		switch instr.Opcode {
		case isa.OP_LDR, isa.OP_STR:
			// Memory ops go to REQUEST state first
			t.State = ThreadMemReq
		case isa.OP_LDSH, isa.OP_STSH:
			// Shared memory — no latency, go straight to execute
			t.State = ThreadExecute
		default:
			t.State = ThreadExecute
		}
		result.State = t.State
		return result

	// ── EXECUTE ──────────────────────────────────────────────────────────────
	case ThreadExecute:
		instr := program[t.PC]
		result.Instr = instr
		result.Disasm = isa.Disassemble(instr)

		err := t.execute(instr, sharedMem)
		if err != nil {
			result.Err = err
			t.State = ThreadDone
			result.State = t.State
			return result
		}

		// After RET we are done — don't advance PC
		if instr.Opcode == isa.OP_RET {
			t.State = ThreadDone
			result.Done = true
			result.State = t.State
			return result
		}

		// SYNC stalls until the warp scheduler releases us
		if instr.Opcode == isa.OP_SYNC {
			t.State = ThreadSyncWait
			result.State = t.State
			return result
		}

		// Everything else: advance PC and go back to FETCH
		t.PC++
		t.State = ThreadFetch
		result.State = t.State
		return result

	// ── MEM_REQ ──────────────────────────────────────────────────────────────
	case ThreadMemReq:
		instr := program[t.PC]
		result.Instr = instr
		result.Disasm = isa.Disassemble(instr)

		var req *memory.Request
		switch instr.Opcode {
		case isa.OP_LDR:
			addr := t.Registers[instr.Rs1]
			req = &memory.Request{
				ThreadID: t.ID,
				Addr:     addr,
				IsWrite:  false,
			}
			t.MemAddr = addr
			t.MemIsLoad = true

		case isa.OP_STR:
			addr := t.Registers[instr.Rs1]
			val := t.Registers[instr.Rs2]
			req = &memory.Request{
				ThreadID: t.ID,
				Addr:     addr,
				IsWrite:  true,
				WriteVal: val,
			}
			t.MemAddr = addr
			t.MemValue = val
			t.MemIsLoad = false
		}

		result.MemRequest = req
		t.State = ThreadMemWait
		result.State = t.State
		return result

	// ── MEM_WAIT ─────────────────────────────────────────────────────────────
	case ThreadMemWait:
		instr := program[t.PC]
		result.Instr = instr
		result.Disasm = isa.Disassemble(instr)

		// Scan this cycle's memory responses for our thread
		for _, resp := range memResponses {
			if resp.ThreadID == t.ID && resp.Addr == t.MemAddr {
				if t.MemIsLoad {
					// Write the loaded value into the destination register
					t.Registers[instr.Rd] = resp.Value
				}
				// Done waiting — advance PC
				t.PC++
				t.State = ThreadFetch
				result.State = t.State
				return result
			}
		}

		// No response yet — stay in MEM_WAIT
		result.State = t.State
		return result

	// ── SYNC_WAIT ────────────────────────────────────────────────────────────
	case ThreadSyncWait:
		// The warp scheduler will flip us back to ThreadFetch
		// when all threads in the block reach SYNC_WAIT.
		// Nothing to do here — just report state.
		result.State = t.State
		return result

	// ── DONE ─────────────────────────────────────────────────────────────────
	case ThreadDone:
		result.Done = true
		result.State = t.State
		return result
	}

	result.Err = fmt.Errorf("thread %d: unhandled state %v", t.ID, t.State)
	return result
}

// execute performs the actual computation for a single instruction.
// It mutates t.Registers and t.NZP in place.
func (t *Thread) execute(instr isa.Instruction, sharedMem *memory.SharedMemory) error {
	r := &t.Registers // shorthand

	switch instr.Opcode {

	case isa.OP_ADD:
		r[instr.Rd] = r[instr.Rs1] + r[instr.Rs2]

	case isa.OP_SUB:
		r[instr.Rd] = r[instr.Rs1] - r[instr.Rs2]

	case isa.OP_MUL:
		r[instr.Rd] = r[instr.Rs1] * r[instr.Rs2]

	case isa.OP_DIV:
		if r[instr.Rs2] == 0 {
			return fmt.Errorf("thread %d: division by zero at PC %d", t.ID, t.PC)
		}
		r[instr.Rd] = r[instr.Rs1] / r[instr.Rs2]

	case isa.OP_CMP:
		diff := r[instr.Rs1] - r[instr.Rs2]
		switch {
		case diff < 0:
			t.NZP = NZP_NEGATIVE
		case diff == 0:
			t.NZP = NZP_ZERO
		default:
			t.NZP = NZP_POSITIVE
		}

	case isa.OP_BRnzp:
		nzpBit := uint8(t.NZP)
		if nzpBit&instr.NZPMask != 0 {
			// Branch taken — PC-relative, offset from NEXT instruction
			// We are in execute, PC hasn't been incremented yet.
			// After execute, the caller does t.PC++ unless we are RET/SYNC.
			// So we need to set PC = current + 1 + offset, then subtract 1
			// because execute's caller will do PC++ unconditionally.
			// Simplest: set PC to target - 1, then let caller do PC++.
			t.PC = t.PC + 1 + instr.Imm - 1
		}
		// Branch not taken — caller does t.PC++ normally

	case isa.OP_CONST:
		r[instr.Rd] = instr.Imm

	case isa.OP_LDSH:
		if sharedMem == nil {
			return fmt.Errorf("thread %d: LDSH but no shared memory", t.ID)
		}
		val, err := sharedMem.Read(instr.Imm)
		if err != nil {
			return fmt.Errorf("thread %d LDSH: %w", t.ID, err)
		}
		r[instr.Rd] = val

	case isa.OP_STSH:
		if sharedMem == nil {
			return fmt.Errorf("thread %d: STSH but no shared memory", t.ID)
		}
		if err := sharedMem.Write(instr.Imm, r[instr.Rs1]); err != nil {
			return fmt.Errorf("thread %d STSH: %w", t.ID, err)
		}

	case isa.OP_SYNC, isa.OP_RET:
		// handled in Tick state machine above

	case isa.OP_LDR, isa.OP_STR:
		// handled via MemReq/MemWait states — should not reach execute

	default:
		return fmt.Errorf("thread %d: unknown opcode %d", t.ID, instr.Opcode)
	}

	return nil
}
