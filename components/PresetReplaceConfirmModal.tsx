"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export interface PresetItemBasic {
  id: string;
  name: string;
  systemPrompt: string;
  promptTemplate: string;
}

interface PresetReplaceConfirmModalProps {
  isOpen: boolean;
  currentPresetName: string | null;
  targetPreset: PresetItemBasic | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PresetReplaceConfirmModal({
  isOpen,
  currentPresetName,
  targetPreset,
  onClose,
  onConfirm,
}: PresetReplaceConfirmModalProps) {
  if (!isOpen || !targetPreset) return null;

  return (
    <div
      className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in"
      id="preset-replace-confirm-modal"
    >
      <div className="bg-white border border-[#D1D1CF] w-full max-w-md flex flex-col justify-between shadow-2xl relative rounded-none animate-scale-up">
        {/* Modal Header */}
        <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider font-sans text-amber-800">
              Replace Unsaved Prompt Edits?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 bg-[#F4F4F2]/30 flex flex-col gap-4 text-xs leading-relaxed text-[#555]">
          <p className="font-medium text-[#1A1A1A]">
            You have unsaved edits on your current preset
            {currentPresetName ? (
              <span className="font-bold text-amber-900 ml-1">
                ({currentPresetName} <span className="font-mono text-[9px] bg-amber-200 text-amber-800 px-1 py-0.5">[EDIT]</span>)
              </span>
            ) : (
              " workspace"
            )}
            .
          </p>

          <p className="text-[#333]">
            Switching to <span className="font-bold text-[#1A1A1A] uppercase font-mono">{targetPreset.name}</span> will replace your active System Instructions and Prompt Template with the selected preset&apos;s default content.
          </p>

          <div className="bg-amber-50 border border-amber-200 p-3 text-[10px] text-amber-800 border-l-4 border-l-amber-500 font-mono uppercase font-bold tracking-wider leading-snug">
            <span>⚠️ YOUR UNSAVED PROMPT EDITS WILL BE OVERWRITTEN.</span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white text-[#1A1A1A]"
            >
              Keep My Edits
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-amber-600 font-mono"
            >
              Replace Prompts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
