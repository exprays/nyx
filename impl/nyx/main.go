package main

import (
	"fmt"
	"os"

	"github.com/exprays/nyx/asm"
	"github.com/exprays/nyx/isa"
)

const vecaddSrc = `
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
`

const matmulSrc = `
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
`

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
		fmt.Fprintf(os.Stderr, "assemble %s: %v\n", name, err)
		os.Exit(1)
	}

	fmt.Printf("\n── %s (%d instructions) ──\n", name, len(kernel.Instructions))

	// Print labels map
	if len(kernel.Labels) > 0 {
		fmt.Println("  Labels:")
		for label, idx := range kernel.Labels {
			fmt.Printf("    %-12s → pc=%d\n", label, idx)
		}
	}

	// Print disassembly with encoding
	fmt.Printf("\n  %-4s  %-10s  %-30s  %s\n", "PC", "HEX", "DISASM", "SOURCE")
	fmt.Println("  " + "─────────────────────────────────────────────────────────")
	for i, instr := range kernel.Instructions {
		encoded, err := isa.Encode(instr)
		if err != nil {
			fmt.Fprintf(os.Stderr, "encode error at pc=%d: %v\n", i, err)
			os.Exit(1)
		}

		srcLine := ""
		if i < len(kernel.SourceLines) {
			srcLine = kernel.SourceLines[i]
		}

		disasm := isa.Disassemble(instr)
		fmt.Printf("  %-4d  0x%08X  %-30s  ; %s\n",
			i, encoded, disasm, srcLine)
	}

	// Verify round-trip: encode → decode → re-encode must match
	fmt.Println("\n  Round-trip check (encode → decode → encode):")
	allOk := true
	for i, instr := range kernel.Instructions {
		enc1, _ := isa.Encode(instr)
		dec, err := isa.Decode(enc1)
		if err != nil {
			fmt.Printf("    pc=%d DECODE ERROR: %v\n", i, err)
			allOk = false
			continue
		}
		enc2, _ := isa.Encode(dec)
		if enc1 != enc2 {
			fmt.Printf("    pc=%d MISMATCH: 0x%08X → 0x%08X\n", i, enc1, enc2)
			allOk = false
		}
	}
	if allOk {
		fmt.Println("  ✓ all instructions encode/decode correctly")
	}
}
