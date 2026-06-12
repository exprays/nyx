import React from "react";
import Link from "next/link";
import { LikeCounter } from "../../components/LikeCounter";

export const metadata = {
  title: "Designing an Instruction Set from Scratch | Project NYX",
  description: "An architectural walkthrough of designing a custom 32-bit GPU ISA, parsing it with a two-pass assembler in Go, and modeling SIMD execution lanes.",
};

export default function ChapterOnePage() {
  return (
    <div className="min-h-screen bg-cloud-white text-steel-gray font-mono flex flex-col select-none selection:bg-electric-blue selection:text-cloud-white overflow-x-hidden">

      {/* Top Banner (Flame Orange Banner consistent with home) */}
      <div className="w-full bg-flame-orange text-cloud-white text-[10px] sm:text-xs py-2.5 px-4 text-center font-bold tracking-tight border-b border-midnight-graphite font-mono">
        NYX ARCHITECTURE CURRICULUM CHAPTER 1 IS NOW LIVE.
      </div>

      {/* Navigation Header */}
      <header className="w-full bg-cloud-white border-b border-stone-gray sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">

          {/* Logo brand */}
          <div className="flex items-center gap-2 sm:gap-3 whitespace-nowrap">
            <Link href="/" className="font-sans font-bold text-base sm:text-lg md:text-xl text-ash-black hover:text-electric-blue transition-colors tracking-tighter flex items-center gap-2">
              <img src="/logo.svg" alt="NYX Logo" className="h-5 w-5 select-none" />
              <span>Project NYX</span>
            </Link>
            <span className="text-[10px] border border-stone-gray px-2 py-0.5 text-smoke-gray select-none hidden sm:inline-block">
              CURRICULUM
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <Link
              href="/playground"
              className="text-steel-gray hover:text-flame-orange transition-colors py-1.5 font-sans"
            >
              PLAYGROUND
            </Link>
            <Link
              href="/blog"
              className="text-flame-orange hover:text-midnight-graphite transition-colors py-1.5 font-sans font-bold"
            >
              BLOG
            </Link>
            <Link
              href="/#changelog-section"
              className="text-steel-gray hover:text-electric-blue transition-colors py-1.5 font-sans"
            >
              CHANGELOG
            </Link>
            <a
              href="https://github.com/exprays/nyx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-steel-gray hover:text-electric-blue transition-colors py-1.5 font-sans"
            >
              GITHUB
            </a>
          </nav>

          <div className="whitespace-nowrap">
            <Link href="/playground" className="bg-flame-orange text-cloud-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-2 hover:bg-opacity-90 cursor-pointer border-0 transition-opacity font-mono inline-block">
              <span className="hidden sm:inline">LAUNCH PLAYGROUND</span>
              <span className="sm:hidden">PLAYGROUND</span>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Sidebar (Article Outline) */}
        <aside className="hidden lg:block lg:col-span-3 border border-stone-gray p-4 bg-cloud-white sticky top-24">
          <div className="border-b border-steel-gray pb-2 mb-3">
            <h3 className="font-sans text-xs font-bold tracking-tight text-ash-black uppercase">
              Table of Contents
            </h3>
          </div>
          <ul className="flex flex-col gap-2.5 text-[11px] font-mono leading-normal text-flame-orange">
            <li>
              <a href="#what-isa-is" className="hover:text-ash-black block transition-colors">
                01. What an ISA Actually Is
              </a>
            </li>
            <li>
              <a href="#three-layers" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ The Three Layers diagram
              </a>
            </li>
            <li>
              <a href="#designing-nyx-isa" className="hover:text-ash-black block transition-colors">
                02. Designing the NYX ISA
              </a>
            </li>
            <li>
              <a href="#full-isa-table" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ Full ISA Table
              </a>
            </li>
            <li>
              <a href="#instruction-encoding" className="hover:text-ash-black block transition-colors">
                03. Fitting into 32 Bits
              </a>
            </li>
            <li>
              <a href="#brnzp-encoding" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ BRnzp offset walkthrough
              </a>
            </li>
            <li>
              <a href="#how-assembler-works" className="hover:text-ash-black block transition-colors">
                04. How the Assembler Works
              </a>
            </li>
            <li>
              <a href="#assembler-flow" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ Two-pass assembler flow
              </a>
            </li>
            <li>
              <a href="#register-file" className="hover:text-ash-black block transition-colors">
                05. The Register File
              </a>
            </li>
            <li>
              <a href="#simd-divergence" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ SIMD register divergence
              </a>
            </li>
            <li>
              <a href="#what-we-built" className="hover:text-ash-black block transition-colors">
                06. What We Built
              </a>
            </li>
          </ul>
        </aside>

        {/* Central Article Column */}
        <article className="col-span-1 lg:col-span-9 bg-white border border-stone-gray p-6 sm:p-10 md:p-12 shadow-sm">

          {/* Article Header Meta */}
          <div className="border-b border-stone-gray pb-6 mb-8 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Link href="/blog" className="text-[10px] md:text-xs font-mono font-bold text-smoke-gray hover:text-electric-blue transition-colors">
                ← BACK TO BLOG
              </Link>
              <span className="text-stone-gray text-[10px] md:text-xs">|</span>
              <span className="text-[10px] md:text-xs font-mono font-bold text-electric-blue uppercase tracking-wider">
                ARCHITECTURE CURRICULUM // CHAPTER 1
              </span>
            </div>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl md:text-4xl text-ash-black leading-tight uppercase tracking-tight">
              Designing an Instruction Set from Scratch
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-smoke-gray mt-2">
              <span>June 3, 2026</span>
              <span>•</span>
              <span>6 MIN READ</span>
              <span>•</span>
              <span>BY SURYAKANT SUBUDHI</span>
            </div>
          </div>

          <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
            I want to tell you about the moment this project clicked for me.
          </p>

          <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
            I was staring at a CPU architecture diagram — the kind with arrows going everywhere between the ALU and the register file and the control unit — and I realized I had no idea what the actual numbers flowing through those arrows looked like. Like, a CPU fetches an "instruction" from memory. But what is an instruction? What does it actually look like as bits?
          </p>

          <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
            That question is what an ISA answers.
          </p>

          {/* Section 1: What an ISA actually is */}
          <section id="what-isa-is" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-8 mb-4">
              What an ISA actually is
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              ISA stands for <strong className="text-flame-orange font-bold">Instruction Set Architecture</strong>. It's the contract between the hardware and the software. The hardware promises: "if you give me bits arranged like this, I will do that." The software (your compiler, your assembler) holds up its end by producing bits in exactly that format.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              x86 has one ISA. ARM has another. They're incompatible because the contracts are different — the same bits mean different things on each.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              For NYX I needed to design my own. That meant answering three questions:
            </p>
            <ol className="list-decimal pl-6 mb-6 flex flex-col gap-2.5 font-mono text-xs sm:text-sm text-steel-gray leading-relaxed">
              <li>What operations does the GPU need to support?</li>
              <li>How do we encode each operation as a fixed-width binary number?</li>
              <li>How do we write those operations as human-readable text?</li>
            </ol>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              The answers to those three questions are: the ISA, the encoding, and the assembly language.
            </p>
          </section>

          {/* Illustration 1 Container */}
          <div id="three-layers" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img
                src="/blog/image1-part1.png"
                alt="The three layers of NYX hardware translation"
                className="max-w-full h-auto select-none"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              The Three Layers of Translation
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              <strong className="text-flame-orange font-bold">Assembly (.nyx file)</strong> (e.g. <code>ADD R0, R1, R2</code>) compiles through the <strong className="text-flame-orange font-bold">assembler</strong> into the <strong className="text-flame-orange font-bold">ISA encoding contract</strong> (32-bit raw fields), which in turn feeds the <strong className="text-flame-orange font-bold">decoder</strong> on the <strong className="text-flame-orange font-bold">Hardware (NYX implementation)</strong> ALU.
            </p>
          </div>

          {/* Section 2: Designing the NYX instruction set */}
          <section id="designing-nyx-isa" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              Designing the NYX instruction set
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              I kept it to 13 instructions. That sounds tiny but it's enough to run matrix multiplication, vector addition, and eventually a rasterizer. Here's the reasoning behind each group:
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <strong className="text-flame-orange font-bold">Arithmetic — ADD, SUB, MUL, DIV</strong><br />
              Every compute kernel needs math. These operate on two source registers and write to a destination. Classic three-register format.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <strong className="text-flame-orange font-bold">Comparison and branching — CMP, BRN/BRZ/BRP/BRNZ...</strong><br />
              You need loops. A loop needs a counter check. CMP subtracts two registers and stores whether the result was negative, zero, or positive in a special register called NZP. Then a branch instruction reads NZP and jumps if the condition matches. This is how <code>{`while k < N`}</code> becomes hardware.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <strong className="text-flame-orange font-bold">Memory — LDR, STR, LDSH, STSH</strong><br />
              LDR loads a value from global memory into a register. STR stores it back. LDSH and STSH do the same for shared memory — the fast on-chip memory that threads in the same block can use to communicate.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <strong className="text-flame-orange font-bold">Immediate — CONST</strong><br />
              You need to get constant values into registers somehow. CONST loads a literal number directly.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              <strong className="text-flame-orange font-bold">Control — SYNC, RET</strong><br />
              SYNC is a barrier — all threads in a block must reach it before any can pass. RET signals that a thread is done.
            </p>
          </section>

          {/* Illustration 2 Container (ISA Table) */}
          <div id="full-isa-table" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden mb-4">
              <img
                src="/blog/image2-part1.png"
                alt="Full ISA Table Layout"
                className="max-w-full h-auto select-none"
              />
            </div>
            
            <div className="w-full overflow-x-auto">
              <table className="w-full border border-stone-gray text-[11px] sm:text-xs font-mono text-steel-gray border-collapse mb-2 bg-white">
                <thead>
                  <tr className="bg-cloud-white border-b border-stone-gray text-midnight-graphite font-bold">
                    <th className="p-2 border-r border-stone-gray text-left">Opcode (hex)</th>
                    <th className="p-2 border-r border-stone-gray text-left">Mnemonic</th>
                    <th className="p-2 border-r border-stone-gray text-left">Operands</th>
                    <th className="p-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-stone-gray">
                    <td className="p-2 border-r border-stone-gray">0x0</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-electric-blue">ADD</td>
                    <td className="p-2 border-r border-stone-gray">Rd, Rs1, Rs2</td>
                    <td className="p-2">Rd = Rs1 + Rs2</td>
                  </tr>
                  <tr className="border-b border-stone-gray">
                    <td className="p-2 border-r border-stone-gray">0x1</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-electric-blue">SUB</td>
                    <td className="p-2 border-r border-stone-gray">Rd, Rs1, Rs2</td>
                    <td className="p-2">Rd = Rs1 - Rs2</td>
                  </tr>
                  <tr className="border-b border-stone-gray">
                    <td className="p-2 border-r border-stone-gray">0x2</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-electric-blue">MUL</td>
                    <td className="p-2 border-r border-stone-gray">Rd, Rs1, Rs2</td>
                    <td className="p-2">Rd = Rs1 * Rs2</td>
                  </tr>
                  <tr className="border-b border-stone-gray">
                    <td className="p-2 border-r border-stone-gray">0x3</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-electric-blue">DIV</td>
                    <td className="p-2 border-r border-stone-gray">Rd, Rs1, Rs2</td>
                    <td className="p-2">Rd = Rs1 / Rs2</td>
                  </tr>
                  <tr className="border-b border-stone-gray">
                    <td className="p-2 border-r border-stone-gray">0x4</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-flame-orange">CMP</td>
                    <td className="p-2 border-r border-stone-gray">Rs1, Rs2</td>
                    <td className="p-2">NZP ← sign(Rs1 - Rs2)</td>
                  </tr>
                  <tr className="border-b border-stone-gray bg-amber-50/50">
                    <td className="p-2 border-r border-stone-gray">0x5</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-flame-orange">BRnzp</td>
                    <td className="p-2 border-r border-stone-gray">mask, offset</td>
                    <td className="p-2">branch if NZP matches mask (N=4, Z=2, P=1)</td>
                  </tr>
                  <tr className="border-b border-stone-gray">
                    <td className="p-2 border-r border-stone-gray">0x6</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-electric-blue">LDR</td>
                    <td className="p-2 border-r border-stone-gray">Rd, Rs</td>
                    <td className="p-2">Rd = GlobalMem[Rs]</td>
                  </tr>
                  <tr className="border-b border-stone-gray">
                    <td className="p-2 border-r border-stone-gray">0x7</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-electric-blue">STR</td>
                    <td className="p-2 border-r border-stone-gray">Rs1, Rs2</td>
                    <td className="p-2">GlobalMem[Rs1] = Rs2</td>
                  </tr>
                  <tr className="border-b border-stone-gray">
                    <td className="p-2 border-r border-stone-gray">0x8</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-electric-blue">LDSH</td>
                    <td className="p-2 border-r border-stone-gray">Rd, #offset</td>
                    <td className="p-2">Rd = SharedMem[offset]</td>
                  </tr>
                  <tr className="border-b border-stone-gray">
                    <td className="p-2 border-r border-stone-gray">0x9</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-electric-blue">STSH</td>
                    <td className="p-2 border-r border-stone-gray">#offset, Rs</td>
                    <td className="p-2">SharedMem[offset] = Rs</td>
                  </tr>
                  <tr className="border-b border-stone-gray">
                    <td className="p-2 border-r border-stone-gray">0xA</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-electric-blue">CONST</td>
                    <td className="p-2 border-r border-stone-gray">Rd, #imm</td>
                    <td className="p-2">Rd = imm (16-bit signed)</td>
                  </tr>
                  <tr className="border-b border-stone-gray">
                    <td className="p-2 border-r border-stone-gray">0xB</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-ash-black">SYNC</td>
                    <td className="p-2 border-r border-stone-gray">—</td>
                    <td className="p-2">thread block barrier</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-stone-gray">0xC</td>
                    <td className="p-2 border-r border-stone-gray font-bold text-ash-black">RET</td>
                    <td className="p-2 border-r border-stone-gray">—</td>
                    <td className="p-2">thread done</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-2 text-center">
              Full NYX ISA Table Mappings
            </span>
          </div>

          {/* Section 3: Encoding: fitting an instruction into 32 bits */}
          <section id="instruction-encoding" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              Encoding: fitting an instruction into 32 bits
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              Every NYX instruction is exactly 32 bits wide. Fixed width makes the decoder simple — no variable-length parsing, no prefix bytes, no ambiguity. You grab 32 bits from program memory and you know exactly where every field is.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              The layout for most instructions:
            </p>
            <pre className="bg-cloud-white border border-stone-gray p-3 my-4 overflow-x-auto text-[10px] sm:text-xs font-mono text-steel-gray leading-tight select-text">
{`31      28 27    24 23    20 19    16 15              0
┌────────┬────────┬────────┬────────┬────────────────┐
│ opcode │   Rd   │  Rs1   │  Rs2   │   (unused)     │
│ 4 bits │ 4 bits │ 4 bits │ 4 bits │   16 bits      │
└────────┴────────┴────────┴────────┴────────────────┘`}
            </pre>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              For CONST, the lower 16 bits become the immediate value:
            </p>
            <pre className="bg-cloud-white border border-stone-gray p-3 my-4 overflow-x-auto text-[10px] sm:text-xs font-mono text-steel-gray leading-tight select-text">
{`31      28 27    24 23                               0
┌────────┬────────┬──────────────────────────────────┐
│ opcode │   Rd   │         imm16 (signed)           │
│ 4 bits │ 4 bits │         16 bits                  │
└────────┴────────┴──────────────────────────────────┘`}
            </pre>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              For BRnzp, bits [15:13] hold the condition mask and bits [12:0] hold the PC-relative offset:
            </p>
            <pre className="bg-cloud-white border border-stone-gray p-3 my-4 overflow-x-auto text-[10px] sm:text-xs font-mono text-steel-gray leading-tight select-text">
{`31      28 27    16 15  13 12                       0
┌────────┬─────────┬──────┬──────────────────────────┐
│ opcode │ unused  │ NZP  │   offset13 (signed)      │
│ 4 bits │         │3 bits│   13 bits                │
└────────┴─────────┴────── lock ─────────────────────┘`}
            </pre>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              The offset in BRnzp is PC-relative, meaning it's the distance from the <em>next</em> instruction, not from address zero. So <code>BRN LOOP</code> when LOOP is 5 instructions back becomes <code>BRN #-6</code> (back 6 from the instruction after the branch). The assembler calculates this automatically in its second pass.
            </p>
          </section>

          {/* Illustration 3 Container */}
          <div id="brnzp-encoding" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img
                src="/blog/image3-part1.png"
                alt="BRnzp encoding walkthrough diagram"
                className="max-w-full h-auto select-none"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              BRnzp Offset Calculation Walkthrough
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              When the PC is at 21, a branch to <code>LOOP</code> (PC=11) requires jumping back. Since offsets are relative to the instruction after the branch (PC=22), the target offset is <code>11 - 22 = -11</code>. The diagram shows the 32-bit layout filled with Opcode (0x5), NZP (100 for Negative), and sign-extended immediate (-11).
            </p>
          </div>

          {/* Section 4: How the assembler works */}
          <section id="how-assembler-works" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              How the assembler works
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              The assembler has two passes over the source text.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <strong className="text-flame-orange font-bold">Pass 1</strong> — Read every line. When you see a label like <code>LOOP:</code>, record which instruction index it points to. When you see a branch to a label like <code>BRN LOOP</code>, emit the instruction with a placeholder offset and put it on a todo list.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              <strong className="text-flame-orange font-bold">Pass 2</strong> — Go through the todo list. For each pending branch, look up the label's instruction index, calculate the PC-relative offset, and fill it in.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              Everything else is just text parsing — split on commas and spaces, recognize register names, strip comments after semicolons.
            </p>
          </section>

          {/* Illustration 4 Container */}
          <div id="assembler-flow" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img
                src="/blog/image4-part1.png"
                alt="Two-pass assembler flow diagram"
                className="max-w-full h-auto select-none"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              Two-Pass Assembler Flowchart
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              <strong className="text-flame-orange font-bold">Pass 1</strong> logs instruction indices, saves label definitions, and records pending branches. <strong className="text-flame-orange font-bold">Pass 2</strong> iterates over these pending branches, calculates offsets relative to PC, and replaces the placeholders with real offsets.
            </p>
          </div>

          {/* Section 5: The register file */}
          <section id="register-file" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              The register file
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              NYX threads have 16 registers each. R0 through R12 are general purpose — read and write freely. R13, R14, and R15 are special:
            </p>
            <ul className="list-disc pl-6 mb-6 flex flex-col gap-2.5 font-mono text-xs sm:text-sm text-steel-gray leading-relaxed">
              <li><code>%threadIdx</code> (R13) — which thread this is within its block (0–31)</li>
              <li><code>%blockIdx</code> (R14) — which block this thread belongs to</li>
              <li><code>%blockDim</code> (R15) — how many threads are in the block</li>
            </ul>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              These three are injected by the runtime when a thread is created and are read-only. They're how SIMD works in practice. Every thread runs the exact same instruction. But because each thread has a different <code>%threadIdx</code>, they operate on different data:
            </p>
            <pre className="bg-cloud-white border border-stone-gray p-3 my-4 overflow-x-auto text-[10px] sm:text-xs font-mono text-electric-blue leading-normal select-text">
{`MUL  R0, %blockIdx, %blockDim
ADD  R0, R0, %threadIdx    ; R0 = unique global thread id
ADD  R4, R1, R0            ; R4 = baseA + thread_id  ← different for every thread
LDR  R4, R4                ; load A[thread_id]       ← different memory address`}
            </pre>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              <strong className="text-flame-orange font-bold">Same instructions. Different data.</strong> That's the whole trick.
            </p>
          </section>

          {/* Illustration 5 Container */}
          <div id="simd-divergence" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img
                src="/blog/image5-part1.png"
                alt="SIMD register divergence diagram"
                className="max-w-full h-auto select-none"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              SIMD Register Divergence
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              Visual representation of four concurrent threads. While executing identical instructions like <code>ADD R4, R1, R0</code>, the unique values stored in <code>%threadIdx</code> split the final calculations (R4 = 0, 1, 2, 3) to process distinct memory bounds in parallel.
            </p>
          </div>

          {/* Section 6: What we built */}
          <section id="what-we-built" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              What we built
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              The NYX assembler takes <code>.nyx</code> source files and emits a list of <code>isa.Instruction</code> structs. It handles:
            </p>
            <ul className="list-disc pl-6 mb-6 flex flex-col gap-2.5 font-mono text-xs sm:text-sm text-steel-gray leading-relaxed">
              <li>All 13 opcodes</li>
              <li>Two-pass label resolution for loops and branches</li>
              <li>PC-relative offset calculation</li>
              <li>Special register names (%threadIdx, %blockIdx, %blockDim)</li>
              <li>Signed immediate encoding with sign extension on decode</li>
              <li>Round-trip verification: encode → decode → encode must produce identical bits</li>
            </ul>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              Running <code>make run-impl</code> (or <code>go run main.go</code> inside the <code>impl/nyx</code> directory) now shows both kernels fully disassembled with their hex encodings, and confirms every instruction survives the encode/decode round trip.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mt-6 border-t border-stone-gray pt-4">
              <strong className="text-midnight-graphite">Next up — </strong>
              <Link href="/blog/chapter-2" className="text-electric-blue hover:underline font-bold">
                Chapter 2: The Thread Execution Engine
              </Link>
              {". We build the actual thread execution engine. Each thread gets a real state machine: FETCH → DECODE → EXECUTE → UPDATE. We'll run a single warp of 32 threads through the vecadd kernel and watch every instruction fire in the terminal trace."}
            </p>
          </section>

          <LikeCounter slug="chapter-1" />

          <div className="border-t border-stone-gray pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link href="/blog" className="text-xs font-bold font-mono text-electric-blue hover:underline whitespace-nowrap">
              ← BACK TO BLOG INDEX
            </Link>
            <Link href="/blog/chapter-2" className="text-xs font-bold font-mono bg-flame-orange text-white px-4 py-2 hover:bg-opacity-95 whitespace-nowrap text-center">
              READ CHAPTER 2 →
            </Link>
            <Link href="/playground" className="text-xs font-bold font-mono bg-midnight-graphite text-white px-4 py-2 hover:bg-opacity-95 whitespace-nowrap text-center">
              TRY PLAYGROUND →
            </Link>
          </div>

        </article>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-gray pt-6 mt-12 pb-8 text-center text-xs font-mono text-smoke-gray flex flex-col md:flex-row justify-between gap-4 max-w-[1280px] mx-auto px-6 bg-cloud-white">
        <span>NYX GPU IMPLEMENTATION // AN OPEN SOURCE HARDWARE RESEARCH STUDY</span>
        <span>COPYRIGHT © 2026 SURYAKANT SUBUDHI. ALL SPECIFICATIONS ARE OPEN SOURCE.</span>
      </footer>

    </div>
  );
}
