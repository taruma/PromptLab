"use client";

import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import { FileText, Code, RefreshCw, Settings } from "lucide-react";

interface GenerationResultViewProps {
  generationResult: string;
  thinkingResult: string;
  isThinking: boolean;
  isLoading: boolean;
  error: string | null;
  filledPrompt: string;
  showCompiled: boolean;
  setShowCompiled: (show: boolean) => void;
  copied: boolean;
  handleCopyOutput: () => void;
}

export default function GenerationResultView({
  generationResult,
  thinkingResult,
  isThinking,
  isLoading,
  error,
  filledPrompt,
  showCompiled,
  setShowCompiled,
  copied,
  handleCopyOutput,
}: GenerationResultViewProps) {
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");

  // Load saved view mode preference from localStorage after initial render to avoid SSR hydration mismatch
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("prompt_generator_output_view_mode");
      if (savedMode === "formatted" || savedMode === "raw") {
        setTimeout(() => {
          setViewMode(savedMode);
        }, 0);
      }
    } catch (e) {
      console.error("Failed to load output view mode preference:", e);
    }
  }, []);

  // Save view mode preference to localStorage when changed
  const handleToggleViewMode = (mode: "formatted" | "raw") => {
    setViewMode(mode);
    try {
      localStorage.setItem("prompt_generator_output_view_mode", mode);
    } catch (e) {
      console.error("Failed to save output view mode preference:", e);
    }
  };

  return (
    <section className="flex-1 flex flex-col min-h-[420px]" id="output-panel">
      {/* Header bar */}
      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
            Generation Result
          </h2>
          {generationResult && (
            <span
              className="text-[8px] font-mono text-[#888884] bg-white border border-[#D1D1CF] px-1.5 py-0.5 font-bold"
              id="char-counter"
            >
              {generationResult.length} CHARS
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented View Mode Toggle */}
          <div
            className="flex items-center bg-white border border-[#D1D1CF] p-0.5"
            id="view-mode-toggle"
          >
            <button
              type="button"
              onClick={() => handleToggleViewMode("formatted")}
              className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "formatted"
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#888884] hover:text-[#1A1A1A]"
              }`}
              title="Render as formatted Markdown"
            >
              <FileText className="w-2.5 h-2.5" />
              Formatted
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode("raw")}
              className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "raw"
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#888884] hover:text-[#1A1A1A]"
              }`}
              title="View as raw text in smaller monospace font"
            >
              <Code className="w-2.5 h-2.5" />
              Raw
            </button>
          </div>

          {generationResult && (
            <button
              type="button"
              onClick={handleCopyOutput}
              className="px-3 py-1 bg-white border border-[#D1D1CF] text-[9px] uppercase font-bold tracking-widest hover:bg-[#F4F4F2] transition-colors cursor-pointer"
              id="copy-btn"
            >
              {copied ? (
                <span className="text-emerald-700">{"// Copied"}</span>
              ) : (
                "Copy Raw Text"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-4 bg-white border-l-4 border-red-500 border-y border-r border-[#D1D1CF] text-xs text-red-600 flex items-start gap-2">
          <span className="font-bold">{"// Error:"}</span>
          <span>{error}</span>
        </div>
      )}

      {/* Model Thinking / Reasoning Box */}
      {(thinkingResult || (isLoading && isThinking)) && (
        <div
          className="mb-4 bg-[#F4F4F2] border border-dashed border-[#D1D1CF] p-4 flex flex-col gap-2 transition-all"
          id="thinking-process-block"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-[#888884]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isThinking ? "bg-amber-500 animate-pulse" : "bg-stone-400"
                } inline-block`}
              />
              Engine Reasoning Trace
            </div>
            <span className="text-[8px] font-mono text-[#888884]">
              {isThinking ? "PROCESSING" : "COMPLETED"}
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#555] leading-relaxed max-h-[140px] overflow-y-auto whitespace-pre-wrap custom-scrollbar">
            {thinkingResult || (
              <span className="italic text-[#888884]">
                Engine is formulating reasoning path...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Display Area */}
      <div className="flex-1 bg-white border border-[#D1D1CF] p-6 flex flex-col justify-between overflow-hidden shadow-inner min-h-[300px]">
        {isLoading && !generationResult && !thinkingResult ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <RefreshCw className="w-6 h-6 animate-spin text-[#888884]" />
            <p className="text-xs uppercase tracking-widest font-bold text-[#888884]">
              Establishing Stream Connection...
            </p>
          </div>
        ) : generationResult || thinkingResult ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-1 text-[#1A1A1A] custom-scrollbar">
              {generationResult ? (
                viewMode === "formatted" ? (
                  <div className="markdown-body">
                    <Markdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-base font-black uppercase tracking-wider my-3 pb-1 border-b border-[#D1D1CF] font-sans text-[#1A1A1A]">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-sm font-bold uppercase tracking-wider my-2.5 font-sans text-[#1A1A1A]">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xs font-bold uppercase tracking-wider my-2 font-sans text-[#1A1A1A]">
                            {children}
                          </h3>
                        ),
                        h4: ({ children }) => (
                          <h4 className="text-[11px] font-bold uppercase tracking-wider my-1.5 font-sans text-[#1A1A1A]">
                            {children}
                          </h4>
                        ),
                        p: ({ children }) => (
                          <p className="mb-3 leading-relaxed text-[#1A1A1A] font-serif text-sm">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-3 space-y-1 text-[#1A1A1A] font-serif text-sm pl-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-3 space-y-1 text-[#1A1A1A] font-serif text-sm pl-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-relaxed font-serif text-sm inline-block w-full">
                            {children}
                          </li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-[#1A1A1A] pl-3 my-3 italic text-stone-700 font-serif bg-[#F4F4F2] py-2 pr-2 text-sm">
                            {children}
                          </blockquote>
                        ),
                        code: ({ className, children, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || "");
                          return match ? (
                            <pre className="bg-[#F4F4F2] border border-[#D1D1CF] p-3 my-3 font-mono text-xs overflow-x-auto text-[#1A1A1A] whitespace-pre">
                              <code>{children}</code>
                            </pre>
                          ) : (
                            <code
                              className="bg-[#F4F4F2] border border-[#D1D1CF] px-1.5 py-0.5 font-mono text-[11px] text-[#1A1A1A]"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        hr: () => <hr className="my-3 border-[#D1D1CF]" />,
                        strong: ({ children }) => (
                          <strong className="font-bold text-[#1A1A1A] font-sans">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic font-serif">{children}</em>
                        ),
                      }}
                    >
                      {generationResult}
                    </Markdown>
                  </div>
                ) : (
                  <pre className="text-[11px] md:text-xs font-mono leading-relaxed text-[#1A1A1A] whitespace-pre-wrap font-normal select-text">
                    {generationResult}
                  </pre>
                )
              ) : (
                <span className="italic text-[#888884] text-xs font-sans">
                  Reasoning trace active. Waiting for generation output...
                </span>
              )}
            </div>
            <div className="pt-3 border-t border-[#D1D1CF]/40 mt-3 flex items-center justify-between text-[8px] text-[#888884] font-mono uppercase tracking-wider">
              <span>
                VIEW: {viewMode === "formatted" ? "FORMATTED MARKDOWN" : "RAW MONOSPACE"}
              </span>
              <span className="flex items-center gap-1.5">
                {isLoading && !isThinking && (
                  <span className="flex items-center gap-1 text-[8px] text-emerald-600 font-bold uppercase tracking-wider font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Streaming...
                  </span>
                )}
                <span>PromptLab Output</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 p-4 text-[#888884]">
            <FileText className="w-8 h-8 text-[#D1D1CF] mb-3" />
            <p className="text-xs font-serif italic max-w-[280px]">
              The generated sequence will appear here once you hit generate. It combines your visual references with custom variables.
            </p>
          </div>
        )}
      </div>

      {/* Collapsible specs */}
      {filledPrompt && (
        <div
          className="mt-4 border-t border-[#D1D1CF] pt-3"
          id="accordion-compiled-prompt"
        >
          <button
            type="button"
            onClick={() => setShowCompiled(!showCompiled)}
            className="flex items-center justify-between w-full text-[9px] uppercase tracking-wider font-bold text-[#888884] hover:text-[#1A1A1A] transition-colors cursor-pointer"
            id="toggle-compiled-btn"
          >
            <span className="flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" />
              {showCompiled
                ? "Hide compiled instructions"
                : "Show compiled prompt specs"}
            </span>
            <span>{showCompiled ? "[-]" : "[+]"}</span>
          </button>
          {showCompiled && (
            <div className="mt-2.5 p-3.5 bg-white border border-[#D1D1CF] max-h-32 overflow-y-auto text-[10px] font-mono text-[#555] whitespace-pre-wrap leading-relaxed custom-scrollbar">
              {filledPrompt}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
