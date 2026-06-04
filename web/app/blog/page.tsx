import React from "react";
import Link from "next/link";
import { LikesDisplay } from "../components/LikesDisplay";

export const metadata = {
  title: "Engineering Curriculum & Blog | Project NYX",
  description: "Learn how I build a cycle-accurate GPU from the ground up, covering SIMD logic, assembler compilers, SM dispatchers, and memory scheduling.",
};

export default function BlogIndexPage() {
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

      {/* Main Listing Layout */}
      <main className="flex-1 w-full max-w-[800px] mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col gap-10">

        {/* Section Header */}
        <div className="border-b border-steel-gray pb-4 mb-4">
          <span className="text-[10px] sm:text-xs font-mono font-bold text-electric-blue uppercase tracking-widest block mb-1">
            PROJECT JOURNAL & CURRICULUM
          </span>
          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-ash-black leading-tight uppercase tracking-tight">
            How I am building NYX
          </h1>
          <p className="font-mono text-xs sm:text-sm text-smoke-gray mt-2 leading-relaxed">
            A step-by-step curriculum walking through GPU hardware design, SIMD execution pipelines, instruction set architectures, and assembler compilers.
          </p>
        </div>

        <div className="flex flex-col gap-8">

          {/* Chapter 0 Entry */}
          <div className="border border-stone-gray bg-white p-6 sm:p-8 flex flex-col gap-4 hover:border-steel-gray transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-gray pb-3">
              <div className="flex items-center gap-3">
                <span className="bg-electric-blue text-white px-2.5 py-0.5 text-xs font-mono font-bold">
                  CHAPTER 0
                </span>
                <h2 className="font-sans font-bold text-sm sm:text-base md:text-lg text-ash-black uppercase tracking-tight">
                  Why CPUs and GPUs Are Fundamentally Different
                </h2>
              </div>
              <span className="text-xs font-mono text-smoke-gray">June 1, 2026</span>
            </div>

            <p className="font-mono text-xs sm:text-sm leading-relaxed text-steel-gray">
              An architectural deep-dive into GPU throughput and CPU latency design principles. I explore thread scheduling, the SIMD model, warp execution, branch divergence, and the top-level NYX implementation layout.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 pt-2 border-t border-stone-gray border-opacity-30">
              <span className="text-[11px] font-mono text-smoke-gray uppercase tracking-wider">
                8 MIN READ • BY SURYAKANT SUBUDHI • <LikesDisplay slug="chapter-0" />
              </span>
              <Link
                href="/blog/chapter-0"
                className="text-xs font-bold font-mono text-electric-blue hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                READ CHAPTER 0 →
              </Link>
            </div>
          </div>

          {/* Chapter 1 Entry */}
          <div className="border border-stone-gray bg-white p-6 sm:p-8 flex flex-col gap-4 hover:border-steel-gray transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-gray pb-3">
              <div className="flex items-center gap-3">
                <span className="bg-electric-blue text-white px-2.5 py-0.5 text-xs font-mono font-bold">
                  CHAPTER 1
                </span>
                <h2 className="font-sans font-bold text-sm sm:text-base md:text-lg text-ash-black uppercase tracking-tight">
                  Designing an Instruction Set from Scratch
                </h2>
              </div>
              <span className="text-xs font-mono text-smoke-gray">June 3, 2026</span>
            </div>

            <p className="font-mono text-xs sm:text-sm leading-relaxed text-steel-gray">
              Designing the binary 32-bit instruction formats for the custom NYX ISA. We write an assembler tool in Go that parses assembly programs, resolves symbols, and outputs binary files ready for execution.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 pt-2 border-t border-stone-gray border-opacity-30">
              <span className="text-[11px] font-mono text-smoke-gray uppercase tracking-wider">
                6 MIN READ • BY SURYAKANT SUBUDHI • <LikesDisplay slug="chapter-1" />
              </span>
              <Link
                href="/blog/chapter-1"
                className="text-xs font-bold font-mono text-electric-blue hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                READ CHAPTER 1 →
              </Link>
            </div>
          </div>

          {/* Chapter 2 Entry (Dashed/Planned) */}
          <div className="border border-stone-gray border-dashed bg-cloud-white bg-opacity-50 p-6 sm:p-8 flex flex-col gap-4 opacity-75">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-gray pb-3">
              <div className="flex items-center gap-3">
                <span className="bg-stone-gray text-midnight-graphite border border-stone-gray px-2.5 py-0.5 text-xs font-mono font-bold">
                  CHAPTER 2
                </span>
                <h2 className="font-sans font-bold text-sm sm:text-base md:text-lg text-smoke-gray uppercase tracking-tight">
                  Core Execution Engine & Warp Scheduler
                </h2>
              </div>
              <span className="text-xs font-mono text-smoke-gray">IN DEVELOPMENT</span>
            </div>

            <p className="font-mono text-xs sm:text-sm leading-relaxed text-smoke-gray">
              Building the cycle-by-cycle execution engine. We will model the thread execution state machine (FETCH, DECODE, EXECUTE, MEM_REQ, MEM_WAIT), warp scheduler instruction dispatching, and NZP status flags.
            </p>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-gray border-opacity-30">
              <span className="text-[11px] font-mono text-smoke-gray uppercase tracking-wider">
                COMING SOON
              </span>
              <span className="text-xs font-mono text-stone-gray italic">
                Locked
              </span>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-gray pt-6 mt-12 pb-8 text-center text-xs font-mono text-smoke-gray flex flex-col md:flex-row justify-between gap-4 max-w-[1280px] mx-auto px-6 bg-cloud-white">
        <span>NYX GPU IMPLEMENTATION // AN OPEN SOURCE HARDWARE RESEARCH STUDY</span>
        <span>COPYRIGHT © 2026 SURYAKANT SUBUDHI. ALL SPECIFICATIONS ARE OPEN SOURCE.</span>
      </footer>

    </div>
  );
}
