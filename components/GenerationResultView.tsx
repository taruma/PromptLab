"use client";

import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { FileText, Code, RefreshCw, Settings, ChevronDown, ChevronRight, Copy, Check, Braces, Lock, CheckCircle2, X } from "lucide-react";

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

import { calculateEstimatedCost } from "@/lib/pricing";

export interface TokenUsage {
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
  cachedTokens?: number;
  thoughtTokens?: number;
}

function extractCleanJson(raw: string): { parsed: any | null; formatted: string; isValid: boolean } {
  if (!raw || !raw.trim()) {
    return { parsed: null, formatted: "", isValid: false };
  }

  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  try {
    const parsed = JSON.parse(text);
    return {
      parsed,
      formatted: JSON.stringify(parsed, null, 2),
      isValid: true,
    };
  } catch {
    return {
      parsed: null,
      formatted: text,
      isValid: false,
    };
  }
}

function highlightJsonLine(line: string, lineIndex: number): React.ReactNode[] {
  // Matches:
  // 1. Property key (string with colon): "key":
  // 2. String literal: "..."
  // 3. Booleans: true / false
  // 4. Null: null
  // 5. Numbers: integers, decimals, negatives, exponentials
  // 6. Structural delimiters & punctuation: { } [ ] , :
  const regex = /("(?:\\[\s\S]|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:])/g;

  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      result.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `tok-${lineIndex}-${match.index}`;

    if (token.endsWith(":")) {
      const colonIdx = token.lastIndexOf(":");
      const keyText = token.slice(0, colonIdx);
      const colonText = token.slice(colonIdx);
      result.push(
        <span key={key} className="text-[#1A1A1A] font-semibold">
          {keyText}
        </span>
      );
      result.push(
        <span key={`${key}-col`} className="text-[#888884]">
          {colonText}
        </span>
      );
    } else if (token.startsWith('"')) {
      result.push(
        <span key={key} className="text-teal-800 font-normal">
          {token}
        </span>
      );
    } else if (token === "true" || token === "false") {
      result.push(
        <span key={key} className="text-indigo-800 font-medium">
          {token}
        </span>
      );
    } else if (token === "null") {
      result.push(
        <span key={key} className="text-stone-500 italic">
          {token}
        </span>
      );
    } else if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token)) {
      result.push(
        <span key={key} className="text-amber-800 font-medium">
          {token}
        </span>
      );
    } else if (/[{}[\],:]/.test(token)) {
      result.push(
        <span key={key} className="text-[#78716C]">
          {token}
        </span>
      );
    } else {
      result.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    result.push(line.slice(lastIndex));
  }

  return result;
}

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
  tokenUsage?: TokenUsage | null;
  selectedModel?: string;
  isStructuredOutput?: boolean;
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
  tokenUsage,
  selectedModel = "gemini-3.6-flash",
  isStructuredOutput = false,
}: GenerationResultViewProps) {
  const [userViewMode, setUserViewMode] = useState<"formatted" | "raw" | "json">("formatted");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isReasoningCollapsed, setIsReasoningCollapsed] = useState<boolean>(false);

  const [isCostPopoverOpen, setIsCostPopoverOpen] = useState<boolean>(false);
  const costPopoverRef = useRef<HTMLDivElement>(null);

  // Close cost breakdown popover on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (costPopoverRef.current && !costPopoverRef.current.contains(e.target as Node)) {
        setIsCostPopoverOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCostPopoverOpen(false);
      }
    };
    if (isCostPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCostPopoverOpen]);

  // When structured output is active, viewMode is locked to "json"
  const viewMode = isStructuredOutput ? "json" : userViewMode;

  const thinkingScrollRef = useRef<HTMLDivElement>(null);
  const prevResultLengthRef = useRef<number>(0);
  const prevIsThinkingRef = useRef<boolean>(false);

  // Parse thinking sections for active slideshow mode
  const sections = parseThinkingSections(thinkingResult);
  const activeSection = sections.length > 0 ? sections[sections.length - 1] : null;

  // Extract clean formatted JSON
  const cleanJson = extractCleanJson(generationResult);

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
      if (savedMode === "formatted" || savedMode === "raw" || savedMode === "json") {
        setTimeout(() => {
          setUserViewMode(savedMode as "formatted" | "raw" | "json");
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
  const handleToggleViewMode = (mode: "formatted" | "raw" | "json") => {
    if (isStructuredOutput) return;
    setUserViewMode(mode);
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

          {generationResult ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="bg-[#EAEAE8] border border-[#D1D1CF] px-1.5 py-0.5 text-[8px] font-mono font-bold text-[#1A1A1A] uppercase tracking-wider shrink-0"
                id="output-char-count"
              >
                {generationResult.length.toLocaleString()} CHARS
              </span>
              {!isLoading && tokenUsage ? (() => {
                const cost = calculateEstimatedCost(selectedModel, tokenUsage);
                if (!cost) return null;
                const b = cost.breakdown;
                return (
                  <div
                    ref={costPopoverRef}
                    className="relative inline-block"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCostPopoverOpen(prev => !prev);
                      }}
                      className={`border px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer transition-colors select-none ${
                        isCostPopoverOpen
                          ? "bg-emerald-200 text-emerald-950 border-emerald-400"
                          : "bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300"
                      }`}
                      id="output-cost-estimate"
                      title={isCostPopoverOpen ? "Click to close cost breakdown" : "Click to view cost breakdown"}
                      aria-expanded={isCostPopoverOpen}
                      aria-haspopup="dialog"
                    >
                      <span>{cost.formattedTotalCost}</span>
                      <span className="text-[7px] text-emerald-700 opacity-70">ⓘ</span>
                    </button>

                    {isCostPopoverOpen && b && (
                      <div
                        className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-[#D1D1CF] shadow-xl p-3 font-mono text-[9px] min-w-[300px] max-w-[340px] text-[#1A1A1A] animate-in fade-in zoom-in-95 duration-100 select-text"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-[#D1D1CF] pb-1.5 mb-2">
                          <span className="font-bold uppercase tracking-wider text-[#1A1A1A] text-[9px]">
                            Cost Breakdown
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] bg-[#EAEAE8] border border-[#D1D1CF] px-1 py-0.2 text-[#555] uppercase font-bold">
                              {cost.modelName}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsCostPopoverOpen(false)}
                              className="text-[#888884] hover:text-[#1A1A1A] p-0.5 hover:bg-[#EAEAE8] transition-colors cursor-pointer"
                              title="Close cost breakdown"
                              aria-label="Close cost breakdown"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Line items table */}
                        <div className="space-y-1.5">
                          {/* Uncached Input */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="font-bold text-[#1A1A1A]">Prompt Input</span>
                              <span className="text-[8px] text-[#888884]">
                                {b.uncachedPromptTokens.toLocaleString()} tok @ ${b.inputPricePer1M.toFixed(2)}/1M
                              </span>
                            </div>
                            <span className="font-bold text-[#1A1A1A] tabular-nums">
                              {b.formattedUncachedInputCost}
                            </span>
                          </div>

                          {/* Context Cache (if cached tokens > 0) */}
                          {b.cachedTokens > 0 && (
                            <div className="flex items-start justify-between gap-2 bg-emerald-50/70 border border-emerald-200/80 p-1 -mx-1">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-emerald-950">Context Cache</span>
                                  <span className="text-[7px] bg-emerald-200/90 text-emerald-900 px-1 py-0.2 uppercase font-bold tracking-tight">
                                    Saved {b.formattedCacheSavings}
                                  </span>
                                </div>
                                <span className="text-[8px] text-emerald-800">
                                  {b.cachedTokens.toLocaleString()} tok @ ${b.cachedBasePricePer1M.toFixed(3)}/1M
                                </span>
                              </div>
                              <span className="font-bold text-emerald-900 tabular-nums">
                                {b.formattedCachedInputCost}
                              </span>
                            </div>
                          )}

                          {/* Candidate Output */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="font-bold text-[#1A1A1A]">Output Response</span>
                              <span className="text-[8px] text-[#888884]">
                                {b.candidateTokens.toLocaleString()} tok @ ${b.outputPricePer1M.toFixed(2)}/1M
                              </span>
                            </div>
                            <span className="font-bold text-[#1A1A1A] tabular-nums">
                              {b.formattedCandidateCost}
                            </span>
                          </div>

                          {/* Thinking / Thoughts (if thoughtTokens > 0) */}
                          {b.thoughtTokens > 0 && (
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col">
                                <span className="font-bold text-[#1A1A1A]">Reasoning Thoughts</span>
                                <span className="text-[8px] text-[#888884]">
                                  {b.thoughtTokens.toLocaleString()} tok @ ${b.outputPricePer1M.toFixed(2)}/1M
                                </span>
                              </div>
                              <span className="font-bold text-[#1A1A1A] tabular-nums">
                                {b.formattedThoughtCost}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Grand Total */}
                        <div className="border-t border-[#D1D1CF] mt-2.5 pt-2 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-bold text-[10px] uppercase tracking-wider text-[#1A1A1A]">
                              Total Estimated
                            </span>
                            <span className="text-[8px] text-[#888884]">
                              {b.totalTokens.toLocaleString()} total tokens
                            </span>
                          </div>
                          <span className="font-black text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 tabular-nums">
                            {b.formattedTotalCost}
                          </span>
                        </div>

                        {/* Footer footnote */}
                        <div className="mt-2 text-[7px] text-[#888884] border-t border-[#EAEAE8] pt-1.5 flex items-center justify-between">
                          <span>Standard Gemini API Rates</span>
                          <span>Includes Thoughts & Cache</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })() : null}
            </div>
          ) : null}
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
              disabled={isStructuredOutput}
              className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                isStructuredOutput
                  ? "opacity-35 cursor-not-allowed text-[#888884]"
                  : viewMode === "formatted"
                  ? "bg-[#1A1A1A] text-white cursor-pointer"
                  : "text-[#888884] hover:text-[#1A1A1A] cursor-pointer"
              }`}
              title={isStructuredOutput ? "Locked to JSON mode by Engine Settings" : "Render as formatted Markdown"}
            >
              <FileText className="w-2.5 h-2.5" />
              <span>MD</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode("raw")}
              disabled={isStructuredOutput}
              className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                isStructuredOutput
                  ? "opacity-35 cursor-not-allowed text-[#888884]"
                  : viewMode === "raw"
                  ? "bg-[#1A1A1A] text-white cursor-pointer"
                  : "text-[#888884] hover:text-[#1A1A1A] cursor-pointer"
              }`}
              title={isStructuredOutput ? "Locked to JSON mode by Engine Settings" : "View as raw text in monospace font"}
            >
              <Code className="w-2.5 h-2.5" />
              <span>Raw</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode("json")}
              className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                isStructuredOutput
                  ? "bg-emerald-700 text-white border border-emerald-600 shadow-xs cursor-default"
                  : viewMode === "json"
                  ? "bg-[#1A1A1A] text-white cursor-pointer"
                  : "text-[#888884] hover:text-[#1A1A1A] cursor-pointer"
              }`}
              title={isStructuredOutput ? "Structured JSON mode active (Locked)" : "View formatted JSON"}
            >
              {isStructuredOutput ? (
                <Lock className="w-2 h-2 text-emerald-200 shrink-0" />
              ) : (
                <Braces className="w-2.5 h-2.5" />
              )}
              <span>JSON</span>
            </button>
          </div>

          {generationResult && (
            <button
              type="button"
              onClick={handleCopyOutput}
              className={`px-2 text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 h-[22px] border ${
                copied
                  ? "bg-[#10B981] text-white border-[#10B981]"
                  : "bg-[#1A1A1A] text-white border-[#1A1A1A] hover:bg-[#333333]"
              }`}
              id="copy-btn"
            >
              {copied ? (
                <>
                  <Check className="w-2.5 h-2.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-2.5 h-2.5" />
                  <span>Copy</span>
                </>
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
                    ) : viewMode === "json" ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between pb-2 border-b border-[#D1D1CF]/40">
                          <div className="flex items-center gap-1.5 font-mono text-[9px]">
                            {cleanJson.isValid ? (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 font-bold uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Valid JSON
                              </span>
                            ) : (
                              <span className="text-amber-700 bg-amber-50 border border-amber-300 px-1.5 py-0.5 font-bold uppercase flex items-center gap-1">
                                {isLoading ? "Streaming JSON..." : "Raw / Unparsed JSON"}
                              </span>
                            )}
                            {isStructuredOutput && (
                              <span className="text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-1.5 py-0.5 font-bold uppercase flex items-center gap-1">
                                <Lock className="w-2 h-2" /> Structured Mode
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="bg-[#FAFAF9] border border-[#D1D1CF] p-3 overflow-x-auto text-[11px] md:text-xs font-mono leading-relaxed select-text custom-scrollbar">
                          <div className="table w-full border-collapse">
                            {(cleanJson.formatted || generationResult).split("\n").map((line, idx) => {
                              const highlighted = highlightJsonLine(line, idx);
                              return (
                                <div key={idx} className="table-row leading-5 hover:bg-[#F0F0EE]/60 transition-colors">
                                  <span className="table-cell select-none text-right pr-3.5 pl-0.5 text-[10px] font-mono text-[#888884]/60 border-r border-[#D1D1CF]/40 min-w-[28px] align-top">
                                    {idx + 1}
                                  </span>
                                  <span className="table-cell pl-3.5 whitespace-pre font-mono align-top text-[#1A1A1A]">
                                    {highlighted.length > 0 ? highlighted : "\u00A0"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
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
                    VIEW: {viewMode === "formatted" ? "FORMATTED MARKDOWN" : viewMode === "raw" ? "RAW MONOSPACE" : isStructuredOutput ? "STRUCTURED JSON (LOCKED)" : "JSON VIEW"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {isLoading && !isThinking && (
                      <span className="flex items-center gap-1 text-[8px] text-emerald-600 font-bold uppercase tracking-wider font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        Streaming...
                      </span>
                    )}
                    <span>
                      {tokenUsage && (tokenUsage.totalTokens !== undefined || tokenUsage.promptTokens !== undefined) ? (() => {
                        const prompt = tokenUsage.promptTokens ?? 0;
                        const candidates = tokenUsage.candidatesTokens ?? 0;
                        const total = tokenUsage.totalTokens ?? (prompt + candidates);
                        const thoughts = tokenUsage.thoughtTokens !== undefined
                          ? tokenUsage.thoughtTokens
                          : Math.max(0, total - prompt - candidates);

                        return (
                          <span>
                            TOKENS: {tokenUsage.totalTokens?.toLocaleString() ?? "-"} ({tokenUsage.promptTokens?.toLocaleString() ?? "-"} IN{tokenUsage.cachedTokens ? ` [${tokenUsage.cachedTokens.toLocaleString()} CACHED]` : ""} / {tokenUsage.candidatesTokens?.toLocaleString() ?? "-"} OUT{thoughts > 0 ? ` + ${thoughts.toLocaleString()} THOUGHTS` : ""})
                          </span>
                        );
                      })() : (
                        "PromptLab Output"
                      )}
                    </span>
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
