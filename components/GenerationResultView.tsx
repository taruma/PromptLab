"use client";

import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { FileText, Code, RefreshCw, Settings, ChevronDown, ChevronRight } from "lucide-react";

interface ReasoningSection {
  id: string;
  header?: string;
  content: string;
}

function parseThinkingSections(text: string): ReasoningSection[] {
  if (!text || !text.trim()) return [];

  const regex = /(?=(?:\n|^)(?:\*\*[^*]+\*\*|#{1,3}\s+[^\n]+|\[[A-Z0-9_\s-]+\]))/g;
  const rawBlocks = text.split(regex).map((b) => b.trim()).filter(Boolean);

  if (rawBlocks.length === 0) {
    return [{ id: "sec-0", content: text.trim() }];
  }

  return rawBlocks.map((block, idx) => {
    const headerMatch = block.match(/^(?:\*\*([^*]+)\*\*|#{1,3}\s+([^\n]+)|\[([A-Z0-9_\s-]+)\])/);
    if (headerMatch) {
      const header = (headerMatch[1] || headerMatch[2] || headerMatch[3] || "").trim();
      let content = block.replace(/^(?:\*\*[^*]+\*\*|#{1,3}\s+[^\n]+|\[[A-Z0-9_\s-]+\])/, "").trim();
      return {
        id: `section-${idx}-${header.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        header,
        content: content || block,
      };
    }
    return {
      id: `section-${idx}`,
      content: block,
    };
  });
}

const reasoningMarkdownComponents = {
  p: ({ children }: any) => (
    <p className="mb-2 leading-relaxed text-[#444] font-mono text-[11px] italic">
      {children}
    </p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold text-[#1A1A1A] font-sans text-[11px] not-italic bg-amber-100/80 px-1 py-0.5">
      {children}
    </strong>
  ),
  h1: ({ children }: any) => (
    <h1 className="text-[11px] font-bold font-sans uppercase tracking-wider text-[#1A1A1A] not-italic mt-2 mb-1 border-b border-[#D1D1CF] pb-0.5">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-[11px] font-bold font-sans uppercase tracking-wider text-[#1A1A1A] not-italic mt-2 mb-1">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-[10px] font-bold font-sans uppercase tracking-wider text-[#1A1A1A] not-italic mt-1.5 mb-1">
      {children}
    </h3>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside mb-2 space-y-0.5 font-mono text-[11px] italic text-[#444]">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside mb-2 space-y-0.5 font-mono text-[11px] italic text-[#444]">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="leading-relaxed font-mono text-[11px] italic inline-block w-full">
      {children}
    </li>
  ),
  code: ({ children }: any) => (
    <code className="bg-[#EAEAE8] border border-[#D1D1CF] px-1 py-0.5 font-mono text-[10px] text-[#1A1A1A] not-italic">
      {children}
    </code>
  ),
};

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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isReasoningCollapsed, setIsReasoningCollapsed] = useState<boolean>(false);

  const thinkingScrollRef = useRef<HTMLDivElement>(null);
  const prevResultLengthRef = useRef<number>(0);
  const prevIsThinkingRef = useRef<boolean>(false);

  // Parse thinking sections for active slideshow mode
  const sections = parseThinkingSections(thinkingResult);
  const activeSection = sections.length > 0 ? sections[sections.length - 1] : null;

  // Auto-scroll thinking trace container to bottom as new thinking content arrives
  useEffect(() => {
    if (thinkingScrollRef.current && !isReasoningCollapsed && !isThinking) {
      thinkingScrollRef.current.scrollTo({
        top: thinkingScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [thinkingResult, isReasoningCollapsed, isThinking]);

  // Auto-collapse reasoning trace when main output streams, and auto-expand on new generation
  useEffect(() => {
    // New generation started: expand reasoning trace so user sees thinking process
    if (isLoading && isThinking && !generationResult) {
      setTimeout(() => {
        setIsReasoningCollapsed(false);
      }, 0);
    }

    // Output starts streaming (length > 0) or thinking finishes while result exists -> auto-collapse
    if (
      (generationResult.length > 0 && prevResultLengthRef.current === 0) ||
      (prevIsThinkingRef.current && !isThinking && generationResult.length > 0)
    ) {
      setTimeout(() => {
        setIsReasoningCollapsed(true);
      }, 0);
    }

    prevResultLengthRef.current = generationResult.length;
    prevIsThinkingRef.current = isThinking;
  }, [isLoading, isThinking, generationResult]);

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

  // Load saved collapsed preference from localStorage
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem("prompt_generator_result_collapsed");
      if (savedCollapsed !== null) {
        setTimeout(() => {
          setIsCollapsed(savedCollapsed === "true");
        }, 0);
      }
    } catch (e) {
      console.error("Failed to load output collapsed preference:", e);
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

  // Toggle collapse state and save to localStorage
  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("prompt_generator_result_collapsed", String(next));
      } catch (e) {
        console.error("Failed to save output collapsed preference:", e);
      }
      return next;
    });
  };

  return (
    <section className={`flex-1 flex flex-col ${isCollapsed ? "min-h-0" : "min-h-[420px]"}`} id="output-panel">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex items-center gap-1 cursor-pointer select-none group"
            onClick={handleToggleCollapse}
            title={isCollapsed ? "Expand Generation Result" : "Collapse Generation Result"}
          >
            <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] group-hover:text-[#1A1A1A] font-bold transition-colors whitespace-nowrap">
              Generation Result
            </h2>
            <button
              type="button"
              className="text-[#888884] group-hover:text-[#1A1A1A] p-0.5 transition-colors cursor-pointer flex items-center justify-center"
              id="toggle-collapse-result-btn"
              aria-label={isCollapsed ? "Expand Generation Result" : "Collapse Generation Result"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Segmented View Mode Toggle */}
          <div
            className="flex items-center bg-white border border-[#D1D1CF] p-0.5"
            id="view-mode-toggle"
          >
            <button
              type="button"
              onClick={() => handleToggleViewMode("formatted")}
              className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "formatted"
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#888884] hover:text-[#1A1A1A]"
              }`}
              title="Render as formatted Markdown"
            >
              <FileText className="w-2.5 h-2.5" />
              <span>MD</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode("raw")}
              className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "raw"
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#888884] hover:text-[#1A1A1A]"
              }`}
              title="View as raw text in monospace font"
            >
              <Code className="w-2.5 h-2.5" />
              <span>Raw</span>
            </button>
          </div>

          {generationResult && (
            <button
              type="button"
              onClick={handleCopyOutput}
              className={`px-2.5 py-1 border text-[9px] uppercase font-bold tracking-widest transition-all cursor-pointer flex items-center gap-1 ${
                copied
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-[#1A1A1A] text-white border-[#1A1A1A] hover:bg-black"
              }`}
              id="copy-btn"
            >
              {copied ? (
                <span>Copied!</span>
              ) : (
                <span>Copy</span>
              )}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Error Message */}
          {error && (
            <div className="p-4 mb-4 bg-white border-l-4 border-red-500 border-y border-r border-[#D1D1CF] text-xs text-red-600 flex items-start gap-2">
              <span className="font-bold">{"// Error:"}</span>
              <span>{error}</span>
            </div>
          )}

          {/* Model Thinking / Reasoning Box */}
          {(thinkingResult || (isLoading && isThinking)) && (
            <div className="mb-4 transition-all" id="thinking-process-block">
              {/* Header / Toggle bar */}
              <div
                onClick={() => setIsReasoningCollapsed(!isReasoningCollapsed)}
                className="flex items-center justify-between cursor-pointer select-none bg-[#EAEAE8] hover:bg-[#E2E2E0] border border-[#D1D1CF] px-3.5 py-2 transition-colors group"
                title={isReasoningCollapsed ? "Expand Reasoning Trace" : "Collapse Reasoning Trace"}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-[#1A1A1A] p-0.5 transition-transform cursor-pointer"
                    aria-label={isReasoningCollapsed ? "Expand Reasoning Trace" : "Collapse Reasoning Trace"}
                  >
                    {isReasoningCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isThinking ? "bg-amber-500 animate-pulse" : "bg-emerald-600"
                    } inline-block`}
                  />
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#1A1A1A]">
                    Engine Reasoning Trace
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                    isThinking ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-stone-200 text-stone-700 border border-stone-300"
                  }`}>
                    {isThinking ? "PROCESSING" : "COMPLETED"}
                  </span>
                </div>
              </div>

              {/* Collapsible Content */}
              {!isReasoningCollapsed && (
                <div>
                  {isThinking ? (
                    /* Active Streaming Slideshow Card */
                    <div className="bg-[#FAFAF9] border-x border-b border-[#D1D1CF] p-3.5">
                      {activeSection ? (
                        <div
                          key={activeSection.id || sections.length}
                          className="animate-slide-fade-in"
                        >
                          <div className="flex items-center justify-between border-b border-[#EAEAE8] pb-1.5 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span className="text-[10px] font-bold font-sans uppercase tracking-wider text-[#1A1A1A] bg-amber-100/80 px-1.5 py-0.5 border border-amber-300">
                                {activeSection.header || `Reasoning Phase ${sections.length}`}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-[#888884] uppercase font-bold tracking-widest bg-[#EAEAE8] px-1.5 py-0.5">
                              STEP {sections.length}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono italic text-[#444] leading-relaxed">
                            <Markdown components={reasoningMarkdownComponents}>
                              {activeSection.content}
                            </Markdown>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 italic text-[#888884] py-2 font-mono text-xs">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                          <span>Engine is formulating reasoning path...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Completed Full Log Textbox & Scroll */
                    <div className="bg-[#FAFAF9] border-x border-b border-[#D1D1CF] p-3.5">
                      <div
                        ref={thinkingScrollRef}
                        className="text-[11px] font-mono italic text-[#444] leading-relaxed max-h-[180px] overflow-y-auto custom-scrollbar pr-1"
                      >
                        <Markdown components={reasoningMarkdownComponents}>
                          {thinkingResult}
                        </Markdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
        </>
      )}

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
