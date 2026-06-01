import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Why CPUs and GPUs Are Fundamentally Different | Project NYX",
  description: "An architectural deep-dive into GPU throughput and CPU latency design principles, illustrating SIMD, warps, and memory scheduling.",
};

export default function ChapterZeroPage() {
  return (
    <div className="min-h-screen bg-cloud-white text-steel-gray font-mono flex flex-col select-none selection:bg-electric-blue selection:text-cloud-white overflow-x-hidden">
      
      {/* Top Banner (Flame Orange Banner consistent with home) */}
      <div className="w-full bg-flame-orange text-cloud-white text-[10px] sm:text-xs py-2.5 px-4 text-center font-bold tracking-tight border-b border-midnight-graphite font-mono">
        NYX ARCHITECTURE CURRICULUM CHAPTER 0 IS NOW LIVE.
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
        
        {/* Left Sidebar (Article Outline - Hidden on mobile/tablet) */}
        <aside className="hidden lg:block lg:col-span-3 border border-stone-gray p-4 bg-cloud-white sticky top-24">
          <div className="border-b border-steel-gray pb-2 mb-3">
            <h3 className="font-sans text-xs font-bold tracking-tight text-ash-black uppercase">
              Table of Contents
            </h3>
          </div>
          <ul className="flex flex-col gap-2.5 text-[11px] font-mono leading-normal text-flame-orange">
            <li>
              <a href="#problem-gpus-solve" className="hover:text-ash-black block transition-colors">
                01. The Problem GPUs Solve
              </a>
            </li>
            <li>
              <a href="#die-layout" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ CPU vs GPU die layout
              </a>
            </li>
            <li>
              <a href="#what-thread-means" className="hover:text-ash-black block transition-colors">
                02. Thread Hierarchy
              </a>
            </li>
            <li>
              <a href="#hierarchy-diagram" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ Thread / Block / Grid
              </a>
            </li>
            <li>
              <a href="#the-warp-simd" className="hover:text-ash-black block transition-colors">
                03. The Warp & SIMD Model
              </a>
            </li>
            <li>
              <a href="#warp-divergence" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ Warp divergence diagram
              </a>
            </li>
            <li>
              <a href="#nyx-architecture" className="hover:text-ash-black block transition-colors">
                04. NYX Architecture Overview
              </a>
            </li>
            <li>
              <a href="#block-diagram" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ Full architecture block diagram
              </a>
            </li>
            <li>
              <a href="#what-we-built" className="hover:text-ash-black block transition-colors">
                05. What I built in Part 0
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
                ARCHITECTURE CURRICULUM // CHAPTER 0
              </span>
            </div>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl md:text-4xl text-ash-black leading-tight uppercase tracking-tight">
              Why CPUs and GPUs Are Fundamentally Different
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-smoke-gray mt-2">
              <span>June 1, 2026</span>
              <span>•</span>
              <span>8 MIN READ</span>
              <span>•</span>
              <span>BY SURYAKANT SUBUDHI</span>
            </div>
          </div>

          {/* Section: The Problem */}
          <section id="problem-gpus-solve" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-8 mb-4">
              The problem GPUs were built to solve
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              A CPU is a generalist. It has a handful of powerful cores — modern ones have 8, 16, maybe 32 — each capable of executing completely independent instructions, handling branches, running an OS, doing I/O. Every core has deep out-of-order execution logic, branch predictors, large caches. A CPU core is fast and smart, but it takes up a lot of silicon.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              A GPU is a specialist. Instead of a few smart cores, it has thousands of simple ones. Each core is dumb — no branch prediction, no out-of-order execution, minimal caching. But there are so many of them that they can process massive datasets in parallel.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              The key insight: most graphics and ML workloads are embarrassingly parallel. Adding two matrices? Every element is independent. Rendering pixels? Each pixel can be computed separately. You don't need smart cores for that. You need thousands of simple ones all doing the same thing at once.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              This is the SIMD model: <strong className="text-electric-blue font-bold">Same Instruction, Multiple Data</strong>.
            </p>
          </section>

          {/* Illustration 1 Container */}
          <div id="die-layout" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img 
                src="/blog/image1-part0.png" 
                alt="CPU vs GPU die layout" 
                className="max-w-full h-auto select-none" 
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              CPU vs GPU die layout
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              <strong>Left (CPU)</strong>: 8 large squares labeled "CORE", each with sub-boxes labeled "Cache", "Branch Predictor", "OOO Engine". Most of the die area is cache. <strong>Right (GPU)</strong>: a grid of ~128 tiny squares, all identical, labeled "SM" (streaming multiprocessor). A thin strip at the top labeled "L2 Cache". A strip at the bottom labeled "Global Memory Controllers".
            </p>
            <span className="text-[11px] font-mono text-electric-blue font-bold mt-1 text-center italic">
              "A CPU optimizes for latency on a few tasks. A GPU optimizes for throughput on millions of tasks."
            </span>
          </div>

          {/* Section: What "thread" means */}
          <section id="what-thread-means" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              What "thread" means on a GPU
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              On a CPU, a thread is a heavyweight concept — its own stack, registers, OS context. Switching between threads is expensive.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              On a GPU, a thread is almost nothing. It's just a program counter and a small set of registers. Thousands of them exist simultaneously. Switching between groups of threads costs zero cycles — the hardware just picks the next ready group.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-2">
              GPU threads are organized in a three-level hierarchy:
            </p>
            <ul className="list-disc pl-6 mb-6 flex flex-col gap-2.5 font-mono text-xs sm:text-sm text-steel-gray leading-relaxed">
              <li>
                <strong className="text-ash-black">Thread</strong> — the atomic unit. Runs one sequence of instructions.
              </li>
              <li>
                <strong className="text-ash-black">Block</strong> — a group of threads that share fast on-chip memory (Shared SRAM) and can synchronize with each other.
              </li>
              <li>
                <strong className="text-ash-black">Grid</strong> — the full collection of blocks that make up a kernel launch.
              </li>
            </ul>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              When you launch a kernel (a GPU program), you say: <span className="text-flame-orange font-bold">"run this function on a grid of N blocks, each with M threads."</span> The GPU dispatcher assigns blocks to compute units (SMs) and everything runs in parallel.
            </p>
          </section>

          {/* Illustration 2 Container */}
          <div id="hierarchy-diagram" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img 
                src="/blog/image2-part0.png" 
                alt="Thread / Block / Grid hierarchy" 
                className="max-w-full h-auto select-none" 
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              Thread / Block / Grid hierarchy
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              Three nested boxes mapping the hierarchy. The outer box is the <strong>Grid</strong> containing a grid layout of blocks. Each block corresponds to block indices. Inside each block is a set of 32 threads, each with its own program counter (PC), virtual registers, and NZP status flags.
            </p>
          </div>

          {/* Section: The Warp */}
          <section id="the-warp-simd" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              The warp: why 32 threads move as one
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              GPUs don't execute threads one by one. They execute them in groups of 32 called <strong className="text-flame-orange font-bold">warps</strong>. All 32 threads in a warp execute the exact same instruction at the exact same time — they just operate on different data (different values in their registers).
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              This is where SIMD becomes real in hardware. The ALU is literally 32 lanes wide. One instruction dispatch fires all 32 lanes simultaneously.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              The cost of this model shows up at branches. If 16 threads in a warp evaluate <code className="bg-cloud-white border border-stone-gray px-1.5 py-0.5 text-electric-blue text-[11px]">if x &gt; 0</code> to true and 16 evaluate it to false, the warp can't split — it has to execute both branches sequentially, masking out the threads that shouldn't run each path. This is <strong className="text-ash-black">branch divergence</strong> and it's one of the main things GPU programmers optimize around.
            </p>
            <blockquote className="border-l-4 border-flame-orange bg-cloud-white p-4 my-6 font-mono text-xs sm:text-sm italic leading-relaxed text-steel-gray">
              NYX implements real warp execution with real divergence via an active mask — a 32-bit integer where each bit represents whether that thread is currently active.
            </blockquote>
          </section>

          {/* Illustration 3 Container */}
          <div id="warp-divergence" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img 
                src="/blog/image3-part0.png" 
                alt="Warp divergence" 
                className="max-w-full h-auto select-none" 
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              Warp divergence
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              Divergent execution path flow: the warp branches on condition. One set of active lanes executes instructions under one mask while other lanes stall, then execution swaps to the remaining lanes. Finally, lanes converge back to 100% mask.
            </p>
            <span className="text-[11px] font-mono text-flame-orange font-bold mt-1 text-center italic">
              "Divergent threads serialize. Convergent threads parallelize."
            </span>
          </div>

          {/* Section: NYX Architecture Overview */}
          <section id="nyx-architecture" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              NYX architecture overview
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              NYX is a cycle-accurate GPU implementation written in Go. Cycle-accurate means that every cycle, every component advances its state by exactly one step. Memory takes real cycles to respond. Warps stall when memory is pending. Branches cost real cycles.
            </p>

            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-2">
              Key building blocks modeled in Go:
            </p>
            <ul className="list-disc pl-6 mb-6 flex flex-col gap-2.5 font-mono text-xs sm:text-sm text-smoke-gray leading-relaxed">
              <li>
                <strong className="text-ash-black">NYX ISA</strong>: 13 instructions. Arithmetic (ADD/SUB/MUL/DIV), comparison (CMP + BRnzp), memory (LDR/STR/LDSH/STSH), immediate (CONST), and control (SYNC/RET).
              </li>
              <li>
                <strong className="text-ash-black">NYX assembler</strong>: <code className="bg-cloud-white border border-stone-gray px-1 py-0.5 text-flame-orange text-[11px]">.nyx</code> source files parsed and compiled directly to instruction structs. Written in Go in Part 1.
              </li>
              <li>
                <strong className="text-ash-black">NYX runtime</strong>: <code className="bg-cloud-white border border-stone-gray px-1 py-0.5 text-electric-blue text-[11px]">nyx.Launch(kernel, grid, block, mem)</code> API mimicking CUDA launch syntax. Built in Part 6.
              </li>
            </ul>
          </section>

          {/* Illustration 4 Container */}
          <div id="block-diagram" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img 
                src="/blog/image4-part0.png" 
                alt="NYX full architecture block diagram" 
                className="max-w-full h-auto select-none" 
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              NYX full architecture block diagram
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              Full CAD schematic diagram showing the Dispatcher mapping blocks down to 4 SMs containing warp schedulers, shared memory channels, thread groups, and L1 caches. Data flows down into the memory controller bus down into the Global DRAM memory chips.
            </p>
          </div>

          {/* Section: What I built in Part 0 */}
          <section id="what-we-built" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              What I built in Part 0
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              I completed wiring up the foundation of the GPU pipeline simulation:
            </p>
            <ul className="list-disc pl-6 mb-6 flex flex-col gap-2.5 font-mono text-xs sm:text-sm text-steel-gray leading-relaxed">
              <li>
                <code className="text-electric-blue font-bold">isa/isa.go</code> — defined 13 opcodes, 16 hardware registers, and NZP condition codes.
              </li>
              <li>
                <code className="text-electric-blue font-bold">core/types.go</code> — defined standard hardware objects: threads, warps, blocks, SMs, and KernelConfig.
              </li>
              <li>
                <code className="text-electric-blue font-bold">memory/memory.go</code> — simulated a global memory DRAM controller with bandwidth boundaries and 4-cycle latencies, alongside zero-cycle block shared SRAM.
              </li>
              <li>
                <code className="text-electric-blue font-bold">trace/trace.go</code> — designed a detailed cycle logger displaying threads state updates.
              </li>
              <li>
                <code className="text-electric-blue font-bold">sim/sim.go</code> — implemented bootstrap code validating parameters.
              </li>
              <li>
                <code className="text-electric-blue font-bold">main.go</code> — entry point testing basic arithmetic and RET.
              </li>
            </ul>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mt-6 border-t border-stone-gray pt-4">
              <strong className="text-midnight-graphite">Next up — Part 1</strong>: I design the binary instruction encoding bitfields and build the custom assembler compiler in Go translating text instructions into execute-ready byte streams. I'll assemble my first program and watch SMs schedule warps in parallel.
            </p>
          </section>

          <div className="border-t border-stone-gray pt-6 mt-8 flex justify-between items-center">
            <Link href="/blog" className="text-xs font-bold font-mono text-electric-blue hover:underline">
              ← BACK TO BLOG INDEX
            </Link>
            <Link href="/playground" className="text-xs font-bold font-mono bg-midnight-graphite text-white px-4 py-2 hover:bg-opacity-95">
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
