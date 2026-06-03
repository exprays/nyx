// Package isa provides the instruction set architecture (ISA) definitions and utilities for the Nyx GPU simulator.
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
