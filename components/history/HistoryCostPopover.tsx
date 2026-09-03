"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { HistoryItem } from "../../types/history";
import { calculateEstimatedCost } from "../../lib/pricing";

export interface HistoryCostPopoverProps {
  selectedItem: HistoryItem;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  align: "left" | "right";
  setAlign: (align: "left" | "right") => void;
}

export const HistoryCostPopover: React.FC<HistoryCostPopoverProps> = ({
  selectedItem,
  isOpen,
  onToggle,
  onClose,
  align,
  setAlign,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close cost breakdown popover on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  const historyModel = selectedItem.model || "gemini-3.8-flash";
  const costData = selectedItem.tokenUsage
    ? calculateEstimatedCost(historyModel, selectedItem.tokenUsage)
    : null;
  const displayCost = selectedItem.estimatedCost || costData?.formattedTotalCost;
  const b = costData?.breakdown;

  if (!displayCost) return null;

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!b) return;

    if (!isOpen && containerRef.current) {
      const buttonRect = containerRef.current.getBoundingClientRect();
      const scrollContainer = containerRef.current.closest(".overflow-y-auto");
      const containerRect = scrollContainer?.getBoundingClientRect();
      if (containerRect) {
        const spaceRight = containerRect.right - buttonRect.left;
        const spaceLeft = buttonRect.right - containerRect.left;
        if (spaceRight < 340 && spaceLeft >= 300) {
          setAlign("right");
        } else if (spaceLeft < 340 && spaceRight >= 300) {
          setAlign("left");
        } else {
          setAlign("right");
        }
      }
    }
    onToggle();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleButtonClick}
        className={`flex items-center gap-1.5 px-2 py-0.5 border text-emerald-900 transition-colors select-none ${
          b ? "cursor-pointer" : "cursor-default"
        } ${
          isOpen
            ? "bg-emerald-200 text-emerald-950 border-emerald-400 ring-1 ring-emerald-400"
            : "bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
        }`}
        title={
          b
            ? (isOpen ? "Click to close cost breakdown" : "Click to view complete cost breakdown")
            : `Cost: ${displayCost}`
        }
        aria-expanded={isOpen}
        aria-haspopup={b ? "dialog" : undefined}
      >
        <span className="text-[8px] text-emerald-700 uppercase font-bold">Cost</span>
        <span className="font-extrabold text-[9px]">
          {displayCost}
        </span>
        {b && (
          <span className="text-[7px] text-emerald-700 opacity-70">ⓘ</span>
        )}
      </button>

      {isOpen && b && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full mt-1.5 z-[70] bg-white border border-[#D1D1CF] shadow-xl p-3 font-mono text-[9px] min-w-[280px] sm:min-w-[300px] max-w-[calc(100vw-3rem)] sm:max-w-[340px] text-[#1A1A1A] animate-in fade-in zoom-in-95 duration-100 select-text`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#D1D1CF] pb-1.5 mb-2">
            <span className="font-bold uppercase tracking-wider text-[#1A1A1A] text-[9px]">
              Cost Breakdown
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] bg-[#EAEAE8] border border-[#D1D1CF] px-1 py-0.2 text-[#555] uppercase font-bold">
                {costData?.modelName || historyModel}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-[#888884] hover:text-[#1A1A1A] p-0.5 hover:bg-[#EAEAE8] transition-colors cursor-pointer"
                title="Close cost breakdown"
                aria-label="Close cost breakdown"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Line items table */}
          <div className="space-y-1.5">
            {/* Uncached Input */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-bold text-[#1A1A1A]">Prompt Input</span>
                <span className="text-[8px] text-[#888884]">
                  {b.uncachedPromptTokens.toLocaleString()} tok @ ${b.inputPricePer1M.toFixed(2)}/1M
                </span>
              </div>
              <span className="font-bold text-[#1A1A1A] tabular-nums">
                {b.formattedUncachedInputCost}
              </span>
            </div>

            {/* Context Cache (if cached tokens > 0) */}
            {b.cachedTokens > 0 && (
              <div className="flex items-start justify-between gap-2 bg-emerald-50/70 border border-emerald-200/80 p-1 -mx-1">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-emerald-950">Context Cache</span>
                    <span className="text-[7px] bg-emerald-200/90 text-emerald-900 px-1 py-0.2 uppercase font-bold tracking-tight">
                      Saved {b.formattedCacheSavings}
                    </span>
                  </div>
                  <span className="text-[8px] text-emerald-800">
                    {b.cachedTokens.toLocaleString()} tok @ ${b.cachedBasePricePer1M.toFixed(3)}/1M
                  </span>
                </div>
                <span className="font-bold text-emerald-900 tabular-nums">
                  {b.formattedCachedInputCost}
                </span>
              </div>
            )}

            {/* Candidate Output */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-bold text-[#1A1A1A]">Output Response</span>
                <span className="text-[8px] text-[#888884]">
                  {b.candidateTokens.toLocaleString()} tok @ ${b.outputPricePer1M.toFixed(2)}/1M
                </span>
              </div>
              <span className="font-bold text-[#1A1A1A] tabular-nums">
                {b.formattedCandidateCost}
              </span>
            </div>

            {/* Thinking / Thoughts (if thoughtTokens > 0) */}
            {b.thoughtTokens > 0 && (
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-bold text-[#1A1A1A]">Reasoning Thoughts</span>
                  <span className="text-[8px] text-[#888884]">
                    {b.thoughtTokens.toLocaleString()} tok @ ${b.outputPricePer1M.toFixed(2)}/1M
                  </span>
                </div>
                <span className="font-bold text-[#1A1A1A] tabular-nums">
                  {b.formattedThoughtCost}
                </span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="border-t border-[#D1D1CF] mt-2.5 pt-2 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-[10px] uppercase tracking-wider text-[#1A1A1A]">
                Total Estimated
              </span>
              <span className="text-[8px] text-[#888884]">
                {b.totalTokens.toLocaleString()} total tokens
              </span>
            </div>
            <span className="font-black text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 tabular-nums">
              {displayCost}
            </span>
          </div>

          {/* Footer footnote */}
          <div className="mt-2 text-[7px] text-[#888884] border-t border-[#EAEAE8] pt-1.5 flex items-center justify-between">
            <span>Standard Gemini API Rates</span>
            <span>Includes Thoughts & Cache</span>
          </div>
        </div>
      )}
    </div>
  );
};
