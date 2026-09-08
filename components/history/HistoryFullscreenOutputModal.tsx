"use client";

import React, { useState, useEffect, useMemo } from "react";
import Markdown from "react-markdown";
import { 
  FileText, 
  Code, 
  Braces, 
  Copy, 
  Check, 
  CheckCircle2,
  AlertCircle,
  Clapperboard
} from "lucide-react";
import { useModalEscape } from "../../hooks/use-modal-stack";
import { HistoryTokenUsage } from "../../types/history";
import { isAuteurScript } from "@/lib/auteur-parser";
import AuteurScriptView from "@/components/AuteurScriptView";
import { extractCleanJson, highlightJsonLine } from "@/lib/output-render-helpers";

export interface HistoryFullscreenOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  output: string;
  title: string;
  slotId: string;
  model?: string;
  tokenUsage?: HistoryTokenUsage;
  initialViewMode?: "formatted" | "raw" | "json" | "auteur";
}

export const HistoryFullscreenOutputModal: React.FC<HistoryFullscreenOutputModalProps> = ({
  isOpen,
  onClose,
  output,
  title,
  slotId,
  tokenUsage,
  initialViewMode = "raw",
}) => {
  useModalEscape(isOpen, onClose);

  const cleanJson = useMemo(() => extractCleanJson(output), [output]);
  const isAuteurDetected = useMemo(() => isAuteurScript(output), [output]);

  const [viewMode, setViewMode] = useState<"formatted" | "raw" | "json" | "auteur">(() => initialViewMode);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!output) return;
    const textToCopy = viewMode === "json" && cleanJson.isValid ? cleanJson.formatted : output;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const charCount = output.length;
  const wordCount = output.trim() ? output.trim().split(/\s+/).length : 0;

  return (
    <div
      className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      id="fullscreen-output-modal-backdrop"
    >
      <div
        className="bg-white border border-[#D1D1CF] w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl rounded-none overflow-hidden"
        id="fullscreen-output-modal-box"
      >
        {/* Top Control Bar */}
        <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0 gap-4">
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A] bg-white border border-[#D1D1CF] px-2 py-0.5 shrink-0">
              #{slotId}
            </span>
            <h3 className="text-xs font-black uppercase tracking-tight text-[#1A1A1A] truncate">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Metrics Chips */}
            <div className="hidden sm:flex items-center gap-2 font-mono text-[9px] text-[#888884]">
              <span>{charCount.toLocaleString()} CHARS</span>
              <span>•</span>
              <span>{wordCount.toLocaleString()} WORDS</span>
              {tokenUsage?.totalTokens && (
                <>
                  <span>•</span>
                  <span className="text-[#1A1A1A] font-bold">
                    {tokenUsage.totalTokens.toLocaleString()} TOKENS
                  </span>
                </>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-white border border-[#D1D1CF] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("formatted")}
                className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "formatted"
                    ? "bg-[#1A1A1A] text-white"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
                title="Render formatted Markdown"
              >
                <FileText className="w-3 h-3" />
                <span>MD</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "raw"
                    ? "bg-[#1A1A1A] text-white"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
                title="View raw monospace"
              >
                <Code className="w-3 h-3" />
                <span>RAW</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("json")}
                className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "json"
                    ? "bg-[#1A1A1A] text-white"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
                title="View syntax-highlighted JSON"
              >
                <Braces className="w-3 h-3" />
                <span>JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("auteur")}
                className={`px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "auteur"
                    ? "bg-[#1A1A1A] text-white"
                    : isAuteurDetected
                    ? "text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-300"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
                title={isAuteurDetected ? "Auteur Script detected - Directorial visual view" : "View as Auteur Script"}
              >
                <Clapperboard className="w-3 h-3" />
                <span>AUTEUR</span>
                {isAuteurDetected && viewMode !== "auteur" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                )}
              </button>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#FAF9F6] hover:bg-white text-[#1A1A1A] border border-[#D1D1CF] text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
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

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-[#888884] hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer ml-1"
              title="Close focus reading view [Esc]"
            >
              [ESC] CLOSE
            </button>
          </div>
        </div>

        {/* JSON Status Banner if in JSON mode */}
        {viewMode === "json" && (
          <div className="px-6 py-1.5 bg-[#FAF9F6] border-b border-[#D1D1CF] flex items-center justify-between text-[9px] font-mono">
            <div className="flex items-center gap-2">
              {cleanJson.isValid ? (
                <span className="text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 font-bold uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Valid JSON
                </span>
              ) : (
                <span className="text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 font-bold uppercase flex items-center gap-1">
                  <AlertCircle className="w-2.5 h-2.5" /> Unparsed / Non-standard JSON
                </span>
              )}
              <span className="text-[#888884]">
                {(cleanJson.formatted || output).split("\n").length} lines
              </span>
            </div>
          </div>
        )}

        {/* Reading Canvas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 bg-white">
          <div className="max-w-4xl mx-auto min-h-full">
            {viewMode === "formatted" ? (
              <div className="markdown-body font-serif leading-relaxed text-[#1A1A1A]">
                <Markdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl font-black uppercase tracking-wider mt-6 mb-3 pb-2 border-b border-[#D1D1CF] font-sans text-[#1A1A1A]">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold uppercase tracking-wider mt-5 mb-2.5 font-sans text-[#1A1A1A]">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-bold uppercase tracking-wider mt-4 mb-2 font-sans text-[#1A1A1A]">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-xs font-bold uppercase tracking-wider mt-3 mb-1.5 font-sans text-[#1A1A1A]">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 leading-relaxed text-sm text-[#1A1A1A]">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-4 space-y-1.5 text-sm pl-2">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-4 space-y-1.5 text-sm pl-2">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed text-sm inline-block w-full">
                        {children}
                      </li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-[#1A1A1A] pl-4 my-4 italic text-stone-700 bg-[#F4F4F2] py-2.5 pr-3 text-sm">
                        {children}
                      </blockquote>
                    ),
                    code: ({ className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || "");
                      return match ? (
                        <pre className="bg-[#F4F4F2] border border-[#D1D1CF] p-4 my-4 font-mono text-xs overflow-x-auto text-[#1A1A1A] whitespace-pre">
                          <code>{children}</code>
                        </pre>
                      ) : (
                        <code
                          className="bg-[#F4F4F2] border border-[#D1D1CF] px-1.5 py-0.5 font-mono text-xs text-[#1A1A1A]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    hr: () => <hr className="my-5 border-[#D1D1CF]" />,
                    strong: ({ children }) => (
                      <strong className="font-bold text-[#1A1A1A] font-sans">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                  }}
                >
                  {output}
                </Markdown>
              </div>
            ) : viewMode === "raw" ? (
              <pre className="font-mono text-xs leading-relaxed text-[#1A1A1A] whitespace-pre-wrap bg-[#FAF9F6] border border-[#D1D1CF] p-6 selection:bg-[#1A1A1A] selection:text-white">
                {output}
              </pre>
            ) : viewMode === "auteur" ? (
              <AuteurScriptView content={output} />
            ) : (
              <div className="bg-[#FAF9F6] border border-[#D1D1CF] p-4 overflow-x-auto text-xs font-mono leading-relaxed select-text custom-scrollbar">
                <div className="table w-full border-collapse">
                  {(cleanJson.formatted || output).split("\n").map((line, idx) => {
                    const highlighted = highlightJsonLine(line, idx);
                    return (
                      <div key={`fs-ln-${idx}`} className="table-row hover:bg-[#F0F0ED]/70">
                        <span className="table-cell select-none pr-4 text-right text-[10px] text-[#A8A8A4] font-mono w-10 border-r border-[#EAEAE8] align-top py-0.5">
                          {idx + 1}
                        </span>
                        <span className="table-cell pl-4 align-top py-0.5 whitespace-pre font-mono">
                          {highlighted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
