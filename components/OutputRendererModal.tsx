"use client";

import React, { useState, useRef } from "react";
import { Eye, X, Sparkles, RotateCcw, Camera, Loader2, Check } from "lucide-react";
import { useModalEscape } from "@/hooks/use-modal-stack";
import MultiModeOutputView from "@/components/MultiModeOutputView";
import { isAuteurScript } from "@/lib/auteur-parser";
import { extractCleanJson, type OutputViewMode } from "@/lib/output-render-helpers";
import { exportElementToPng } from "@/lib/image-export";

export interface OutputRendererModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGenerationResult?: string;
  projectName?: string;
}

const DRAFT_STORAGE_KEY = "prompt_generator_output_renderer_draft";

export default function OutputRendererModal({
  isOpen,
  onClose,
  activeGenerationResult = "",
  projectName,
}: OutputRendererModalProps) {
  // Default is empty unless a persisted draft exists in localStorage
  const [rawText, setRawText] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (saved !== null) {
          return saved;
        }
      } catch (e) {
        console.error("Failed to read output renderer draft", e);
      }
    }
    return "";
  });

  const [activeMobileTab, setActiveMobileTab] = useState<"source" | "preview">("source");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<OutputViewMode | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Wire into PromptLab's standard LIFO Escape stack
  useModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  const rawCharCount = rawText.length;
  const rawLineCount = rawText ? rawText.split("\n").length : 0;

  // Format detection
  const isAuteur = isAuteurScript(rawText);
  const jsonCheck = extractCleanJson(rawText);
  const isJson = jsonCheck.isValid;
  const effectiveMode: OutputViewMode = viewMode || (isAuteur ? "auteur" : isJson ? "json" : "formatted");

  const updateText = (newText: string) => {
    setRawText(newText);
    try {
      if (newText) {
        localStorage.setItem(DRAFT_STORAGE_KEY, newText);
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save output renderer draft", e);
    }
  };

  const handleLoadCurrent = () => {
    if (activeGenerationResult) {
      updateText(activeGenerationResult);
    }
  };

  const handleClear = () => {
    updateText("");
  };

  const handleExportPng = async () => {
    if (!contentRef.current || !rawText.trim() || isExporting) return;
    try {
      setIsExporting(true);
      await exportElementToPng(contentRef.current, {
        projectName,
        viewMode: effectiveMode,
        pixelRatio: 2,
        backgroundColor: "#FFFFFF",
        padding: 24,
      });
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to export PNG screenshot", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 animate-fade-in"
      id="output-renderer-modal"
    >
      <div className="bg-white border border-[#D1D1CF] w-full max-w-[95vw] xl:max-w-7xl h-[88vh] flex flex-col shadow-2xl relative rounded-none overflow-hidden">
        {/* Sleek Modal Header */}
        <div className="h-12 border-b border-[#D1D1CF] px-4 sm:px-5 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-[#1A1A1A]" />
            <span className="text-xs font-black uppercase tracking-wider font-sans text-[#1A1A1A]">
              Output Renderer
            </span>

            {/* Subtle Format Detection Pill */}
            {rawText.trim() && (
              <span className="text-[9px] font-mono uppercase font-bold tracking-wider">
                {isAuteur ? (
                  <span className="text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    AUTEUR
                  </span>
                ) : isJson ? (
                  <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5">
                    JSON
                  </span>
                ) : null}
              </span>
            )}
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {/* Mobile Tab Toggle */}
            <div className="flex lg:hidden items-center border border-[#D1D1CF] p-0.5 bg-[#FAF9F6]">
              <button
                type="button"
                onClick={() => setActiveMobileTab("source")}
                className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase transition-all ${
                  activeMobileTab === "source"
                    ? "bg-[#1A1A1A] text-white"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
              >
                Source
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab("preview")}
                className={`px-2 py-0.5 text-[8px] font-mono font-bold uppercase transition-all ${
                  activeMobileTab === "preview"
                    ? "bg-[#1A1A1A] text-white"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
              >
                Preview
              </button>
            </div>

            {/* Load from Workspace */}
            {activeGenerationResult && (
              <button
                type="button"
                onClick={handleLoadCurrent}
                className="h-7 px-2 sm:px-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Load active workspace generation output"
              >
                <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="hidden sm:inline">Workspace</span>
              </button>
            )}

            {/* Clear Input */}
            {rawText && (
              <button
                type="button"
                onClick={handleClear}
                className="h-7 px-2 text-[9px] font-mono font-bold uppercase tracking-wider text-[#888884] hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1"
                title="Clear text"
              >
                <RotateCcw className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#888884] hover:text-[#1A1A1A] px-2 py-1 transition-colors cursor-pointer flex items-center gap-1 ml-1"
              title="Close [Esc]"
              id="close-output-renderer-btn"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">[ESC]</span>
            </button>
          </div>
        </div>

        {/* Split Panes */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#D1D1CF] overflow-hidden min-h-0 bg-white">
          {/* Left Pane: Source Editor */}
          <div
            className={`flex flex-col h-full min-h-0 bg-white ${
              activeMobileTab === "preview" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Source Header */}
            <div className="h-9 px-4 border-b border-[#D1D1CF] bg-[#FAF9F6] flex items-center justify-between shrink-0">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#888884]">
                Source
              </span>
              <span className="text-[9px] font-mono text-[#888884]">
                {rawLineCount} lines · {rawCharCount.toLocaleString()} chars
              </span>
            </div>

            {/* Full-bleed Editor Textarea */}
            <textarea
              value={rawText}
              onChange={(e) => updateText(e.target.value)}
              placeholder="Paste or type text, Markdown, JSON, or Auteur Script..."
              className="w-full h-full p-4 font-mono text-xs leading-relaxed bg-white border-0 outline-none resize-none select-text custom-scrollbar text-[#1A1A1A] placeholder:text-[#A8A8A4] placeholder:font-mono focus:ring-0"
              spellCheck={false}
              autoFocus
              id="output-renderer-raw-textarea"
            />
          </div>

          {/* Right Pane: Live Render Output */}
          <div
            className={`flex flex-col h-full min-h-0 bg-white ${
              activeMobileTab === "source" ? "hidden lg:flex" : "flex"
            }`}
          >
            <MultiModeOutputView
              content={rawText}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              defaultViewMode={isAuteur ? "auteur" : isJson ? "json" : "formatted"}
              showToolbar={true}
              showStats={false}
              showCopyButton={true}
              contentContainerRef={contentRef}
              toolbarExtraLeft={
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#888884]">
                  Preview
                </span>
              }
              toolbarExtraRight={
                <button
                  type="button"
                  onClick={handleExportPng}
                  disabled={!rawText.trim() || isExporting}
                  className={`h-[22px] px-2 text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border disabled:opacity-40 disabled:cursor-not-allowed ${
                    exportSuccess
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : isExporting
                      ? "bg-[#FAF9F6] text-[#888884] border-[#D1D1CF] cursor-wait"
                      : "bg-[#FAF9F6] text-[#1A1A1A] border-[#D1D1CF] hover:bg-[#EAEAE8] hover:border-[#1A1A1A]"
                  }`}
                  title="Export full output as uncompressed PNG screenshot"
                  id="output-renderer-export-png-btn"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : exportSuccess ? (
                    <>
                      <Check className="w-2.5 h-2.5" />
                      <span>Saved PNG</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-2.5 h-2.5 text-[#1A1A1A]" />
                      <span>PNG</span>
                    </>
                  )}
                </button>
              }
              emptyMessage="Enter or paste text on the left to preview formatted output."
              className="h-full"
              contentClassName="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
