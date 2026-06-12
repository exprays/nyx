package trace

import (
	"fmt"
	"strings"
	"time"
)

// ANSI color codes
const (
	colorReset  = "\033[0m"
	colorGray   = "\033[90m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorRed    = "\033[31m"
	colorCyan   = "\033[36m"
	colorBlue   = "\033[34m"
	colorBold   = "\033[1m"
)

type Level int

const (
	LevelSilent Level = iota
	LevelSummary
	LevelWarp
	LevelThread
)

type Event struct {
	Cycle    int
	SMID     int
	WarpID   int
	ThreadID int
	Kind     string
	Detail   string
}

type Tracer struct {
	Level     Level
	Events    []Event
	StartTime time.Time
}

func NewTracer(level Level) *Tracer {
	return &Tracer{
		Level:     level,
		Events:    make([]Event, 0, 4096),
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
	color := kindColor(e.Kind)

	switch t.Level {
	case LevelSummary:
		// Only block and warp-level events
		if e.Kind == "BLOCK_DONE" || e.Kind == "WARP_DONE" || e.Kind == "SYNC_RELEASE" {
			fmt.Printf("%s[%04d]%s SM%d W%02d  %s%-12s%s %s\n",
				colorGray, e.Cycle, colorReset,
				e.SMID, e.WarpID,
				color, e.Kind, colorReset,
				e.Detail)
		}

	case LevelWarp:
		if e.ThreadID < 0 {
			fmt.Printf("%s[%04d]%s SM%d W%02d        %s%-12s%s %s\n",
				colorGray, e.Cycle, colorReset,
				e.SMID, e.WarpID,
				color, e.Kind, colorReset,
				e.Detail)
		}

	case LevelThread:
		if e.ThreadID >= 0 {
			fmt.Printf("%s[%04d]%s SM%d W%02d T%03d  %s%-12s%s %s\n",
				colorGray, e.Cycle, colorReset,
				e.SMID, e.WarpID, e.ThreadID,
				color, e.Kind, colorReset,
				e.Detail)
		} else {
			fmt.Printf("%s[%04d]%s SM%d W%02d        %s%-12s%s %s\n",
				colorGray, e.Cycle, colorReset,
				e.SMID, e.WarpID,
				color, e.Kind, colorReset,
				e.Detail)
		}
	}
}

func kindColor(kind string) string {
	switch kind {
	case "FETCH":
		return colorGray
	case "DECODE":
		return colorBlue
	case "EXECUTE":
		return colorGreen
	case "MEM_REQ":
		return colorYellow
	case "MEM_WAIT":
		return colorYellow
	case "WARP_DONE", "BLOCK_DONE":
		return colorCyan
	case "SYNC_RELEASE":
		return colorCyan
	case "RET", "DONE":
		return colorRed
	default:
		return colorReset
	}
}

func (t *Tracer) CycleBanner(cycle int) {
	if t.Level >= LevelWarp {
		fmt.Printf("\n%s%s CYCLE %04d %s%s\n",
			colorBold+colorGray,
			strings.Repeat("─", 18),
			cycle,
			strings.Repeat("─", 18),
			colorReset)
	}
}

func (t *Tracer) Summary(totalCycles int, globalMem []int32, showMemRange [2]int) {
	elapsed := time.Since(t.StartTime)

	fmt.Printf("\n%s%s%s\n", colorBold, strings.Repeat("═", 52), colorReset)
	fmt.Printf("%s  NYX SIMULATION COMPLETE%s\n", colorBold, colorReset)
	fmt.Printf("%s%s%s\n", colorBold, strings.Repeat("═", 52), colorReset)
	fmt.Printf("  Total cycles   : %s%d%s\n", colorGreen, totalCycles, colorReset)
	fmt.Printf("  Total events   : %d\n", len(t.Events))
	fmt.Printf("  Wall time      : %s\n", elapsed.Round(time.Millisecond))
	fmt.Println(strings.Repeat("─", 52))

	start := showMemRange[0]
	end := showMemRange[1]
	if end > len(globalMem) {
		end = len(globalMem)
	}
	fmt.Printf("  Global mem [%d..%d]:\n", start, end-1)
	for i := start; i < end; i++ {
		fmt.Printf("    %s[%03d]%s = %s%d%s\n",
			colorGray, i, colorReset,
			colorGreen, globalMem[i], colorReset)
	}
	fmt.Printf("%s%s%s\n", colorBold, strings.Repeat("═", 52), colorReset)
}
