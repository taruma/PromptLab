"use client";

import React, { useState, useMemo } from "react";
import Markdown from "react-markdown";
import { 
  FileText, 
  Code, 
  Braces, 
  Copy, 
  Check, 
  Maximize2, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clapperboard
} from "lucide-react";
import { HistoryTokenUsage } from "../../types/history";
import { HistoryFullscreenOutputModal } from "./HistoryFullscreenOutputModal";
import { isAuteurScript } from "@/lib/auteur-parser";
import AuteurScriptView from "@/components/AuteurScriptView";
import {
  extractCleanJson,
  highlightJsonLine,
  outputMarkdownComponents,
} from "@/lib/output-render-helpers";

export interface HistoryOutputViewerProps {
  output: string;
  thinkingResult?: string;
  slotId: string;
  title: string;
  tokenUsage?: HistoryTokenUsage;
  model?: string;
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

export const HistoryOutputViewer: React.FC<HistoryOutputViewerProps> = ({
  output,
  thinkingResult,
  slotId,
  title,
  tokenUsage,
  model,
}) => {
  const [viewMode, setViewMode] = useState<"formatted" | "raw" | "json" | "auteur">("raw");

  // Fast memoized detection for Auteur Script
  const isAuteurDetected = useMemo(() => isAuteurScript(output), [output]);

  // Only extract and format JSON lazily when JSON view mode is actively selected
  const cleanJson = useMemo(() => {
    if (viewMode !== "json") {
      return { parsed: null, formatted: "", isValid: false };
    }
    return extractCleanJson(output);
  }, [output, viewMode]);

  const [copied, setCopied] = useState(false);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const handleCopy = () => {
    if (!output) return;
    const jsonTarget = viewMode === "json" ? (cleanJson.isValid ? cleanJson : extractCleanJson(output)) : null;
    const textToCopy = jsonTarget?.isValid ? jsonTarget.formatted : output;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const charCount = output?.length || 0;
  const wordCount = output?.trim() ? output.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-3 border-t border-[#D1D1CF] pt-4" id="history-saved-output-section">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] uppercase tracking-wider text-[#888884] font-black font-mono">
            Saved Generation Output
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#888884] bg-[#FAF9F6] border border-[#D1D1CF] px-2 py-0.5">
            <span className="text-[#1A1A1A] font-bold">{charCount.toLocaleString()}</span>
            <span>CHARS</span>
            <span>•</span>
            <span className="text-[#1A1A1A] font-bold">{wordCount.toLocaleString()}</span>
            <span>WORDS</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-white border border-[#D1D1CF] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("formatted")}
              className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
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
              onClick={() => setViewMode("raw")}
              className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "raw"
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#888884] hover:text-[#1A1A1A]"
              }`}
              title="View raw monospace"
            >
              <Code className="w-2.5 h-2.5" />
              <span>RAW</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("json")}
              className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "json"
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#888884] hover:text-[#1A1A1A]"
              }`}
              title="View syntax-highlighted JSON"
            >
              <Braces className="w-2.5 h-2.5" />
              <span>JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("auteur")}
              className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "auteur"
                  ? "bg-[#1A1A1A] text-white"
                  : isAuteurDetected
                  ? "text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-300"
                  : "text-[#888884] hover:text-[#1A1A1A]"
              }`}
              title={isAuteurDetected ? "Auteur Script detected - Directorial visual view" : "View as Auteur Script"}
            >
              <Clapperboard className="w-2.5 h-2.5" />
              <span>AUTEUR</span>
              {isAuteurDetected && viewMode !== "auteur" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              )}
            </button>
          </div>

          {/* Fullscreen / Focus Mode Button */}
          <button
            type="button"
            onClick={() => setIsFullscreenOpen(true)}
            disabled={!output}
            className="px-2 py-1 bg-[#FAF9F6] hover:bg-white text-[#1A1A1A] border border-[#D1D1CF] text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Expand to distraction-free reading canvas"
          >
            <Maximize2 className="w-3 h-3 text-[#1A1A1A]" />
            <span className="hidden md:inline">Focus</span>
          </button>

          {/* Copy Output Button */}
          {output && (
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 bg-[#FAF9F6] hover:bg-white text-[#1A1A1A] border border-[#D1D1CF] text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              title="Copy output to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#1A1A1A]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Reasoning / Thinking Trace (if present) */}
      {thinkingResult && thinkingResult.trim() && (
        <div className="border border-amber-200 bg-amber-50/40 rounded-none overflow-hidden text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setIsReasoningOpen(!isReasoningOpen)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-amber-100/50 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-700 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-amber-900">
                Reasoning / Thinking Trace
              </span>
              {tokenUsage?.thoughtTokens && (
                <span className="text-[8px] text-amber-800 bg-amber-100/80 border border-amber-300 px-1.5 py-0.2">
                  {tokenUsage.thoughtTokens.toLocaleString()} thought tokens
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold text-amber-800">
              <span>{isReasoningOpen ? "Hide [-]" : "Inspect [+]"}</span>
              {isReasoningOpen ? (
                <ChevronDown className="w-3 h-3 text-amber-800" />
              ) : (
                <ChevronRight className="w-3 h-3 text-amber-800" />
              )}
            </div>
          </button>

          {isReasoningOpen && (
            <div className="border-t border-amber-200 p-3.5 bg-white/80 max-h-48 overflow-y-auto custom-scrollbar">
              <Markdown components={reasoningMarkdownComponents}>
                {thinkingResult}
              </Markdown>
            </div>
          )}
        </div>
      )}

      {/* JSON status indicator if viewMode === "json" */}
      {viewMode === "json" && output && (
        <div className="flex items-center justify-between text-[9px] font-mono px-2 py-1 bg-[#FAF9F6] border border-[#D1D1CF]">
          <div className="flex items-center gap-2">
            {cleanJson.isValid ? (
              <span className="text-emerald-800 flex items-center gap-1 font-bold uppercase">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid JSON
              </span>
            ) : (
              <span className="text-amber-800 flex items-center gap-1 font-bold uppercase">
                <AlertCircle className="w-3 h-3 text-amber-600" /> Unparsed / Non-standard JSON
              </span>
            )}
            <span className="text-[#888884]">
              {(cleanJson.formatted || output).split("\n").length} lines
            </span>
          </div>
        </div>
      )}

      {/* Main Reading Canvas */}
      <div className="bg-white border border-[#D1D1CF] p-5 max-h-[440px] overflow-y-auto custom-scrollbar shadow-inner">
        {output ? (
          viewMode === "formatted" ? (
            <div className="markdown-body font-serif text-xs leading-relaxed text-[#1A1A1A]">
              <Markdown components={outputMarkdownComponents}>
                {output}
              </Markdown>
            </div>
          ) : viewMode === "raw" ? (
            <pre className="font-mono text-xs leading-relaxed text-[#1A1A1A] whitespace-pre-wrap selection:bg-[#1A1A1A] selection:text-white">
              {output}
            </pre>
          ) : viewMode === "auteur" ? (
            <AuteurScriptView content={output} />
          ) : (
            <div className="bg-[#FAF9F6] border border-[#D1D1CF] p-3 overflow-x-auto text-xs font-mono leading-relaxed select-text custom-scrollbar">
              <div className="table w-full border-collapse">
                {(cleanJson.formatted || output).split("\n").map((line, idx) => {
                  const highlighted = highlightJsonLine(line, idx);
                  return (
                    <div key={`hov-ln-${idx}`} className="table-row hover:bg-[#F0F0ED]/70">
                      <span className="table-cell select-none pr-3 text-right text-[10px] text-[#A8A8A4] font-mono w-8 border-r border-[#EAEAE8] align-top py-0.5">
                        {idx + 1}
                      </span>
                      <span className="table-cell pl-3 align-top py-0.5 whitespace-pre font-mono">
                        {highlighted}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          <span className="italic text-[#888884] font-sans text-xs">
            No text output exists for this history slot.
          </span>
        )}
      </div>

      {/* Fullscreen Reading Modal */}
      {isFullscreenOpen && (
        <HistoryFullscreenOutputModal
          key={`${slotId}-${viewMode}`}
          isOpen={isFullscreenOpen}
          onClose={() => setIsFullscreenOpen(false)}
          output={output}
          title={title}
          slotId={slotId}
          model={model}
          tokenUsage={tokenUsage}
          initialViewMode={viewMode}
        />
      )}
    </div>
  );
};
