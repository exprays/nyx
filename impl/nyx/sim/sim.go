package sim

import (
	"fmt"

	"github.com/exprays/nyx/core"
	"github.com/exprays/nyx/memory"
	"github.com/exprays/nyx/trace"
)

const (
	WarpSize  = 32
	MaxWarps  = 8
	NumSMs    = 4
	MaxCycles = 100000
)

type Sim struct {
	Config     *core.KernelConfig
	GlobalMem  *memory.GlobalMemory
	SMs        [NumSMs]*core.SM
	Dispatcher *Dispatcher
	Tracer     *trace.Tracer
	Cycle      int
}

func New(cfg *core.KernelConfig, tracer *trace.Tracer) (*Sim, error) {
	if err := validateConfig(cfg); err != nil {
		return nil, fmt.Errorf("invalid kernel config: %w", err)
	}

	gm := memory.NewGlobalMemory(memory.GlobalMemSize)
	gm.LoadData(cfg.GlobalMem)

	s := &Sim{
		Config:     cfg,
		GlobalMem:  gm,
		Dispatcher: NewDispatcher(cfg),
		Tracer:     tracer,
	}

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
		return fmt.Errorf("BlockDim (%d) must be a multiple of WarpSize (%d)",
			cfg.BlockDim, WarpSize)
	}
	if cfg.GridDim == 0 {
		return fmt.Errorf("GridDim must be > 0")
	}
	if len(cfg.Program) == 0 {
		return fmt.Errorf("program is empty")
	}
	return nil
}

// Run executes the kernel to completion and returns the final cycle count
func (s *Sim) Run() (int, error) {
	for s.Cycle = 0; s.Cycle < MaxCycles; s.Cycle++ {
		s.Tracer.CycleBanner(s.Cycle)

		// 1. Dispatch blocks to idle SMs
		s.Dispatcher.Assign(s.SMs)

		// 2. Tick global memory — get responses for this cycle
		memResponses := s.GlobalMem.Tick()

		// 3. Route memory responses to the right SMs
		// Build a per-SM response map for fast lookup
		smResponses := make(map[int][]memory.Response)
		for _, resp := range memResponses {
			smResponses[resp.SMID] = append(smResponses[resp.SMID], resp)
		}

		// 4. Tick each running SM
		allDone := true
		for _, sm := range s.SMs {
			if sm.State == core.SMIdle {
				continue
			}
			if sm.State == core.SMDone {
				continue
			}

			allDone = false
			err := s.tickSM(sm, smResponses[sm.ID])
			if err != nil {
				return s.Cycle, fmt.Errorf("SM%d cycle %d: %w", sm.ID, s.Cycle, err)
			}
		}

		// Also check if unstarted blocks remain
		if !s.Dispatcher.AllDispatched() {
			allDone = false
		}

		// Check if any SM is still running
		for _, sm := range s.SMs {
			if sm.State == core.SMRunning {
				allDone = false
				break
			}
		}

		if allDone {
			return s.Cycle + 1, nil
		}
	}

	return MaxCycles, fmt.Errorf("simulation hit MaxCycles limit (%d) — possible infinite loop",
		MaxCycles)
}

// tickSM advances one SM by one cycle.
// It ticks every warp in the active block.
func (s *Sim) tickSM(sm *core.SM, responses []memory.Response) error {
	block := sm.ActiveBlock
	if block == nil {
		sm.State = core.SMIdle
		return nil
	}

	// Tag all in-flight memory requests with this SM's ID
	// so responses route back correctly (done at submission time below)

	blockDone := true
	for _, warp := range block.Warps {
		if warp.State == core.WarpDone {
			continue
		}
		blockDone = false

		err := s.tickWarp(sm, warp, block, responses)
		if err != nil {
			return err
		}
	}

	if blockDone {
		s.Tracer.Emit(trace.Event{
			Cycle:    s.Cycle,
			SMID:     sm.ID,
			WarpID:   -1,
			ThreadID: -1,
			Kind:     "BLOCK_DONE",
			Detail:   fmt.Sprintf("block %d complete", block.ID),
		})

		// Try to get next block from dispatcher
		sm.ActiveBlock = nil
		sm.State = core.SMIdle
	}

	return nil
}

// tickWarp advances one warp by one cycle.
// All threads in the warp that are active get ticked.
func (s *Sim) tickWarp(
	sm *core.SM,
	warp *core.Warp,
	block *core.Block,
	responses []memory.Response,
) error {

	sharedMem := memory.NewSharedMemory(block.SharedMemSz)
	// restore from block's shared memory slice
	copy(sharedMem.Data, block.SharedMem)

	// Filter responses for threads in this warp
	warpResponses := make([]memory.Response, 0)
	for _, resp := range responses {
		for _, t := range warp.Threads {
			if resp.ThreadID == t.ID {
				warpResponses = append(warpResponses, resp)
				break
			}
		}
	}

	// SYNC check: if all threads are in SyncWait, release them
	allAtSync := true
	for _, t := range warp.Threads {
		if !t.IsDone() && t.State != core.ThreadSyncWait {
			allAtSync = false
			break
		}
	}
	if allAtSync {
		for _, t := range warp.Threads {
			if t.State == core.ThreadSyncWait {
				t.State = core.ThreadFetch
				t.PC++ // advance past the SYNC instruction
			}
		}
		s.Tracer.Emit(trace.Event{
			Cycle:    s.Cycle,
			SMID:     sm.ID,
			WarpID:   warp.ID,
			ThreadID: -1,
			Kind:     "SYNC_RELEASE",
			Detail:   fmt.Sprintf("warp %d barrier released", warp.ID),
		})
	}

	// Tick each active thread
	memStall := false
	for i, t := range warp.Threads {
		if t.IsDone() {
			continue
		}
		// Only tick threads in the active mask
		if warp.ActiveMask&(1<<uint(i)) == 0 {
			continue
		}

		result := t.Tick(s.Config.Program, warpResponses, sharedMem)
		if result.Err != nil {
			return result.Err
		}

		// Emit trace event for this thread
		if result.Instr.Opcode != 0 || result.State != core.ThreadIdle {
			s.Tracer.Emit(trace.Event{
				Cycle:    s.Cycle,
				SMID:     sm.ID,
				WarpID:   warp.ID,
				ThreadID: t.ID,
				Kind:     result.State.String(),
				Detail:   fmt.Sprintf("pc=%-3d %s", result.PC, result.Disasm),
			})
		}

		// Submit memory requests to the global memory controller
		if result.MemRequest != nil {
			req := result.MemRequest
			req.WarpID = warp.ID
			req.SMID = sm.ID
			s.GlobalMem.Submit(req)

			s.Tracer.Emit(trace.Event{
				Cycle:    s.Cycle,
				SMID:     sm.ID,
				WarpID:   warp.ID,
				ThreadID: t.ID,
				Kind:     "MEM_REQ",
				Detail: fmt.Sprintf("pc=%-3d %s addr=0x%04X write=%v",
					result.PC, result.Disasm, result.MemRequest.Addr, result.MemRequest.IsWrite),
			})
		}

		if t.IsStalled() {
			memStall = true
		}
	}

	// Flush shared memory writes back to the block
	copy(block.SharedMem, sharedMem.Data)

	// Update warp state
	if warp.AllDone() {
		warp.State = core.WarpDone
		s.Tracer.Emit(trace.Event{
			Cycle:    s.Cycle,
			SMID:     sm.ID,
			WarpID:   warp.ID,
			ThreadID: -1,
			Kind:     "WARP_DONE",
			Detail:   fmt.Sprintf("warp %d retired", warp.ID),
		})
	} else if memStall {
		warp.State = core.WarpMemWait
	} else {
		warp.State = core.WarpRunning
	}

	return nil
}

func (s *Sim) Info() {
	total := s.Config.GridDim * s.Config.BlockDim
	warpsPerBlock := s.Config.BlockDim / WarpSize
	fmt.Println("╔══════════════════════════════════════════════╗")
	fmt.Println("║  NYX GPU Implementation                      ║")
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
