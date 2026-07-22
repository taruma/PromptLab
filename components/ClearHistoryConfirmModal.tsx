"use client";

import React from "react";
import { Trash2, Star } from "lucide-react";
import { HistoryItem } from "./HistorySection";

interface ClearHistoryConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearUnfavorited: () => void;
  onClearAll: () => void;
}

export default function ClearHistoryConfirmModal({
  isOpen,
  onClose,
  history,
  onClearUnfavorited,
  onClearAll,
}: ClearHistoryConfirmModalProps) {
  if (!isOpen) return null;

  const favCount = history.filter((h) => h.isFavorite).length;
  const nonFavCount = history.length - favCount;

  return (
    <div
      className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      id="clear-history-confirm-modal"
    >
      <div className="bg-white border border-[#D1D1CF] w-full max-w-lg flex flex-col justify-between shadow-2xl relative">
        {/* Modal Header */}
        <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2]">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-black uppercase tracking-wider font-sans text-red-600">
              Confirm Clear History
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
        {favCount > 0 ? (
          <>
            <div className="p-6 bg-[#F4F4F2]/30 flex flex-col gap-4 text-xs leading-relaxed text-[#555]">
              <div className="bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-3 text-amber-900">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold uppercase font-mono text-[10px] text-amber-900">
                    {favCount} Favorited Record{favCount > 1 ? "s" : ""} Found
                  </span>
                  <span className="text-[10px] text-amber-800 leading-relaxed font-sans">
                    You have <strong className="font-bold">{favCount} favorited item{favCount > 1 ? "s" : ""}</strong> stored in your history ({history.length} total items). Choose how you would like to proceed:
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 font-mono text-[10px]">
                <div className="border border-[#D1D1CF] bg-white p-3 flex flex-col gap-1">
                  <span className="font-bold uppercase text-[#1A1A1A] flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    Option 1: Keep Favorites & Clear Others (Recommended)
                  </span>
                  <span className="text-[#888884] text-[9px] leading-snug">
                    Deletes {nonFavCount} regular history slot{nonFavCount === 1 ? "" : "s"} while retaining all {favCount} favorited record{favCount === 1 ? "" : "s"} and their image assets.
                  </span>
                </div>
                <div className="border border-[#D1D1CF] bg-white p-3 flex flex-col gap-1">
                  <span className="font-bold uppercase text-red-600 flex items-center gap-1.5">
                    <Trash2 className="w-3 h-3 text-red-600" />
                    Option 2: Clear Everything Including Favorites
                  </span>
                  <span className="text-[#888884] text-[9px] leading-snug">
                    Permanently purges all {history.length} record{history.length === 1 ? "" : "s"} (favorites included) and cleans up all history image blobs in IndexedDB.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] gap-3">
              <button
                onClick={onClose}
                className="px-3.5 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white text-[#1A1A1A]"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClearAll();
                    onClose();
                  }}
                  className="px-3.5 py-2 border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Clear Everything
                </button>
                <button
                  onClick={() => {
                    onClearUnfavorited();
                    onClose();
                  }}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A] flex items-center gap-1.5 shadow-sm"
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  Keep Favorites ({favCount})
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 bg-[#F4F4F2]/30 flex flex-col gap-4 text-xs leading-relaxed text-[#555]">
              <p>
                Are you sure you want to clear all {history.length} item{history.length === 1 ? "" : "s"} in your local session history? This action will:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-1.5 font-mono text-[10px] text-[#1A1A1A] uppercase">
                <li>Delete all saved history items</li>
                <li>Permanently purge all history-referenced image files from IndexedDB</li>
                <li>Free up local browser storage</li>
              </ul>
              <div className="bg-white border border-[#D1D1CF] p-3 text-[10px] text-amber-800 leading-normal border-l-4 border-l-amber-500">
                <span className="font-bold uppercase tracking-wider font-mono">Warning:</span> This operation is completely irreversible.
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
                    onClearAll();
                    onClose();
                  }}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-red-600"
                >
                  Clear All History ({history.length})
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
