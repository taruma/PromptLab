"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { HistoryItem } from "./HistorySection";
import { truncateText } from "@/lib/utils";

interface DeleteHistoryConfirmModalProps {
  pendingDeleteId: string | null;
  history: HistoryItem[];
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export default function DeleteHistoryConfirmModal({
  pendingDeleteId,
  history,
  onClose,
  onConfirm,
}: DeleteHistoryConfirmModalProps) {
  if (!pendingDeleteId) return null;

  const itemToDelete = history.find((h) => h.id === pendingDeleteId);

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in" id="delete-history-item-confirm-modal">
      <div className="bg-white border border-[#D1D1CF] w-full max-w-md flex flex-col justify-between shadow-2xl relative rounded-none animate-scale-up">
        
        {/* Modal Header */}
        <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-black uppercase tracking-wider font-sans text-red-600">
              Confirm Delete Slot
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
            Are you sure you want to delete the history slot <strong className="text-[#1A1A1A] uppercase">“{truncateText(itemToDelete?.name || itemToDelete?.variables["idea"] || "Untitled Outline", 100)}”</strong>?
          </p>
          <div className="bg-red-50 border border-red-200 p-3.5 text-[10px] text-red-800 leading-normal border-l-4 border-l-red-500 font-mono uppercase tracking-wider font-black leading-snug">
            <span>⚠️ Warning: This will permanently delete this generation record and all its associated image assets from IndexedDB. This operation is completely irreversible.</span>
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
                onConfirm(pendingDeleteId);
                onClose();
              }}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-red-600"
            >
              Delete Record
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
