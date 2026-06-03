//A working single-pass assembler with a label resolution pass. Takes .nyx source text and emits []isa.Instruction.

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
	raw := strings.Split(a.source, "\n")
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
