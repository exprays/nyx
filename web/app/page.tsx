"use client";

import React from "react";

// Project Changelog Component (Refactored for PlanetScale Monochrome theme with Sans/Mono fonts)
function ChangelogSection() {
  return (
    <div className="flex flex-col gap-6" id="changelog-section">
      <div className="border-b border-steel-gray pb-4 flex justify-between items-center">
        <h2 className="text-base sm:text-lg md:text-xl font-bold font-sans text-ash-black tracking-tight uppercase">
          PROJECT SPEC & CHANGELOG
        </h2>
        <span className="text-[9px] md:text-xs bg-midnight-graphite px-2.5 py-1 text-cloud-white font-mono uppercase tracking-wider">
          LATEST: v0.1.0
        </span>
      </div>

      <div className="flex flex-col gap-8">

        {/* Release 1 (v0.1.0) */}
        <div className="border border-stone-gray bg-cloud-white p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-gray pb-3">
            <div className="flex items-center gap-3">
              <span className="bg-stone-gray text-midnight-graphite border border-stone-gray px-2 py-0.5 text-xs font-mono font-bold">
                v0.1.0
              </span>
              <h3 className="font-sans font-bold text-sm md:text-base text-ash-black">
                SPR-NYX-0 // Core Architecture Wired Up
              </h3>
            </div>
            <span className="text-xs font-mono text-smoke-gray">2026.06.01</span>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-steel-gray font-mono">
            The initial release wires up the foundation of the Nyx GPU pipeline. This cycle-accurate simulator simulates streaming multiprocessors (SMs), warps, thread registers, and memory scheduling logic in Go.
          </p>

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold font-sans text-ash-black uppercase tracking-wider">Key Implementations:</h4>
            <ul className="list-disc pl-5 text-xs text-smoke-gray flex flex-col gap-2 leading-relaxed font-mono">
              <li><strong>Execution Pipeline</strong>: Defined thread states (FETCH, DECODE, EXECUTE, MEM_REQ, MEM_WAIT) and warp-level SIMD synchronization.</li>
              <li><strong>Register Files</strong>: Modeled 16 virtual registers per thread, including read-only special registers like thread index, block index, and block dimensions.</li>
              <li><strong>Memory Controllers</strong>: Implemented an asynchronous off-chip global memory DRAM simulator with 4-cycle latencies and bandwidth limits.</li>
              <li><strong>Shared SRAM</strong>: Formulated local block-level shared memory with 0-cycle latency access.</li>
              <li><strong>Tracer Logs</strong>: Programmed a cycle-by-cycle terminal logger outputting simulation telemetry.</li>
            </ul>
          </div>
        </div>

        {/* Release 2 (v0.2.0 - Planned) */}
        <div className="border border-stone-gray bg-cloud-white bg-opacity-70 p-4 sm:p-6 flex flex-col gap-4 border-dashed">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-gray pb-3 opacity-60">
            <div className="flex items-center gap-3">
              <span className="bg-stone-gray text-midnight-graphite border border-stone-gray px-2 py-0.5 text-xs font-mono font-bold">
                v0.2.0
              </span>
              <h3 className="font-sans font-bold text-sm md:text-base text-ash-black">
                SPR-NYX-1 // ISA Specification & Assembler
              </h3>
            </div>
            <span className="text-xs font-mono text-smoke-gray">IN PROGRESS</span>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-steel-gray font-mono opacity-70">
            Developing the binary encoding specifications for the 32-bit Nyx ISA instruction formats, along with a custom assembler tool written in Go that translates textual assembly programs into execute-ready byte streams.
          </p>

          <div className="flex flex-col gap-2 opacity-70">
            <h4 className="text-xs font-bold font-sans text-ash-black uppercase tracking-wider">Upcoming Features:</h4>
            <ul className="list-disc pl-5 text-xs text-smoke-gray flex flex-col gap-2 leading-relaxed font-mono">
              <li><strong>ISA Encoding Formats</strong>: Structuring the exact bit positions for Opcode, Rd, Rs1, Rs2, Imm, and NZPMask values.</li>
              <li><strong>Go Assembler Tool</strong>: Building a parser and code generator to compile text instructions into a binary representation.</li>
              <li><strong>Validation Suite</strong>: Automated test suite to encode and decode operations to verify bitfield completeness.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-cloud-white text-steel-gray font-mono flex flex-col select-none selection:bg-electric-blue selection:text-cloud-white overflow-x-hidden">

      {/* Top Banner Link (Flame Orange Update Banner) */}
      <div className="w-full bg-flame-orange text-cloud-white text-[10px] sm:text-xs py-2.5 px-4 text-center font-bold tracking-tight border-b border-midnight-graphite font-mono">
        <span className="hidden sm:inline">NYX v0.1.0 CORE ARCHITECTURE IS LIVE. </span>
        <span className="sm:hidden">NYX v0.1.0 LIVE: </span>
        <button
          onClick={() => {
            const el = document.getElementById("changelog-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="underline text-cloud-white hover:text-ash-black cursor-pointer font-bold inline-block ml-1 font-mono"
        >
          Read the Specs & Changelog →
        </button>
      </div>

      {/* Navigation Bar */}
      <header className="w-full bg-cloud-white border-b border-stone-gray sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">

          {/* Logo brand */}
          <div className="flex items-center gap-2 sm:gap-4 whitespace-nowrap">
            <span className="font-sans font-bold text-base sm:text-lg md:text-xl text-ash-black tracking-tighter">
              Project NYX
            </span>
            <span className="text-[10px] border border-stone-gray px-2 py-0.5 text-smoke-gray select-none hidden sm:inline-block">
              v0.1.0-alpha
            </span>
          </div>

          {/* Nav Items (Naked Link style - Hidden on mobile/tablet to avoid overflow) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <button
              onClick={() => {
                const el = document.getElementById("changelog-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-steel-gray hover:text-electric-blue transition-colors cursor-pointer py-1.5 px-1 font-sans"
            >
              CHANGELOG
            </button>
            <a
              href="https://github.com/exprays/nyx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-steel-gray hover:text-electric-blue transition-colors py-1.5 font-sans"
            >
              GITHUB
            </a>
          </nav>

          {/* Action button (Orange Action Button) */}
          <div className="whitespace-nowrap">
            <button className="bg-flame-orange text-cloud-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-2 hover:bg-opacity-90 cursor-pointer border-0 transition-opacity font-mono">
              <span className="hidden sm:inline">GET EARLY ACCESS</span>
              <span className="sm:hidden">GET ACCESS</span>
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section Container */}
      <section className="w-full bg-cloud-white border-b border-stone-gray overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-20 flex flex-col items-center text-center">

          {/* Status Tag Badge */}
          <div className="inline-flex items-center gap-2 border border-stone-gray px-3 py-1 text-xs text-smoke-gray uppercase tracking-wider mb-6 bg-white font-mono">
            <span className="inline-block w-2 h-2 bg-verdant-green rounded-full"></span>
            <span>Architecture wired: stable</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-ash-black max-w-4xl leading-[1.08] uppercase font-sans break-words">
            Building a GPU from the ground up.
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-steel-gray max-w-2xl leading-relaxed mt-4 sm:mt-6 font-mono">
            A cycle-accurate hardware simulator and compiler pipeline written in Go. Study parallel scheduling logic, thread SIMD lanes, active mask divergence, and off-chip memory latencies cycle-by-cycle.
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            {/* Dark Overlay Button */}
            <button
              onClick={() => {
                const el = document.getElementById("changelog-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-midnight-graphite hover:bg-opacity-95 text-cloud-white text-xs font-bold px-6 py-3 cursor-pointer border-0 transition-opacity font-mono"
            >
              VIEW THE SPEC
            </button>
            {/* Naked Link Button */}
            <a
              href="https://github.com/exprays/nyx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-electric-blue hover:underline text-xs font-bold py-3 cursor-pointer border-0 bg-transparent flex items-center gap-1 font-mono"
            >
              View on GitHub →
            </a>
          </div>

          {/* GPU CAD Architectural Blueprint Diagram Box */}
          <div className="w-full mt-10 sm:mt-12 border border-stone-gray p-1 bg-white overflow-hidden">
            <div className="w-full overflow-x-auto scrollbar-thin">
              <div className="min-w-[800px] lg:min-w-0 w-full blueprint-grid border border-stone-gray aspect-[2.2/1] lg:aspect-[2.5/1] min-h-[300px] sm:min-h-[320px] relative flex flex-col justify-between p-3 select-none">

                {/* CAD coordinate headers */}
                <div className="w-full flex justify-between font-mono text-[9px] text-smoke-gray select-none border-b border-stone-gray border-opacity-30 pb-1.5">
                  <span>COORD // REF_X_091</span>
                  <span className="hidden md:inline">NYX_GPU_CORE_SCHEMATIC_v0.1</span>
                  <span className="md:hidden text-electric-blue font-bold animate-pulse">← SWIPE FOR SCHEMATIC DETAILS →</span>
                  <span>GRID: 24PX_INTERVAL</span>
                </div>

                {/* Central Vector CAD Schematic Grid */}
                <div className="flex-1 relative flex items-center justify-center">
                  <svg className="w-full h-full max-h-[360px]" viewBox="0 0 1000 350">

                    {/* Schematic outline boxes */}
                    {/* SM Core blocks (4 horizontal blocks) */}
                    {[0, 1, 2, 3].map((sm) => {
                      const offsetX = 50 + sm * 230;
                      return (
                        <g key={sm}>
                          {/* Outer SM Box */}
                          <rect
                            x={offsetX}
                            y="40"
                            width="210"
                            height="180"
                            fill="none"
                            stroke="#414141"
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                          />
                          <text x={offsetX + 10} y="55" fontSize="10" fontWeight="bold" fill="#000000" fontFamily="monospace">
                            SM{sm} Compute Core
                          </text>

                          {/* Warp Scheduler */}
                          <rect x={offsetX + 10} y="70" width="190" height="30" fill="none" stroke="#414141" strokeWidth="1" />
                          <text x={offsetX + 20} y="88" fontSize="8" fill="#737373" fontFamily="monospace">
                            Warp Scheduler / PC
                          </text>

                          {/* Register File Block */}
                          <rect x={offsetX + 10} y="110" width="90" height="40" fill="none" stroke="#414141" strokeWidth="1" />
                          <text x={offsetX + 15} y="125" fontSize="8" fill="#737373" fontFamily="monospace">Register File</text>
                          <text x={offsetX + 15} y="140" fontSize="7" fill="#c1c1c1" fontFamily="monospace">16 Regs/Thread</text>

                          {/* Shared Memory SRAM block */}
                          <rect x={offsetX + 110} y="110" width="90" height="40" fill="none" stroke="#414141" strokeWidth="1" />
                          <text x={offsetX + 115} y="125" fontSize="8" fill="#737373" fontFamily="monospace">Shared SRAM</text>
                          <text x={offsetX + 115} y="140" fontSize="7" fill="#c1c1c1" fontFamily="monospace">64 KB Block</text>

                          {/* 32 execution lanes block */}
                          <rect x={offsetX + 10} y="160" width="190" height="45" fill="none" stroke="#414141" strokeWidth="1" />
                          <text x={offsetX + 15} y="175" fontSize="8" fill="#000000" fontFamily="monospace" fontWeight="bold">
                            ALU Pipeline (32 Lanes)
                          </text>

                          {/* Interactive lane dots (Accents) */}
                          {Array.from({ length: 16 }).map((_, laneIdx) => {
                            const isActive = sm === 0 && laneIdx < 8;
                            const isSpecial = sm === 1 && laneIdx === 12;
                            return (
                              <rect
                                key={laneIdx}
                                x={offsetX + 15 + laneIdx * 11}
                                y="185"
                                width="6"
                                height="12"
                                fill={isActive ? "#0b6ec5" : isSpecial ? "#f35815" : "none"}
                                stroke="#414141"
                                strokeWidth="0.75"
                              />
                            );
                          })}
                        </g>
                      );
                    })}

                    {/* Interconnecting data bus lines (Stone Gray) */}
                    <line x1="50" y1="270" x2="950" y2="270" stroke="#414141" strokeWidth="2" />
                    <text x="60" y="260" fontSize="8" fontWeight="bold" fill="#000000" fontFamily="monospace">
                      MEMORY BARRIER / INTERCONNECT INTERFACE DATA BUS
                    </text>

                    {/* Flowing signals (functional color accents) */}
                    <circle cx="150" cy="270" r="4" fill="#0b6ec5" />
                    <text x="145" y="285" fontSize="7" fill="#0b6ec5" fontFamily="monospace" fontWeight="bold">FETCH</text>

                    <circle cx="510" cy="270" r="4" fill="#f35815" />
                    <text x="500" y="285" fontSize="7" fill="#f35815" fontFamily="monospace" fontWeight="bold">DIVERGED</text>

                    <circle cx="740" cy="270" r="4" fill="#22a652" />
                    <text x="730" y="285" fontSize="7" fill="#22a652" fontFamily="monospace" fontWeight="bold">COMMIT</text>

                    {/* Off-chip global DRAM block */}
                    <rect x="50" y="300" width="900" height="35" fill="none" stroke="#414141" strokeWidth="1.5" />
                    <text x="400" y="322" fontSize="9" fontWeight="bold" fill="#000000" fontFamily="monospace">
                      OFF-CHIP GLOBAL DRAM MEMORY CONTROLLERS (65,536 WORDS)
                    </text>

                  </svg>
                </div>

                {/* CAD dimensions footer details */}
                <div className="w-full flex justify-between font-mono text-[9px] text-smoke-gray border-t border-stone-gray border-opacity-30 pt-1.5">
                  <span>SCALE: 1 // 128_CORES</span>
                  <span>STATUS: DESIGNED</span>
                  <span>SYS_CLK: 100MHZ</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Split Layout Grid */}
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

        {/* Left Sidebar (Hardware Parameter Ledger) */}
        <aside className="lg:col-span-3 border border-stone-gray p-4 bg-cloud-white flex flex-col gap-4">
          <div className="border-b border-steel-gray pb-2">
            <h3 className="font-sans text-xs font-bold tracking-tight text-ash-black uppercase">
              LEDGER // PROJECT SPEC
            </h3>
          </div>

          <table className="w-full text-xs font-mono border-collapse">
            <tbody>
              <tr className="border-b border-stone-gray border-opacity-50">
                <td className="py-2 text-smoke-gray">SYSTEM CLOCK</td>
                <td className="text-right font-bold text-ash-black">100 MHz</td>
              </tr>
              <tr className="border-b border-stone-gray border-opacity-50">
                <td className="py-2 text-smoke-gray">LATEST RELEASE</td>
                <td className="text-right font-bold text-electric-blue">v0.1.0</td>
              </tr>
              <tr className="border-b border-stone-gray border-opacity-50">
                <td className="py-2 text-smoke-gray">GRID DIM</td>
                <td className="text-right font-bold text-ash-black">1 Block</td>
              </tr>
              <tr className="border-b border-stone-gray border-opacity-50">
                <td className="py-2 text-smoke-gray">BLOCK DIM</td>
                <td className="text-right font-bold text-ash-black">32 Threads</td>
              </tr>
              <tr className="border-b border-stone-gray border-opacity-50">
                <td className="py-2 text-smoke-gray">SM INSTANCES</td>
                <td className="text-right font-bold text-ash-black">4 Cores</td>
              </tr>
              <tr className="border-b border-stone-gray border-opacity-50">
                <td className="py-2 text-smoke-gray">WARP SIZE</td>
                <td className="text-right font-bold text-ash-black">32 Lanes</td>
              </tr>
              <tr className="border-b border-stone-gray border-opacity-50">
                <td className="py-2 text-smoke-gray">REGISTERS</td>
                <td className="text-right font-bold text-ash-black">16 / Thread</td>
              </tr>
              <tr className="border-b border-stone-gray border-opacity-50">
                <td className="py-2 text-smoke-gray">SHARED SRAM</td>
                <td className="text-right font-bold text-ash-black">64 KB / Block</td>
              </tr>
              <tr className="border-b border-stone-gray border-opacity-50">
                <td className="py-2 text-smoke-gray">GLOBAL MEM</td>
                <td className="text-right font-bold text-ash-black">64 K Words</td>
              </tr>
              <tr className="border-b border-stone-gray border-opacity-50">
                <td className="py-2 text-smoke-gray">MEM LATENCY</td>
                <td className="text-right font-bold text-flame-orange">4 cycles</td>
              </tr>
              <tr>
                <td className="py-2 text-smoke-gray">COMPILER</td>
                <td className="text-right font-bold text-ash-black">Go 1.22</td>
              </tr>
            </tbody>
          </table>

          <div className="bg-white p-3 border border-stone-gray mt-2">
            <h4 className="text-[11px] font-sans tracking-tight font-bold mb-1 text-ash-black uppercase">
              PROJECT STATISTICS
            </h4>
            <div className="flex justify-between text-[11px] font-mono text-smoke-gray">
              <span>STATUS:</span>
              <span className="font-bold text-verdant-green">ACTIVE DEV</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono text-smoke-gray mt-1">
              <span>MILESTONES:</span>
              <span className="font-bold text-ash-black">2 Releases</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 flex flex-col gap-6 md:gap-8">
          <ChangelogSection />
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-stone-gray pt-6 mt-12 pb-8 text-center text-xs font-mono text-smoke-gray flex flex-col md:flex-row justify-between gap-4 max-w-[1280px] mx-auto px-6">
        <span>NYX GPU SIMULATOR // AN OPEN SOURCE HARDWARE RESEARCH STUDY</span>
        <span>COPYRIGHT © 2026 SURYAKANT SUBUDHI. ALL SPECIFICATIONS ARE OPEN SOURCE.</span>
      </footer>
    </div>
  );
}
