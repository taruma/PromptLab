"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface DiscardChangesConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
}

export default function DiscardChangesConfirmModal({
  isOpen,
  onClose,
  onDiscard,
}: DiscardChangesConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="discard-confirm-modal">
      <div className="bg-white border border-[#D1D1CF] w-full max-w-md flex flex-col justify-between shadow-2xl relative rounded-none animate-scale-up">
        
        {/* Modal Header */}
        <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider font-sans text-amber-700">
              Unsaved Changes Detected
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 bg-[#F4F4F2]/30 flex flex-col gap-4 text-xs leading-relaxed text-[#555]">
          <p className="font-medium text-[#1A1A1A]">
            You have edited your prompt configurations (System Instructions or Prompt Template) inside the editor. Closing now will discard these modifications completely.
          </p>
          <div className="bg-amber-50 border border-amber-200 p-3 text-[10px] text-amber-800 leading-normal border-l-4 border-l-amber-500 font-mono uppercase font-black tracking-wider leading-snug">
            <span>⚠️ DISCARD IS COMPLETELY IRREVERSIBLE.</span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white text-[#1A1A1A]"
            >
              Keep Editing
            </button>
            <button
              onClick={onDiscard}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-amber-600"
            >
              Discard Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
