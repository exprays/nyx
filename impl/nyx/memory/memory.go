// The actual memory. Global memory with simulated read/write latency

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
