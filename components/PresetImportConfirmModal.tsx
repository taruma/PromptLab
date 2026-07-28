"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw, Layers, CheckCircle2, AlertCircle, Copy, RefreshCcw, ChevronDown, ChevronRight } from "lucide-react";
import { type UrlPresetData } from "../hooks/use-url-preset-import";

export interface PresetImportConfirmModalProps {
  isOpen: boolean;
  urlPresetData: UrlPresetData | null;
  urlImportPending: boolean;
  urlImportError: string | null;
  urlImportSuccessMsg: string | null;
  applyToWorkspace: boolean;
  onSetApplyToWorkspace: (val: boolean) => void;
  importStrategy: "duplicate" | "replace";
  onSetImportStrategy: (strategy: "duplicate" | "replace") => void;
  onApply: () => void;
  onCancel: () => void;
  onDismissError: () => void;
  onDismissSuccess: () => void;
}

export default function PresetImportConfirmModal({
  isOpen,
  urlPresetData,
  urlImportPending,
  urlImportError,
  urlImportSuccessMsg,
  applyToWorkspace,
  onSetApplyToWorkspace,
  importStrategy,
  onSetImportStrategy,
  onApply,
  onCancel,
  onDismissError,
  onDismissSuccess,
}: PresetImportConfirmModalProps) {
  const importResult = urlPresetData?.importResult;
  const importedCount = importResult?.importedCount ?? 0;
  const replacedCount = importResult?.replacedCount ?? 0;
  const skippedCount = importResult?.skippedCount ?? 0;
  const totalCount = importedCount + replacedCount + skippedCount;

  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set([0]));

  const processedItems = importResult?.processedItems || [];
  const itemsToShow = processedItems.length > 0
    ? processedItems
    : urlPresetData?.targetPreset
      ? [{ preset: urlPresetData.targetPreset, action: (importStrategy === "replace" && replacedCount > 0 ? "replaced" : "imported") as "imported" | "replaced" }]
      : [];

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <>
      {/* URL Preset Import Confirmation Modal */}
      {isOpen && urlPresetData && (
        <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="url-import-confirm-modal">
          <div className="bg-white border border-[#D1D1CF] w-full max-w-lg flex flex-col justify-between shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="h-12 border-b border-[#D1D1CF] px-4 flex items-center justify-between bg-[#F4F4F2] shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider font-sans text-[#1A1A1A]">
                  Preset Import Confirmation
                </h3>
              </div>
              <button
                onClick={onCancel}
                className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 bg-[#F4F4F2]/30 flex flex-col gap-3 text-xs leading-relaxed text-[#555]">
              
              {/* Unified Preset Meta Box */}
              <div className="bg-white border border-[#D1D1CF] p-3 flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#888884] font-mono">
                    Import Preset
                  </span>
                  <h4 className="text-sm font-black uppercase tracking-tight text-[#1A1A1A] truncate mt-0.5">
                    {urlPresetData.name}
                  </h4>
                  <span className="text-[9px] font-mono text-[#888884] truncate mt-0.5" title={urlPresetData.url}>
                    {urlPresetData.url.startsWith("http") ? `Source: ${urlPresetData.url}` : urlPresetData.url}
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="px-2 py-1 bg-[#F4F4F2] border border-[#D1D1CF] text-[9px] font-mono font-bold text-[#1A1A1A] uppercase tracking-wider">
                    {totalCount} {totalCount === 1 ? "Item" : "Items"}
                  </span>
                </div>
              </div>

              {/* Strategy Selector (Compact Segmented Tabs) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#888884] font-mono flex items-center gap-1">
                    <Copy className="w-3 h-3 text-[#1A1A1A]" /> Duplicate / Replace Strategy:
                  </span>
                  <span className="text-[9px] font-mono text-[#888884]">
                    {importStrategy === "duplicate" ? "Safety copy preserved" : "Overwrites matching ID"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-[#EAEAE8] p-1 border border-[#D1D1CF]">
                  <button
                    type="button"
                    onClick={() => onSetImportStrategy("duplicate")}
                    className={`py-1.5 px-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      importStrategy === "duplicate"
                        ? "bg-white text-[#1A1A1A] shadow-xs border border-[#D1D1CF]"
                        : "text-[#666] hover:text-[#1A1A1A]"
                    }`}
                  >
                    <Copy className="w-3 h-3 text-emerald-600" /> Create Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetImportStrategy("replace")}
                    className={`py-1.5 px-2 text-center text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      importStrategy === "replace"
                        ? "bg-amber-50 text-amber-900 shadow-xs border border-amber-300"
                        : "text-[#666] hover:text-[#1A1A1A]"
                    }`}
                  >
                    <RefreshCcw className="w-3 h-3 text-amber-600" /> Replace Existing
                  </button>
                </div>
              </div>

              {/* Summary Breakdown Line */}
              <div className="grid grid-cols-4 gap-1 text-center font-mono">
                <div className="bg-white border border-[#D1D1CF] px-1.5 py-1 flex flex-col justify-center">
                  <span className="text-[7.5px] text-[#888884] uppercase tracking-wider">Detected</span>
                  <span className="text-xs font-black text-[#1A1A1A]">{totalCount}</span>
                </div>
                <div className="bg-emerald-50/80 border border-emerald-200 px-1.5 py-1 flex flex-col justify-center">
                  <span className="text-[7.5px] text-emerald-800 uppercase tracking-wider">New</span>
                  <span className="text-xs font-black text-emerald-700">+{importedCount}</span>
                </div>
                <div className={`border px-1.5 py-1 flex flex-col justify-center ${
                  importStrategy === "replace" && replacedCount > 0 ? "bg-amber-50 border-amber-300" : "bg-white border-[#D1D1CF]"
                }`}>
                  <span className={`text-[7.5px] uppercase tracking-wider ${importStrategy === "replace" && replacedCount > 0 ? "text-amber-800" : "text-[#888884]"}`}>Replaced</span>
                  <span className={`text-xs font-black ${importStrategy === "replace" && replacedCount > 0 ? "text-amber-800" : "text-[#1A1A1A]"}`}>{replacedCount}</span>
                </div>
                <div className={`border px-1.5 py-1 flex flex-col justify-center ${
                  skippedCount > 0 ? "bg-stone-100 border-stone-300" : "bg-white border-[#D1D1CF]"
                }`}>
                  <span className={`text-[7.5px] uppercase tracking-wider ${skippedCount > 0 ? "text-stone-700 font-bold" : "text-[#888884]"}`}>Skipped</span>
                  <span className={`text-xs font-black ${skippedCount > 0 ? "text-stone-700" : "text-[#1A1A1A]"}`}>{skippedCount}</span>
                </div>
              </div>

              {/* Included Presets Scrollable List */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#888884] font-mono">
                    Included Presets ({itemsToShow.length})
                  </span>
                  {itemsToShow.length > 1 && (
                    <span className="text-[8px] font-mono text-[#888884]">
                      Click item to inspect
                    </span>
                  )}
                </div>
                <div className="bg-white border border-[#D1D1CF] p-1.5 flex flex-col gap-1 max-h-36 overflow-y-auto font-mono text-[9.5px]">
                  {itemsToShow.length > 0 ? (
                    itemsToShow.map((item, idx) => {
                      const isExpanded = expandedIndices.has(idx);
                      const isSkipped = item.action === "skipped";
                      const isReplacement = item.action === "replaced";
                      
                      let badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300";
                      let badgeLabel = "New";
                      if (isSkipped) {
                        badgeStyle = "bg-stone-200 text-stone-700 border-stone-300";
                        badgeLabel = "Skipped";
                      } else if (isReplacement) {
                        badgeStyle = "bg-amber-100 text-amber-900 border-amber-300";
                        badgeLabel = "Replace";
                      }

                      return (
                        <div
                          key={item.preset.id || idx}
                          className={`border transition-all ${
                            isSkipped
                              ? "border-stone-200 bg-stone-50/70"
                              : "border-[#EAEAE8] bg-[#F4F4F2]/50 hover:bg-[#F4F4F2]"
                          }`}
                        >
                          <div
                            onClick={() => toggleExpand(idx)}
                            className="p-1.5 flex items-center justify-between cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 pr-2">
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-[#888884] shrink-0" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-[#888884] shrink-0" />
                              )}
                              <span className={`font-bold uppercase tracking-tight truncate ${isSkipped ? "text-[#666]" : "text-[#1A1A1A]"}`}>
                                {item.preset.name || "Untitled Preset"}
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider border shrink-0 ${badgeStyle}`}>
                              {badgeLabel}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="p-2 border-t border-[#EAEAE8] bg-white flex flex-col gap-1 text-[9px] text-[#555] leading-relaxed">
                              {isSkipped && (
                                <p className="text-[8.5px] font-mono text-stone-600 bg-stone-100 p-1 border border-stone-200 font-bold mb-0.5">
                                  {item.skipReason === "exact_match"
                                    ? "• Identical preset already present in library."
                                    : "• Identical name & prompt content already present in library."}
                                </p>
                              )}
                              {item.preset.systemPrompt && (
                                <p className="line-clamp-2">
                                  <strong className="text-[#1A1A1A]">System:</strong> {item.preset.systemPrompt}
                                </p>
                              )}
                              {item.preset.promptTemplate && (
                                <p className="line-clamp-2">
                                  <strong className="text-[#1A1A1A]">Template:</strong> {item.preset.promptTemplate}
                                </p>
                              )}
                              {!item.preset.systemPrompt && !item.preset.promptTemplate && (
                                <span className="italic text-[#888884]">Empty prompt contents</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[9px] text-[#888884] italic p-1">No preset records preview available.</span>
                  )}
                </div>
              </div>

              {/* Active Workspace Option Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white p-2.5 border border-[#D1D1CF] hover:border-[#1A1A1A] transition-all">
                <input
                  type="checkbox"
                  checked={applyToWorkspace}
                  onChange={(e) => onSetApplyToWorkspace(e.target.checked)}
                  className="accent-[#1A1A1A] w-3.5 h-3.5 cursor-pointer shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-tight">
                    Apply as Active Workspace Prompt
                  </span>
                  <span className="text-[8.5px] text-[#888884] font-mono uppercase">
                    Loads this preset into your active workspace System Prompt and Prompt Template editors
                  </span>
                </div>
              </label>

            </div>

            {/* Modal Footer Controls */}
            <div className="h-14 border-t border-[#D1D1CF] px-4 flex items-center justify-between bg-[#F4F4F2] shrink-0">
              <span className="text-[9px] font-mono text-[#888884] uppercase">
                {importedCount === 0 && replacedCount === 0 && skippedCount > 0
                  ? `All ${skippedCount} item(s) already present (skipped)`
                  : importStrategy === "replace"
                  ? `${replacedCount > 0 ? `${replacedCount} replace` : "Ready"}${importedCount > 0 ? `, ${importedCount} new` : ""}${skippedCount > 0 ? `, ${skippedCount} skipped` : ""}`
                  : `${importedCount > 0 ? `${importedCount} new item(s)` : "No new items"}${skippedCount > 0 ? `, ${skippedCount} skipped` : ""}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white text-[#1A1A1A]"
                >
                  Cancel
                </button>
                <button
                  onClick={onApply}
                  className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A]"
                >
                  {importStrategy === "replace"
                    ? (applyToWorkspace ? "Replace & Apply" : "Replace in Library")
                    : (applyToWorkspace ? "Import & Apply" : "Import to Library")}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* URL Preset Import Loading Indicator */}
      {urlImportPending && (
        <div className="fixed inset-0 bg-[#1a1a1a]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D1D1CF] p-6 shadow-xl flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin text-[#888884]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#1A1A1A]">
              Fetching Remote Preset...
            </span>
          </div>
        </div>
      )}

      {/* URL Import Error Dialog */}
      {urlImportError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-red-200 shadow-2xl p-4 flex flex-col gap-2 animate-fade-in" id="url-import-error-toast">
          <div className="flex items-center justify-between border-b border-red-100 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1.5 font-sans">
              <AlertCircle className="w-3.5 h-3.5" /> Import Failed
            </span>
            <button 
              onClick={onDismissError}
              className="text-stone-400 hover:text-[#1A1A1A] font-mono text-[9px] font-bold uppercase"
            >
              [Dismiss]
            </button>
          </div>
          <p className="text-[11px] text-[#555] leading-relaxed">
            {urlImportError}
          </p>
          <p className="text-[9px] text-[#888884] font-mono uppercase">
            Check the URL query parameters or server configuration
          </p>
        </div>
      )}

      {/* URL Import Success Toast */}
      {urlImportSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-emerald-200 shadow-2xl p-4 flex flex-col gap-1.5 animate-fade-in" id="url-import-success-toast">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 font-sans">
              [✓] Preset Applied
            </span>
            <button 
              onClick={onDismissSuccess}
              className="text-stone-400 hover:text-[#1A1A1A] font-mono text-[9px] font-bold uppercase"
            >
              [Dismiss]
            </button>
          </div>
          <p className="text-[11px] text-[#1A1A1A] font-medium leading-relaxed">
            {urlImportSuccessMsg}
          </p>
        </div>
      )}
    </>
  );
}
