import React from "react";
import Link from "next/link";
import { LikeCounter } from "../../components/LikeCounter";

export const metadata = {
  title: "The Thread Execution Engine | Project NYX",
  description: "Building a cycle-accurate GPU thread state machine, register file architecture, special registers, and block dispatching in Go.",
};

export default function ChapterTwoPage() {
  return (
    <div className="min-h-screen bg-cloud-white text-steel-gray font-mono flex flex-col select-none selection:bg-electric-blue selection:text-cloud-white overflow-x-hidden">

      {/* Top Banner (Flame Orange Banner consistent with home) */}
      <div className="w-full bg-flame-orange text-cloud-white text-[10px] sm:text-xs py-2.5 px-4 text-center font-bold tracking-tight border-b border-midnight-graphite font-mono">
        NYX ARCHITECTURE CURRICULUM CHAPTER 2 IS NOW LIVE.
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
              <a href="#what-thread-does" className="hover:text-ash-black block transition-colors">
                01. What a Thread Actually Does
              </a>
            </li>
            <li>
              <a href="#thread-state-machine" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ Thread State Machine
              </a>
            </li>
            <li>
              <a href="#registers-and-special" className="hover:text-ash-black block transition-colors">
                02. The Register File
              </a>
            </li>
            <li>
              <a href="#thread-birth" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ Special Register Injection
              </a>
            </li>
            <li>
              <a href="#memory-expensive" className="hover:text-ash-black block transition-colors">
                03. Memory: The Expensive Part
              </a>
            </li>
            <li>
              <a href="#vecadd-timeline" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ Timeline of one Thread
              </a>
            </li>
            <li>
              <a href="#dispatcher-blocks" className="hover:text-ash-black block transition-colors">
                04. The Dispatcher and Blocks
              </a>
            </li>
            <li>
              <a href="#dispatcher-assigning" className="hover:text-ash-black block pl-3 transition-colors">
                ↪ Dispatcher block queue
              </a>
            </li>
            <li>
              <a href="#watching-it-run" className="hover:text-ash-black block transition-colors">
                05. Watching It Run
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
                ARCHITECTURE CURRICULUM // CHAPTER 2
              </span>
            </div>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl md:text-4xl text-ash-black leading-tight uppercase tracking-tight">
              The Thread Execution Engine
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-smoke-gray mt-2">
              <span>June 12, 2026</span>
              <span>•</span>
              <span>7 MIN READ</span>
              <span>•</span>
              <span>BY SURYAKANT SUBUDHI</span>
            </div>
          </div>

          <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
            Here's the thing about GPUs that took me a while to really internalize.
          </p>

          <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
            A CPU core is a Swiss Army knife. It handles branches, exceptions, virtual memory, OS calls, I/O — all of it. When you look at a modern Intel or ARM core in a block diagram, the majority of the silicon isn't even the ALU. It's the stuff around the ALU: the branch predictor, the reorder buffer, the load-store unit, the TLB. All that complexity exists to make a single thread run as fast as possible.
          </p>

          <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
            A GPU thread is the opposite. It's almost nothing. Just a program counter, a handful of registers, and a direct line to an ALU. No branch prediction. No out-of-order execution. No OS context. The thread is dumb by design, because the GPU is betting that raw parallelism will outperform raw smarts.
          </p>

          <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
            That simplicity is what makes it interesting to build.
          </p>

          {/* Section 1: What a thread actually does */}
          <section id="what-thread-does" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-8 mb-4">
              What a thread actually does
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              A thread's life is a state machine. It cycles through stages, one per clock cycle, until it hits RET and retires. In NYX there are seven states:
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <strong className="text-flame-orange font-bold">FETCH</strong> — Read the instruction at the current program counter. In a real GPU this hits the instruction cache. In NYX we'll model the cache properly in Part 6; for now the fetch is instant.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <strong className="text-flame-orange font-bold">DECODE</strong> — Figure out what the instruction means. Routes the thread to EXECUTE for arithmetic, or MEM_REQ for loads and stores.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <strong className="text-flame-orange font-bold">EXECUTE</strong> — Do the actual computation. ADD, SUB, MUL, DIV all happen here. So do CONST, CMP, and BRnzp. This takes one cycle.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <strong className="text-flame-orange font-bold">MEM_REQ</strong> — Issue a request to global memory. The thread hands off its address (and value for stores) to the memory controller and transitions to MEM_WAIT.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <strong className="text-flame-orange font-bold">MEM_WAIT</strong> — Stall here until the memory controller comes back with the data. With our 4-cycle read latency, this is typically 4 cycles of doing nothing. This is the most expensive state and the main reason GPU programs are structured the way they are — you want to hide this latency by having other warps execute while yours is waiting.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <strong className="text-flame-orange font-bold">SYNC_WAIT</strong> — The thread hit a SYNC barrier and is waiting for all other threads in its block to catch up.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              <strong className="text-flame-orange font-bold">DONE</strong> — The thread hit RET. It's retired. Its registers are freed.
            </p>
          </section>

          {/* Illustration 1 Container */}
          <div id="thread-state-machine" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img
                src="/blog/image1-part2.png"
                alt="Thread state machine transitions"
                className="max-w-full h-auto select-none"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              Thread State Machine
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              State machine tracking transitions for individual threads. Transitions: <strong className="text-flame-orange">FETCH → DECODE</strong> (always, 1 cycle); <strong className="text-flame-orange">DECODE → EXECUTE</strong> (arithmetic, CONST, BRnzp, SYNC, RET) or <strong className="text-flame-orange">DECODE → MEM_REQ</strong> (LDR or STR); <strong className="text-flame-orange">EXECUTE → FETCH/DONE/SYNC_WAIT</strong>; <strong className="text-flame-orange">MEM_REQ → MEM_WAIT</strong>; and <strong className="text-flame-orange">SYNC_WAIT → FETCH</strong> once all threads synchronize.
            </p>
          </div>

          {/* Section 2: The register file and special registers */}
          <section id="registers-and-special" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              The register file and special registers
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              Each thread has 16 registers. R0 through R12 are general purpose. The last three are injected at birth and read-only:
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <code className="bg-cloud-white border border-stone-gray px-1.5 py-0.5 text-flame-orange text-[11px] font-bold">%threadIdx</code> — which thread this is within its block. Thread 0 gets 0, thread 31 gets 31.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <code className="bg-cloud-white border border-stone-gray px-1.5 py-0.5 text-flame-orange text-[11px] font-bold">%blockIdx</code> — which block this thread is in. If you have 4 blocks of 32 threads, block 0's threads have blockIdx=0, block 1's have blockIdx=1.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              <code className="bg-cloud-white border border-stone-gray px-1.5 py-0.5 text-flame-orange text-[11px] font-bold">%blockDim</code> — how many threads are in a block. Always 32 in NYX.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              These three values are what make SIMD work. Every thread in a warp executes <code>ADD R0, R0, %threadIdx</code> at the same time, but each gets a different result because each has a different threadIdx. Same instruction. Different data. Different memory addresses.
            </p>
          </section>

          {/* Illustration 2 Container */}
          <div id="thread-birth" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img
                src="/blog/image2-part2.png"
                alt="Thread birth register injection"
                className="max-w-full h-auto select-none"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              Thread Birth: Register Injection
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              Thread 5 in Block 2 (blockDim=32) initialized with special read-only registers injected: <strong className="text-electric-blue">R13 (%threadIdx) = 5</strong>, <strong className="text-electric-blue">R14 (%blockIdx) = 2</strong>, and <strong className="text-electric-blue">R15 (%blockDim) = 32</strong>. General purpose registers R0..R12 are zeroed out at birth.
            </p>
          </div>

          {/* Section 3: Memory: the expensive part */}
          <section id="memory-expensive" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              Memory: the expensive part
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              When a thread hits LDR or STR, it doesn't just read or write memory directly. It submits a request to the memory controller and waits. This is because global memory is off-chip DRAM — physically distant from the compute units. The latency is real and significant.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              In NYX, every memory request costs 4 cycles. That means a thread that does two LDRs (like our vecadd kernel — load A[i], load B[i]) spends at minimum 8 cycles just waiting. The arithmetic — MUL, ADD, ADD, ADD, STR — takes 5 cycles. So memory dominates.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              This is the fundamental constraint all GPU programmers work around. The warps system (Part 3) exists specifically to hide this latency by running other threads while yours is waiting.
            </p>
          </section>

          {/* Illustration 3 Container */}
          <div id="vecadd-timeline" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img
                src="/blog/image3-part2.png"
                alt="Timeline of one thread running vecadd"
                className="max-w-full h-auto select-none"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              Timeline of One Thread Running vecadd
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              Execution timeline of a single thread running vector addition. Note the long hatched sections representing memory stalls during global memory reads and writes. Most of a thread's life is spent waiting for memory.
            </p>
          </div>

          {/* Section 4: The dispatcher and blocks */}
          <section id="dispatcher-blocks" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              The dispatcher and blocks
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              Before any thread can run, the dispatcher has to assign work to the SMs. A kernel launch specifies a grid of blocks. The dispatcher maintains a queue of all blocks and feeds them to idle SMs one at a time.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              In NYX we have 4 SMs. If your kernel has 8 blocks, the first 4 get dispatched immediately. As each SM finishes its block, the dispatcher hands it the next one. Simple round-robin.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              The block is the unit of assignment — not individual warps, not threads. An SM takes ownership of an entire block and runs all its warps to completion before reporting back idle. This is important for shared memory: all threads in a block share the same on-chip SRAM, so they have to live on the same SM.
            </p>
          </section>

          {/* Illustration 4 Container */}
          <div id="dispatcher-assigning" className="border border-stone-gray p-3 sm:p-4 my-8 bg-cloud-white flex flex-col items-center scroll-mt-24">
            <div className="w-full flex justify-center bg-white border border-stone-gray p-2 overflow-hidden">
              <img
                src="/blog/image4-part2.png"
                alt="Dispatcher assigning blocks to SMs"
                className="max-w-full h-auto select-none"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-midnight-graphite uppercase tracking-wider mt-3 text-center">
              Dispatcher Assigning Blocks to SMs
            </span>
            <p className="text-[11px] font-mono text-smoke-gray mt-1.5 max-w-2xl text-center leading-relaxed">
              The dispatcher manages a queue of pending thread blocks (e.g. Block 0..5), dispatching them to idle SM cores (SM0..SM3) in a round-robin schedule. When SM0 completes its current block, it signals the dispatcher and is handed Block 4.
            </p>
          </div>

          {/* Section 5: Watching it run */}
          <section id="watching-it-run" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              Watching it run
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              The NYX trace viewer prints every event live as the simulation ticks. With LevelSummary you see block and warp completions. With LevelThread you see every single thread instruction every cycle — useful for debugging but noisy for larger kernels.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              The vecadd kernel with 32 threads (1 warp, 1 block) running on SM0 should complete in roughly 30-40 cycles. Most of that time is in memory stalls. The actual arithmetic — the ADD that computes A[i]+B[i] — takes exactly 1 cycle per thread.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              After the simulation completes, the summary prints the output region of global memory. For vecadd with A={"{"}1..8{"}"} and B={"{"}8..1{"}"}, every C[i] should be 9. If it's not 9, something is broken in the thread engine. This is how we know the hardware is correct.
            </p>
          </section>

          {/* Section 6: What we built */}
          <section id="what-we-built" className="scroll-mt-24">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-ash-black uppercase tracking-tight border-b border-stone-gray pb-2 mt-10 mb-4">
              What we built
            </h2>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-4">
              We completed wiring up the key parts of the cycle-accurate thread execution engine:
            </p>
            <ul className="list-disc pl-6 mb-6 flex flex-col gap-2.5 font-mono text-xs sm:text-sm text-steel-gray leading-relaxed">
              <li>
                <code className="text-electric-blue font-bold">core/thread.go</code> — Complete thread state machine. Every state is explicit: FETCH, DECODE, EXECUTE, MEM_REQ, MEM_WAIT, SYNC_WAIT, DONE. The ALU handles all 13 instructions with correct semantics including signed immediates, NZP register updates, and PC-relative branches.
              </li>
              <li>
                <code className="text-electric-blue font-bold">core/types.go</code> additions — Thread/Warp/Block constructors. Special register injection. Helper methods for done/stall checks.
              </li>
              <li>
                <code className="text-electric-blue font-bold">sim/dispatcher.go</code> — Block queue with round-robin SM assignment.
              </li>
              <li>
                <code className="text-electric-blue font-bold">sim/sim.go</code> — Cycle-accurate run loop. Each cycle: dispatch → tick memory → route responses → tick SMs → tick warps → tick threads.
              </li>
              <li>
                <code className="text-electric-blue font-bold">trace/trace.go</code> — Live colored terminal output. Gray for fetch, green for execute, yellow for memory, cyan for sync, red for done.
              </li>
            </ul>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mb-6">
              Running <code>go run main.go</code> triggers a simulation run of our vecadd assembly kernel to completion. The trace prints live cycle-by-cycle logs, and the final global memory summary shows C[0..7] = 9 with C[8..23] = 0.
            </p>
            <p className="font-mono text-xs sm:text-sm text-steel-gray leading-relaxed mt-6 border-t border-stone-gray pt-4">
              <strong className="text-midnight-graphite">Next up — Chapter 3</strong>: Warps and divergence. We'll run multiple warps per SM, implement the active mask properly, and handle real branch divergence where threads in the same warp take different paths. We'll also write a kernel that actually diverges so we can watch it happen in the trace.
            </p>
          </section>

          <LikeCounter slug="chapter-2" />

          <div className="border-t border-stone-gray pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link href="/blog/chapter-1" className="text-xs font-bold font-mono text-electric-blue hover:underline whitespace-nowrap">
              ← READ CHAPTER 1
            </Link>
            <Link href="/blog" className="text-xs font-bold font-mono text-electric-blue hover:underline whitespace-nowrap">
              BACK TO BLOG INDEX
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
