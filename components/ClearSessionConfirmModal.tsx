"use client";

import React from "react";
import { Trash2 } from "lucide-react";

interface ClearSessionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ClearSessionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: ClearSessionConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="clear-confirm-modal">
      <div className="bg-white border border-[#D1D1CF] w-full max-w-md flex flex-col justify-between shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-black uppercase tracking-wider font-sans text-red-600">
              Confirm Clear Session
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
          <p>
            Are you sure you want to clear your active session? This action will:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 font-mono text-[10px] text-[#1A1A1A] uppercase">
            <li>Clear all input values & parameters</li>
            <li>Remove all uploaded visual reference assets</li>
            <li>Erase current generation result and reasoning trace</li>
          </ul>
          <div className="bg-white border border-[#D1D1CF] p-3 text-[10px] text-amber-800 leading-normal border-l-4 border-l-amber-500">
            <span className="font-bold uppercase tracking-wider font-mono">Note:</span> Your customized System Prompts, Prompt Templates, and presets will remain completely intact.
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-red-600"
            >
              Clear Active Session
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
