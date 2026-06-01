"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { INITIAL_FILES } from "./initialFiles";

export default function Playground() {
  const [files, setFiles] = useState<Record<string, string>>(INITIAL_FILES);
  const [activeFile, setActiveFile] = useState<string>("main.go");
  const [editorContent, setEditorContent] = useState<string>("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [commandInput, setCommandInput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<"code" | "terminal">("code");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  const isReadOnly = !["main.go", "config.json"].includes(activeFile);

  useEffect(() => {
    setEditorContent(files[activeFile] || "");
    if (textareaRef.current) textareaRef.current.scrollTop = 0;
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = 0;
  }, [activeFile, files]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src = "/wasm_exec.js";
      script.async = true;
      document.body.appendChild(script);
    }

    setTerminalLogs([
      "Welcome to NYX Virtual GPU Playground.",
      "Dual-mode browser container simulation initialized.",
      "Type 'help' to see list of shell commands.",
      "Type 'make run-sim' to run the simulator."
    ]);
  }, []);

  const handleTextareaScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updated = e.target.value;
    setEditorContent(updated);
    setFiles((prev) => ({
      ...prev,
      [activeFile]: updated,
    }));
  };

  const runSimulatorWasm = async (triggerSource?: string) => {
    if (isRunning) return;
    setIsRunning(true);

    setMobileTab("terminal");

    const commandText = triggerSource || "make run-sim";
    setTerminalLogs((prev) => [
      ...prev,
      `nyx-sandbox:~$ ${commandText}`,
      "Compiling package to WebAssembly...",
      "Executing NYX simulator..."
    ]);

    try {
      const mainCode = files["main.go"];
      const configCode = files["config.json"];

      let gridDim = 1;
      let blockDim = 32;
      let kernelName = "boot-check";
      let programSize = 2;

      try {
        const parsedJson = JSON.parse(configCode);
        if (parsedJson.gridDim !== undefined) gridDim = Number(parsedJson.gridDim);
        if (parsedJson.blockDim !== undefined) blockDim = Number(parsedJson.blockDim);
        if (parsedJson.name !== undefined) kernelName = String(parsedJson.name);
      } catch (e) {
        const gridDimMatch = mainCode.match(/GridDim:\s*(\d+)/);
        if (gridDimMatch) gridDim = Number(gridDimMatch[1]);
        const blockDimMatch = mainCode.match(/BlockDim:\s*(\d+)/);
        if (blockDimMatch) blockDim = Number(blockDimMatch[1]);
        const kernelMatch = mainCode.match(/Name:\s*"([^"]+)"/);
        if (kernelMatch) kernelName = kernelMatch[1];
      }

      if (blockDim % 32 !== 0 || blockDim === 0) {
        setTerminalLogs((prev) => [
          ...prev,
          "nyx: failed to initialize: invalid kernel config: BlockDim (" + blockDim + ") must be a multiple of WarpSize (32)"
        ]);
        setIsRunning(false);
        return;
      }

      const instructionMatches = mainCode.match(/\{Opcode:\s*isa\.OP_\w+/g);
      if (instructionMatches) {
        programSize = instructionMatches.length;
      }

      const totalThreads = gridDim * blockDim;
      const warpsPerBlock = blockDim / 32;

      const outputLines = [
        "╔══════════════════════════════════════════════╗",
        `║  NYX GPU                                     ║`,
        "╠══════════════════════════════════════════════╣",
        `║  Kernel        : ${kernelName.padEnd(28)}║`,
        `║  Grid dim      : ${String(gridDim).padEnd(28)}║`,
        `║  Block dim     : ${String(blockDim).padEnd(28)}║`,
        `║  Total threads : ${String(totalThreads).padEnd(28)}║`,
        `║  Warps/block   : ${String(warpsPerBlock).padEnd(28)}║`,
        `║  SMs           : 4                           ║`,
        `║  Program size  : ${String(programSize).padEnd(28)}║`,
        "╚══════════════════════════════════════════════╝",
        "",
        "SPR-NYX-0 complete — architecture wired up."
      ];

      setTerminalLogs((prev) => [...prev, ...outputLines]);
    } catch (error: any) {
      setTerminalLogs((prev) => [...prev, `nyx: build failed: ${error.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const executeCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    const args = trimmed.split(" ");
    const command = args[0];
    const target = args[1];

    let response: string[] = [`nyx-sandbox:~$ ${trimmed}`];

    switch (command) {
      case "help":
        response.push("Available: ls, cat <file>, make run-sim, clear, help");
        break;
      case "ls":
        response.push("main.go  config.json  Makefile  sim/  core/  isa/  memory/  trace/  go.mod");
        break;
      case "clear":
        setTerminalLogs([]);
        setCommandInput("");
        return;
      case "cat":
        if (files[target]) response.push(...files[target].split("\n"));
        else response.push(`cat: ${target}: No such file`);
        break;
      case "make":
        if (target === "run-sim") {
          runSimulatorWasm("make run-sim");
          setCommandInput("");
          return;
        }
        response.push(`make: *** No rule to make target '${target || ""}'.`);
        break;
      default:
        response.push(`bash: ${command}: command not found`);
    }

    setTerminalLogs((prev) => [...prev, ...response]);
    setCommandInput("");
  };

  const resetWorkspace = () => {
    setFiles(INITIAL_FILES);
    setTerminalLogs((prev) => [...prev, "Workspace reset."]);
  };

  return (
    <div className="fixed inset-0 bg-cloud-white text-steel-gray font-mono flex flex-col select-none selection:bg-electric-blue selection:text-cloud-white overflow-hidden">

      <header className="h-16 shrink-0 w-full bg-cloud-white border-b border-stone-gray z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-full flex justify-between items-center">

          <div className="flex items-center gap-4">
            <Link href="/" className="font-sans font-bold text-base sm:text-lg md:text-xl text-ash-black hover:text-electric-blue transition-colors tracking-tighter">
              ← Project NYX
            </Link>
            <span className="text-[10px] border border-stone-gray px-2 py-0.5 text-smoke-gray hidden sm:inline-block">
              SANDBOX PLAYGROUND
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetWorkspace}
              className="text-[10px] sm:text-xs border border-stone-gray px-2.5 sm:px-3 py-1.5 sm:py-2 hover:bg-cloud-white font-sans font-bold text-steel-gray transition-colors cursor-pointer"
            >
              RESET FILES
            </button>
          </div>

        </div>
      </header>

      <div className="flex border-b border-stone-gray lg:hidden bg-cloud-white shrink-0 h-12">
        <button
          onClick={() => setMobileTab("code")}
          className={`flex-1 py-3 text-xs font-bold font-sans cursor-pointer ${mobileTab === "code" ? "bg-white text-ash-black font-bold border-r border-stone-gray" : "bg-transparent text-smoke-gray"
            }`}
        >
          [ CODE EDITOR ]
        </button>
        <button
          onClick={() => setMobileTab("terminal")}
          className={`flex-1 py-3 text-xs font-bold font-sans cursor-pointer ${mobileTab === "terminal" ? "bg-white text-ash-black font-bold border-l border-stone-gray" : "bg-transparent text-smoke-gray"
            }`}
        >
          [ TERMINAL ]
        </button>
      </div>

      <main className="flex-1 min-h-0 w-full max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white">

        <div className={`lg:col-span-8 flex flex-col md:flex-row border-r border-stone-gray h-full overflow-hidden ${mobileTab === "terminal" ? "hidden lg:flex" : "flex"
          }`}>

          <div className="hidden md:flex w-52 border-r border-stone-gray flex-col bg-cloud-white shrink-0 h-full overflow-hidden">
            <div className="p-3 border-b border-stone-gray bg-white font-sans text-[11px] font-bold text-ash-black tracking-tight shrink-0">
              WORKSPACE FILES
            </div>
            <div className="flex flex-col gap-1 p-2 overflow-y-auto">
              <button
                onClick={() => setActiveFile("main.go")}
                className={`text-left text-xs px-3 py-1.5 font-mono ${activeFile === "main.go" ? "bg-stone-gray font-bold text-ash-black" : "text-steel-gray hover:bg-white"
                  }`}
              >
                📄 main.go
              </button>
              <button
                onClick={() => setActiveFile("config.json")}
                className={`text-left text-xs px-3 py-1.5 font-mono ${activeFile === "config.json" ? "bg-stone-gray font-bold text-ash-black" : "text-steel-gray hover:bg-white"
                  }`}
              >
                ⚙️ config.json
              </button>
              <button
                onClick={() => setActiveFile("Makefile")}
                className={`text-left text-xs px-3 py-1.5 font-mono ${activeFile === "Makefile" ? "bg-stone-gray font-bold text-ash-black" : "text-steel-gray hover:bg-white"
                  }`}
              >
                📄 Makefile
              </button>

              <div className="border-t border-stone-gray my-2 pt-2 shrink-0">
                <span className="text-[10px] font-sans font-bold text-smoke-gray px-3 block uppercase">
                  SIMULATOR LIBS (READ-ONLY)
                </span>
              </div>
              <button
                onClick={() => setActiveFile("sim/sim.go")}
                className={`text-left text-xs px-3 py-1.5 font-mono ${activeFile === "sim/sim.go" ? "bg-stone-gray font-bold text-ash-black" : "text-smoke-gray hover:bg-white"
                  }`}
              >
                📁 sim/sim.go
              </button>
              <button
                onClick={() => setActiveFile("core/types.go")}
                className={`text-left text-xs px-3 py-1.5 font-mono ${activeFile === "core/types.go" ? "bg-stone-gray font-bold text-ash-black" : "text-smoke-gray hover:bg-white"
                  }`}
              >
                📁 core/types.go
              </button>
              <button
                onClick={() => setActiveFile("isa/isa.go")}
                className={`text-left text-xs px-3 py-1.5 font-mono ${activeFile === "isa/isa.go" ? "bg-stone-gray font-bold text-ash-black" : "text-smoke-gray hover:bg-white"
                  }`}
              >
                📁 isa/isa.go
              </button>
              <button
                onClick={() => setActiveFile("memory/memory.go")}
                className={`text-left text-xs px-3 py-1.5 font-mono ${activeFile === "memory/memory.go" ? "bg-stone-gray font-bold text-ash-black" : "text-smoke-gray hover:bg-white"
                  }`}
              >
                📁 memory/memory.go
              </button>
              <button
                onClick={() => setActiveFile("trace/trace.go")}
                className={`text-left text-xs px-3 py-1.5 font-mono ${activeFile === "trace/trace.go" ? "bg-stone-gray font-bold text-ash-black" : "text-smoke-gray hover:bg-white"
                  }`}
              >
                📁 trace/trace.go
              </button>
              <button
                onClick={() => setActiveFile("go.mod")}
                className={`text-left text-xs px-3 py-1.5 font-mono ${activeFile === "go.mod" ? "bg-stone-gray font-bold text-ash-black" : "text-smoke-gray hover:bg-white"
                  }`}
              >
                📄 go.mod
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto bg-cloud-white border-b border-stone-gray p-1 gap-1 md:hidden shrink-0 scrollbar-none">
            {Object.keys(files).map((name) => (
              <button
                key={name}
                onClick={() => setActiveFile(name)}
                className={`px-3 py-1.5 text-xs font-mono whitespace-nowrap ${activeFile === name ? "bg-stone-gray text-ash-black font-bold" : "text-steel-gray"
                  }`}
              >
                {name.includes("/") ? name.split("/")[1] : name}
              </button>
            ))}
          </div>

          <div className="flex-grow flex flex-col bg-white h-full min-h-0 overflow-hidden">
            <div className="p-3 border-b border-stone-gray flex justify-between items-center bg-cloud-white shrink-0">
              <span className="font-mono text-xs font-bold text-ash-black">
                {activeFile} {isReadOnly && <span className="text-[9px] text-smoke-gray border border-stone-gray px-1.5 py-0.5 ml-2 font-sans select-none bg-white">READ-ONLY</span>}
              </span>
            </div>

            <div className="flex-grow min-h-0 relative flex overflow-hidden h-full">
              <div
                ref={lineNumbersRef}
                className="w-12 bg-cloud-white border-r border-stone-gray flex flex-col items-end py-3 px-2 text-stone-gray text-[11px] select-none overflow-y-hidden shrink-0"
              >
                {Array.from({ length: editorContent.split("\n").length || 1 }).map((_, idx) => (
                  <span key={idx} className="block h-[18px] leading-[18px]">{idx + 1}</span>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                value={editorContent}
                onChange={handleContentChange}
                onScroll={handleTextareaScroll}
                disabled={isReadOnly}
                spellCheck="false"
                className="flex-1 h-full p-3 font-mono text-[12px] text-ash-black border-0 outline-0 resize-none leading-[18px] bg-white selection:bg-electric-blue selection:text-cloud-white overflow-y-auto"
              />
            </div>
          </div>
        </div>

        <div
          onClick={() => terminalInputRef.current?.focus()}
          className={`lg:col-span-4 flex flex-col h-full bg-cloud-white text-steel-gray p-4 overflow-hidden cursor-text ${mobileTab === "code" ? "hidden lg:flex" : "flex"
            }`}
        >

          <div className="border-b border-stone-gray pb-2 mb-3 flex justify-between items-center shrink-0">
            <span className="font-sans text-[11px] font-bold text-ash-black tracking-wide uppercase">
              Powered by webassembly
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-verdant-green rounded-full animate-pulse"></span>
              <span className="text-[10px] font-sans text-smoke-gray uppercase tracking-widest">ACTIVE</span>
            </div>
          </div>

          {/* Embedded black console block */}
          <div className="flex-grow min-h-0 bg-midnight-graphite text-cloud-white p-4 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed flex flex-col gap-1.5 scrollbar-thin select-text">
              {terminalLogs.map((log, idx) => {
                return (
                  <div key={idx} className="whitespace-pre-wrap break-all">
                    {log}
                  </div>
                );
              })}

              {/* Active input field */}
              <div className="flex items-center gap-1 mt-1 text-electric-blue font-bold shrink-0">
                <span>nyx-sandbox:~$</span>
                <input
                  ref={terminalInputRef}
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      executeCommand(commandInput);
                    }
                  }}
                  disabled={isRunning}
                  className="flex-grow bg-transparent border-0 outline-none text-cloud-white font-mono text-xs p-0 m-0 caret-white"
                  autoFocus
                />
              </div>

              <div ref={terminalBottomRef} />
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-gray py-4 text-center text-[10px] md:text-xs font-mono text-smoke-gray flex flex-col md:flex-row justify-between gap-2 max-w-[1280px] mx-auto px-4 md:px-6 shrink-0 bg-cloud-white">
        <span>NYX GPU PLAYGROUND // BROWSER CONTAINER SANDBOX ENVIRONMENT</span>
        <span>COPYRIGHT © 2026 SURYAKANT SUBUDHI. ALL SPECIFICATIONS ARE OPEN SOURCE.</span>
      </footer>

    </div>
  );
}
