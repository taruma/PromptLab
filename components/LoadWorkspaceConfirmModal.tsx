"use client";

import React from "react";
import { FolderOpen } from "lucide-react";
import { HistoryItem } from "./HistorySection";
import { truncateText } from "@/lib/utils";

interface LoadWorkspaceConfirmModalProps {
  item: HistoryItem | null;
  onClose: () => void;
  onConfirm: (item: HistoryItem) => void;
}

export default function LoadWorkspaceConfirmModal({
  item,
  onClose,
  onConfirm,
}: LoadWorkspaceConfirmModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in" id="load-history-confirm-modal">
      <div className="bg-white border border-[#D1D1CF] w-full max-w-md flex flex-col justify-between shadow-2xl relative rounded-none animate-scale-up">
        
        {/* Modal Header */}
        <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-[#1A1A1A]" />
            <h3 className="text-xs font-black uppercase tracking-wider font-sans text-[#1A1A1A]">
              Confirm Load Workspace
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
            Are you sure you want to load the workspace preset <strong className="text-[#1A1A1A] uppercase">“{truncateText(item.name || item.variables["idea"] || "Untitled Outline", 100)}”</strong>? 
          </p>
          <p className="text-[#1A1A1A] font-bold">
            This action will overwrite your current active session, including:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 font-mono text-[10px] text-[#1A1A1A] uppercase">
            <li>All current text inputs & variable parameters</li>
            <li>All active visual reference cards & character maps</li>
            <li>The active generation result and reasoning logs</li>
          </ul>
          <div className="bg-white border border-[#D1D1CF] p-3 text-[10px] text-amber-800 leading-normal border-l-4 border-l-amber-500">
            <span className="font-bold uppercase tracking-wider font-mono">Note:</span> Your customized System Instructions, Prompt Templates, and saved custom presets will remain completely untouched.
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white text-[#1A1A1A]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm(item);
                onClose();
              }}
              className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A]"
            >
              Load Workspace
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
