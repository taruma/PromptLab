"use client";

import React, { useState, useMemo } from "react";
import Markdown from "react-markdown";
import {
  FileText,
  Code,
  Braces,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clapperboard,
  Copy,
  Check,
} from "lucide-react";
import { isAuteurScript } from "@/lib/auteur-parser";
import AuteurScriptView from "@/components/AuteurScriptView";
import {
  extractCleanJson,
  highlightJsonLine,
  outputMarkdownComponents,
  type OutputViewMode,
} from "@/lib/output-render-helpers";

export interface MultiModeOutputViewProps {
  content: string;
  viewMode?: OutputViewMode;
  onViewModeChange?: (mode: OutputViewMode) => void;
  defaultViewMode?: OutputViewMode;
  isStructuredOutput?: boolean;
  showToolbar?: boolean;
  showStats?: boolean;
  showCopyButton?: boolean;
  toolbarExtraLeft?: React.ReactNode;
  toolbarExtraRight?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
  contentClassName?: string;
}

export default function MultiModeOutputView({
  content,
  viewMode: controlledViewMode,
  onViewModeChange,
  defaultViewMode = "formatted",
  isStructuredOutput = false,
  showToolbar = true,
  showStats = true,
  showCopyButton = true,
  toolbarExtraLeft,
  toolbarExtraRight,
  emptyMessage = "No output content to render. Type or paste text to preview.",
  className = "",
  contentClassName = "",
}: MultiModeOutputViewProps) {
  const [internalViewMode, setInternalViewMode] = useState<OutputViewMode>(defaultViewMode);
  const [copied, setCopied] = useState(false);

  // Active view mode resolution (controlled vs internal, locked if structured output is true)
  const resolvedMode = isStructuredOutput
    ? "json"
    : controlledViewMode !== undefined
    ? controlledViewMode
    : internalViewMode;

  const handleModeChange = (mode: OutputViewMode) => {
    if (isStructuredOutput && mode !== "json") return;
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  // Fast memoized detection for Auteur Script
  const isAuteurDetected = useMemo(() => isAuteurScript(content), [content]);

  // Clean formatted JSON
  const cleanJson = useMemo(() => {
    if (!content) return { parsed: null, formatted: "", isValid: false };
    return extractCleanJson(content);
  }, [content]);

  const handleCopy = () => {
    if (!content) return;
    const textToCopy =
      resolvedMode === "json" && cleanJson.isValid ? cleanJson.formatted : content;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const charCount = content?.length || 0;
  const wordCount = content?.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content ? content.split("\n").length : 0;

  return (
    <div className={`flex flex-col h-full bg-white ${className}`} id="multi-mode-output-view">
      {/* Optional Toolbar Header */}
      {showToolbar && (
        <div className="h-9 px-4 border-b border-[#D1D1CF] bg-[#FAF9F6] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {toolbarExtraLeft}

            {showStats && (
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#888884]">
                <span className="text-[#1A1A1A] font-bold">{charCount.toLocaleString()}</span>
                <span>CHARS</span>
                <span>•</span>
                <span className="text-[#1A1A1A] font-bold">{lineCount.toLocaleString()}</span>
                <span>LINES</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {toolbarExtraRight}

            {/* Segmented View Mode Toggle */}
            <div
              className="flex items-center bg-white border border-[#D1D1CF] p-0.5"
              id="multi-mode-view-toggle"
            >
              {/* MD Button */}
              <button
                type="button"
                onClick={() => handleModeChange("formatted")}
                disabled={isStructuredOutput}
                className={`px-2 py-0.5 text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  isStructuredOutput
                    ? "opacity-35 cursor-not-allowed text-[#888884]"
                    : resolvedMode === "formatted"
                    ? "bg-[#1A1A1A] text-white cursor-pointer"
                    : "text-[#888884] hover:text-[#1A1A1A] cursor-pointer"
                }`}
                title={isStructuredOutput ? "Locked to JSON mode by Engine Settings" : "Render as formatted Markdown"}
              >
                <FileText className="w-2.5 h-2.5" />
                <span>MD</span>
              </button>

              {/* Raw Button */}
              <button
                type="button"
                onClick={() => handleModeChange("raw")}
                disabled={isStructuredOutput}
                className={`px-2 py-0.5 text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  isStructuredOutput
                    ? "opacity-35 cursor-not-allowed text-[#888884]"
                    : resolvedMode === "raw"
                    ? "bg-[#1A1A1A] text-white cursor-pointer"
                    : "text-[#888884] hover:text-[#1A1A1A] cursor-pointer"
                }`}
                title={isStructuredOutput ? "Locked to JSON mode by Engine Settings" : "View as raw text in monospace"}
              >
                <Code className="w-2.5 h-2.5" />
                <span>Raw</span>
              </button>

              {/* JSON Button */}
              <button
                type="button"
                onClick={() => handleModeChange("json")}
                className={`px-2 py-0.5 text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  isStructuredOutput
                    ? "bg-emerald-700 text-white border border-emerald-600 shadow-xs cursor-default"
                    : resolvedMode === "json"
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

              {/* Auteur Button */}
              <button
                type="button"
                onClick={() => handleModeChange("auteur")}
                disabled={isStructuredOutput}
                className={`px-2 py-0.5 text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  isStructuredOutput
                    ? "opacity-35 cursor-not-allowed text-[#888884]"
                    : resolvedMode === "auteur"
                    ? "bg-[#1A1A1A] text-white cursor-pointer"
                    : isAuteurDetected
                    ? "text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 hover:text-emerald-900 cursor-pointer border border-emerald-300"
                    : "text-[#888884] hover:text-[#1A1A1A] cursor-pointer"
                }`}
                title={
                  isStructuredOutput
                    ? "Locked to JSON mode by Engine Settings"
                    : isAuteurDetected
                    ? "Auteur Script detected - Directorial visual view"
                    : "View as Auteur Script"
                }
              >
                <Clapperboard className="w-2.5 h-2.5" />
                <span>Auteur</span>
                {isAuteurDetected && resolvedMode !== "auteur" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                )}
              </button>
            </div>

            {/* Quick Copy Button */}
            {showCopyButton && (
              <button
                type="button"
                onClick={handleCopy}
                disabled={!content}
                className={`h-[22px] px-2 text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border disabled:opacity-40 disabled:cursor-not-allowed ${
                  copied
                    ? "bg-[#10B981] text-white border-[#10B981]"
                    : "bg-[#1A1A1A] text-white border-[#1A1A1A] hover:bg-[#333333]"
                }`}
                title="Copy output text to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-2.5 h-2.5" />
                    <span>Copied</span>
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
      )}

      {/* Main Content Area */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar ${contentClassName}`}>
        {!content || !content.trim() ? (
          <div className="h-full min-h-[200px] flex items-center justify-center text-center p-6 text-[#A8A8A4]">
            <p className="text-xs font-mono italic max-w-md">{emptyMessage}</p>
          </div>
        ) : resolvedMode === "formatted" ? (
          <div className="markdown-body">
            <Markdown components={outputMarkdownComponents}>{content}</Markdown>
          </div>
        ) : resolvedMode === "json" ? (
          <div className="flex flex-col gap-2">
            {/* JSON Validation Ribbon */}
            <div className="flex items-center justify-between pb-2 border-b border-[#D1D1CF]/60">
              <div className="flex items-center gap-1.5 font-mono text-[9px]">
                {cleanJson.isValid ? (
                  <span className="text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-bold uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Valid JSON
                  </span>
                ) : (
                  <span className="text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 font-bold uppercase flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 text-amber-600" /> Raw / Unparsed JSON
                  </span>
                )}
                {isStructuredOutput && (
                  <span className="text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 font-bold uppercase flex items-center gap-1">
                    <Lock className="w-2 h-2" /> Structured Mode
                  </span>
                )}
              </div>
            </div>

            {/* Line-Numbered Syntax Highlight Table */}
            <div className="bg-[#FAFAF9] border border-[#D1D1CF] p-3 overflow-x-auto text-[11px] md:text-xs font-mono leading-relaxed select-text custom-scrollbar">
              <div className="table w-full border-collapse">
                {(cleanJson.formatted || content).split("\n").map((line, idx) => {
                  const highlighted = highlightJsonLine(line, idx);
                  return (
                    <div key={idx} className="table-row leading-5 hover:bg-[#F0F0EE]/60 transition-colors">
                      <span className="table-cell select-none text-right pr-3.5 pl-0.5 text-[10px] font-mono text-[#888884]/60 border-r border-[#D1D1CF]/40 min-w-[32px] align-top">
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
        ) : resolvedMode === "auteur" ? (
          <AuteurScriptView content={content} />
        ) : (
          /* Raw Monospace View */
          <pre className="text-[11px] md:text-xs font-mono leading-relaxed text-[#1A1A1A] whitespace-pre-wrap font-normal select-text">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
