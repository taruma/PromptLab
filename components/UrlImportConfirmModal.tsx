"use client";

import React from "react";
import { Sparkles, RefreshCw, Layers, CheckCircle2, AlertCircle } from "lucide-react";
import { type UrlPresetData } from "../hooks/use-url-preset-import";

export interface UrlImportConfirmModalProps {
  isOpen: boolean;
  urlPresetData: UrlPresetData | null;
  urlImportPending: boolean;
  urlImportError: string | null;
  urlImportSuccessMsg: string | null;
  applyToWorkspace: boolean;
  onSetApplyToWorkspace: (val: boolean) => void;
  onApply: () => void;
  onCancel: () => void;
  onDismissError: () => void;
  onDismissSuccess: () => void;
}

export default function UrlImportConfirmModal({
  isOpen,
  urlPresetData,
  urlImportPending,
  urlImportError,
  urlImportSuccessMsg,
  applyToWorkspace,
  onSetApplyToWorkspace,
  onApply,
  onCancel,
  onDismissError,
  onDismissSuccess,
}: UrlImportConfirmModalProps) {
  const importResult = urlPresetData?.importResult;
  const importedCount = importResult?.importedCount ?? 0;
  const skippedCount = importResult?.skippedCount ?? 0;
  const totalCount = importedCount + skippedCount;

  return (
    <>
      {/* URL Preset Import Confirmation Modal */}
      {isOpen && urlPresetData && (
        <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="url-import-confirm-modal">
          <div className="bg-white border border-[#D1D1CF] w-full max-w-xl flex flex-col justify-between shadow-2xl relative max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider font-sans text-[#1A1A1A]">
                  Preset URL Import Detected
                </h3>
              </div>
              <button
                onClick={onCancel}
                className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                [ESC] CLOSE
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 bg-[#F4F4F2]/30 flex flex-col gap-5 text-xs leading-relaxed text-[#555] overflow-y-auto">
              
              {/* Preset File Meta */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#888884] font-mono">Preset Name / Title:</span>
                <span className="text-sm font-black uppercase tracking-tight text-[#1A1A1A]">
                  {urlPresetData.name}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#888884] font-mono">Source URL:</span>
                <div className="font-mono text-[9px] bg-white border border-[#D1D1CF] p-2.5 text-[#1A1A1A] break-all max-h-16 overflow-y-auto">
                  {urlPresetData.url}
                </div>
              </div>

              {/* Import Breakdown Stats Bar */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#888884] font-mono flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Merge & Import Breakdown:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white border border-[#D1D1CF] p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-mono font-black text-[#1A1A1A]">{totalCount}</span>
                    <span className="text-[8px] font-mono uppercase tracking-wider text-[#888884] mt-0.5">Found in URL</span>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-200 p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-mono font-black text-emerald-700">+{importedCount}</span>
                    <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-800/80 mt-0.5">New to Add</span>
                  </div>
                  <div className="bg-stone-50 border border-[#D1D1CF] p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-mono font-black text-stone-600">{skippedCount}</span>
                    <span className="text-[8px] font-mono uppercase tracking-wider text-stone-500 mt-0.5">Existing / Skipped</span>
                  </div>
                </div>
              </div>

              {/* Preset Preview Detail */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#888884] font-mono">
                  Preset Contents Preview:
                </span>
                <div className="bg-white border border-[#D1D1CF] p-3 flex flex-col gap-2 max-h-36 overflow-y-auto font-mono">
                  {urlPresetData.targetPreset ? (
                    <div className="flex flex-col gap-1.5 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1A1A1A] uppercase tracking-tight">
                          {urlPresetData.targetPreset.name}
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-bold uppercase tracking-wider border border-emerald-300">
                          {importedCount > 0 ? "New Preset" : "In Library"}
                        </span>
                      </div>
                      {urlPresetData.targetPreset.systemPrompt && (
                        <p className="text-[#666] text-[9px] line-clamp-2 leading-relaxed bg-[#F4F4F2] p-1.5 border border-[#EAEAE8]">
                          <strong className="text-[#1A1A1A]">System:</strong> {urlPresetData.targetPreset.systemPrompt.slice(0, 120)}...
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] text-[#888884] italic">Multiple preset records found in remote URL.</span>
                  )}
                </div>
              </div>

              {/* Informative Merge Banner */}
              <div className="bg-blue-50/70 border border-blue-200 p-3 text-[10px] text-blue-900 leading-relaxed border-l-4 border-l-blue-500 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase tracking-wider font-mono">Merge Notice:</span> This import will add the preset(s) into your custom preset library. Existing presets with different names will be safely preserved.
                </div>
              </div>

              {/* Options Toggle */}
              <div className="pt-2 border-t border-[#D1D1CF]/60 flex flex-col gap-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none bg-white p-3 border border-[#D1D1CF] hover:border-[#1A1A1A] transition-all">
                  <input
                    type="checkbox"
                    checked={applyToWorkspace}
                    onChange={(e) => onSetApplyToWorkspace(e.target.checked)}
                    className="mt-0.5 accent-[#1A1A1A] w-3.5 h-3.5 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-tight">
                      Apply as Active Workspace Prompt
                    </span>
                    <span className="text-[9px] text-[#888884] leading-normal font-mono uppercase mt-0.5">
                      Loads this preset into your active workspace System Prompt and Prompt Template editors immediately.
                    </span>
                  </div>
                </label>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
              <span className="text-[9px] font-mono text-[#888884] uppercase">
                {importedCount > 0 ? `${importedCount} new preset(s) ready` : "Preset already in library"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white"
                >
                  Cancel / Ignore
                </button>
                <button
                  onClick={onApply}
                  className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A]"
                >
                  {applyToWorkspace ? "Import & Apply Preset" : "Import To Library Only"}
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
