// Nyx tracer
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
