<div align="center">

<img src="web/public/logo.svg" width="72" height="72" alt="NYX Logo" />

# Project NYX

**A cycle-accurate GPU simulator and compiler pipeline, built from scratch in Go.**

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](./LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.22-blue.svg)](https://go.dev/)
[![Status](https://img.shields.io/badge/Status-Alpha-yellow.svg)]()

[**Live Playground →**](https://nyx.exprays.com/playground) · [**Engineering Blog →**](https://nyx.exprays.com/blog)

</div>

---

## What is NYX?

NYX is an open-source GPU implementation that models the internal architecture of a modern GPU — streaming multiprocessors (SMs), warp schedulers, SIMD execution lanes, shared and global memory — cycle by cycle, in pure Go.

It is both a learning project and a working implementation. Every design decision is documented in the [engineering blog](https://nyx.exprays.com/blog), where I walk through the architecture from first principles.

## Architecture

```
impl/nyx/
├── isa/         — Instruction Set Architecture (13 opcodes, 16 registers, NZP condition codes)
├── core/        — Simulator types: Thread, Warp, Block, SM, KernelConfig
├── memory/      — Global DRAM (64K words, 4-cycle latency) + Shared SRAM (0-cycle)
├── trace/       — Cycle-by-cycle terminal trace logger (4 verbosity levels)
├── sim/         — Top-level simulator bootstrap and validation
└── main.go      — Entry point kernel
```

### NYX ISA — 13 Instructions

| Category    | Instructions                          |
|-------------|---------------------------------------|
| Arithmetic  | `ADD`, `SUB`, `MUL`, `DIV`            |
| Comparison  | `CMP`, `BRnzp`                        |
| Memory      | `LDR`, `STR`, `LDSH`, `STSH`         |
| Immediate   | `CONST`                               |
| Control     | `SYNC`, `RET`                         |

### Hardware Parameters

| Parameter      | Value           |
|----------------|-----------------|
| System Clock   | 100 MHz         |
| SM Instances   | 4 cores         |
| Warp Size      | 32 threads      |
| Registers      | 16 / thread     |
| Shared SRAM    | 64 KB / block   |
| Global Memory  | 64K × int32     |
| Memory Latency | 4 cycles        |

## Getting Started

**Prerequisites:** Go 1.22+, Node.js 18+, Make

```bash
# Clone the repository
git clone https://github.com/exprays/nyx.git
cd nyx

# Install all dependencies (Go + Node)
make setup

# Run the Go simulator in the terminal
make run-impl

# Launch the interactive web playground (localhost:3000)
make run-web
```

## Commands

```bash
make setup       # Install all Go and Node dependencies
make run-impl     # Run the Go simulator in the terminal
make run-web     # Start the Next.js dev server at localhost:3000
make build       # Build the Go binary + Next.js production bundle
make build-wasm  # Compile the Go simulator to browser WebAssembly
make test        # Run Go backend test suite
make clean       # Remove build artifacts
```

## Curriculum

NYX is being built in public. Each part of the project corresponds to a chapter in the engineering blog:

| Chapter | Topic | Status |
|---------|-------|--------|
| [Chapter 0](https://nyx.exprays.com/blog/chapter-0) | Why CPUs and GPUs Are Fundamentally Different | ✅ Live |
| Chapter 1 | ISA Specification & Custom Go Assembler | 🚧 In development |
| Chapter 2 | Warp Scheduler & Thread Dispatch | ⬜ Planned |
| Chapter 3 | Memory Controller & Latency Simulation | ⬜ Planned |
| Chapter 4 | Branch Divergence & Active Mask | ⬜ Planned |
| Chapter 5 | Tracer & Telemetry Pipeline | ⬜ Planned |
| Chapter 6 | Full Kernel Launch API | ⬜ Planned |

## Web Playground

The interactive playground at [`/playground`](https://nyx.exprays.com/playground) runs a browser-sandboxed version of the NYX Implementation in GO-WASM. You can read the source files, edit the kernel configuration, and execute `make run-impl` directly in the browser shell — powered by WebAssembly.

## License

MIT License — see [LICENSE](./LICENSE) for details.

Copyright © 2026 Suryakant Subudhi
