"use client";

import React, { useState } from "react";
import { GitCompare } from "lucide-react";
import {
  computeLineDiff,
  alignDiffLines,
  type DiffLine,
  type SplitDiffRow,
} from "../lib/utils";

export interface PresetConfig {
  id: string;
  name: string;
  systemPrompt: string;
  promptTemplate: string;
}

export interface PresetCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparePreset: PresetConfig | null;
  tempSystemPrompt: string;
  tempPromptTemplate: string;
  onApplyPreset: (preset: PresetConfig) => void;
}

export function PresetCompareModal({
  isOpen,
  onClose,
  comparePreset,
  tempSystemPrompt,
  tempPromptTemplate,
  onApplyPreset,
}: PresetCompareModalProps) {
  const [compareTab, setCompareTab] = useState<"system" | "template">("system");
  const [showOnlyChanges, setShowOnlyChanges] = useState<boolean>(true);
  const [diffViewMode, setDiffViewMode] = useState<"unified" | "split">("split");

  if (!isOpen || !comparePreset) return null;

  const oldText = compareTab === "system" ? tempSystemPrompt : tempPromptTemplate;
  const newText = compareTab === "system" ? comparePreset.systemPrompt : comparePreset.promptTemplate;
  const diffLines = computeLineDiff(oldText, newText);

  const additionsCount = diffLines.filter((l) => l.type === "added").length;
  const deletionsCount = diffLines.filter((l) => l.type === "removed").length;
  const hasDifferences = additionsCount > 0 || deletionsCount > 0;

  // Compute Git-style context-aware lines to display for Unified view
  let displayLines: Array<
    | { type: "line"; line: DiffLine; index: number }
    | { type: "skipped"; count: number; startIndex: number; endIndex: number }
  > = [];

  if (showOnlyChanges && hasDifferences) {
    const contextWindow = 3; // Number of unchanged context lines to preserve around a change
    const len = diffLines.length;
    const visible = new Array(len).fill(false);

    // Mark all lines that are added/removed + context window surrounding them as visible
    for (let c = 0; c < len; c++) {
      if (diffLines[c].type !== "unchanged") {
        const start = Math.max(0, c - contextWindow);
        const end = Math.min(len - 1, c + contextWindow);
        for (let v = start; v <= end; v++) {
          visible[v] = true;
        }
      }
    }

    // Construct the segmented line array
    let idx = 0;
    while (idx < len) {
      if (visible[idx]) {
        displayLines.push({ type: "line", line: diffLines[idx], index: idx });
        idx++;
      } else {
        const startSkip = idx;
        while (idx < len && !visible[idx]) {
          idx++;
        }
        const endSkip = idx - 1;
        const count = endSkip - startSkip + 1;
        displayLines.push({
          type: "skipped",
          count,
          startIndex: startSkip,
          endIndex: endSkip,
        });
      }
    }
  } else {
    displayLines = diffLines.map((line, idx) => ({ type: "line", line, index: idx }));
  }

  // Compute Git-style context-aware display rows for Split view
  let displaySplitRows: Array<
    | { type: "row"; row: SplitDiffRow; index: number }
    | { type: "skipped"; count: number; startIndex: number; endIndex: number }
  > = [];

  const allSplitRows = alignDiffLines(diffLines);

  if (showOnlyChanges && hasDifferences) {
    const contextWindow = 3;
    const len = allSplitRows.length;
    const visible = new Array(len).fill(false);

    // Mark rows that contain changes (added or removed) and their neighbors visible
    for (let c = 0; c < len; c++) {
      const row = allSplitRows[c];
      const isChange =
        (row.left && row.left.type === "removed") ||
        (row.right && row.right.type === "added");

      if (isChange) {
        const start = Math.max(0, c - contextWindow);
        const end = Math.min(len - 1, c + contextWindow);
        for (let v = start; v <= end; v++) {
          visible[v] = true;
        }
      }
    }

    // Segment the rows
    let idx = 0;
    while (idx < len) {
      if (visible[idx]) {
        displaySplitRows.push({ type: "row", row: allSplitRows[idx], index: idx });
        idx++;
      } else {
        const startSkip = idx;
        while (idx < len && !visible[idx]) {
          idx++;
        }
        const endSkip = idx - 1;
        const count = endSkip - startSkip + 1;
        displaySplitRows.push({
          type: "skipped",
          count,
          startIndex: startSkip,
          endIndex: endSkip,
        });
      }
    }
  } else {
    displaySplitRows = allSplitRows.map((row, idx) => ({ type: "row", row, index: idx }));
  }

  return (
    <div
      className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in"
      id="preset-compare-modal"
    >
      <div className="bg-white border border-[#D1D1CF] w-full max-w-6xl h-[85vh] md:h-[80vh] flex flex-col shadow-2xl relative rounded-none overflow-hidden">
        {/* Modal Header */}
        <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[#1A1A1A]" />
            <span className="text-xs font-black uppercase tracking-wider font-sans text-[#1A1A1A]">
              Compare: {comparePreset.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Modal Subtitle / Toggles bar */}
        <div className="border-b border-[#D1D1CF] bg-[#F4F4F2]/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]">
              Preset Diff Inspector
            </span>
            <span className="text-[9px] text-[#888884] uppercase font-mono">
              Showing differences of active workspace vs target preset configuration
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareTab("system")}
              className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                compareTab === "system"
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
              }`}
            >
              System Instructions
            </button>
            <button
              onClick={() => setCompareTab("template")}
              className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                compareTab === "template"
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
              }`}
            >
              Prompt Template
            </button>
          </div>
        </div>

        {/* Stats & Overview info */}
        <div className="px-6 py-3 border-b border-[#D1D1CF] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#888884] font-mono">
              Changes in this file:
            </span>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold">
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 uppercase">
                +{additionsCount} additions
              </span>
              <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 uppercase">
                -{deletionsCount} deletions
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 border border-[#D1D1CF] p-0.5 bg-[#FAF9F6]">
              <button
                onClick={() => setDiffViewMode("split")}
                className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  diffViewMode === "split"
                    ? "bg-[#1A1A1A] text-white border border-[#1A1A1A]"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setDiffViewMode("unified")}
                className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  diffViewMode === "unified"
                    ? "bg-[#1A1A1A] text-white border border-[#1A1A1A]"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
              >
                Unified View
              </button>
            </div>

            {/* Filter toggle */}
            <div className="flex items-center gap-1 border border-[#D1D1CF] p-0.5 bg-[#FAF9F6]">
              <button
                onClick={() => setShowOnlyChanges(true)}
                className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  showOnlyChanges
                    ? "bg-[#1A1A1A] text-white border border-[#1A1A1A]"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
                title="Collapse unchanged lines with a few lines of context (Git-style)"
              >
                Changes Only
              </button>
              <button
                onClick={() => setShowOnlyChanges(false)}
                className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  !showOnlyChanges
                    ? "bg-[#1A1A1A] text-white border border-[#1A1A1A]"
                    : "text-[#888884] hover:text-[#1A1A1A]"
                }`}
                title="Display the entire file including all unmodified lines"
              >
                Full File
              </button>
            </div>
          </div>
        </div>

        {/* Column Headers if Split View */}
        {diffViewMode === "split" && hasDifferences && diffLines.length > 0 && (
          <div className="grid grid-cols-2 divide-x divide-[#D1D1CF] border-b border-[#D1D1CF] bg-[#F4F4F2] shrink-0 font-sans text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]">
            <div className="py-2 px-6 flex items-center justify-between">
              <span>Active Workspace (Original)</span>
            </div>
            <div className="py-2 px-6 flex items-center justify-between">
              <span>Preset Target ({comparePreset.name})</span>
            </div>
          </div>
        )}

        {/* Diff Output Codeblock - Scrollable */}
        <div className="flex-1 p-6 bg-[#FAF9F6] flex flex-col min-h-0">
          <div className="flex-1 border border-[#D1D1CF] bg-white flex flex-col overflow-y-auto custom-scrollbar min-h-0">
            {diffLines.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#888884] font-mono uppercase text-[10px] italic">
                This file is completely empty.
              </div>
            ) : !hasDifferences ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-[#888884] font-mono uppercase text-[10px] gap-2">
                <span className="font-bold text-[#1A1A1A] text-xs">
                  Configurations are Identical
                </span>
                <span>
                  No additions or deletions detected between active workspace and target preset.
                </span>
                <button
                  onClick={() => setShowOnlyChanges(false)}
                  className="mt-2 px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[#1A1A1A] font-bold uppercase text-[9px] tracking-wider transition-all cursor-pointer"
                >
                  Inspect Full File
                </button>
              </div>
            ) : diffViewMode === "split" ? (
              /* SPLIT SIDE-BY-SIDE VIEW */
              <div className="flex-1 flex flex-col divide-y divide-[#EAEAE8]">
                {displaySplitRows.map((item, idx) => {
                  if (item.type === "skipped") {
                    return (
                      <div
                        key={`skipped-split-${idx}`}
                        className="bg-[#F4F4F2]/50 text-[#888884] font-mono text-[10px] uppercase font-bold py-3 px-6 flex items-center justify-between border-y border-y-[#D1D1CF]/30 select-none shrink-0"
                      >
                        <span className="tracking-wide">
                          ••• Skipped {item.count} unchanged lines •••
                        </span>
                        <button
                          onClick={() => setShowOnlyChanges(false)}
                          className="text-[9px] font-bold tracking-wider underline hover:text-[#1A1A1A] cursor-pointer font-sans"
                        >
                          SHOW FULL FILE
                        </button>
                      </div>
                    );
                  }

                  const { left, right } = item.row;

                  // Left styling
                  let leftBg = "bg-white text-[#1A1A1A]";
                  let leftSymbol = " ";
                  if (left && left.type === "removed") {
                    leftBg = "bg-red-50/70 text-red-800 border-l-4 border-l-red-500 font-semibold";
                    leftSymbol = "-";
                  } else if (!left) {
                    leftBg = "bg-[#FAF9F6]/40 text-stone-300 select-none";
                  }

                  // Right styling
                  let rightBg = "bg-white text-[#1A1A1A]";
                  let rightSymbol = " ";
                  if (right && right.type === "added") {
                    rightBg = "bg-emerald-50/70 text-emerald-800 border-l-4 border-l-emerald-500 font-semibold";
                    rightSymbol = "+";
                  } else if (!right) {
                    rightBg = "bg-[#FAF9F6]/40 text-stone-300 select-none";
                  }

                  return (
                    <div
                      key={`split-row-${idx}`}
                      className="grid grid-cols-2 divide-x divide-[#EAEAE8] min-h-[28px] hover:bg-stone-50/30 transition-colors shrink-0"
                    >
                      {/* Left cell (Active Workspace) */}
                      <div
                        className={`flex items-start font-mono text-[11px] py-1.5 overflow-hidden ${leftBg}`}
                      >
                        {/* Line number */}
                        <div className="w-12 select-none shrink-0 text-right pr-3 text-[9px] text-[#888884] border-r border-[#EAEAE8]/80 mr-2 flex justify-end font-mono">
                          {left?.lineNumber || ""}
                        </div>
                        {/* Symbol */}
                        <span className="w-4 select-none shrink-0 font-bold font-mono text-center opacity-70">
                          {leftSymbol}
                        </span>
                        {/* Content */}
                        <pre className="flex-1 whitespace-pre-wrap break-all pr-3 font-mono select-text">
                          {left?.value ?? ""}
                        </pre>
                      </div>

                      {/* Right cell (Target Preset) */}
                      <div
                        className={`flex items-start font-mono text-[11px] py-1.5 overflow-hidden ${rightBg}`}
                      >
                        {/* Line number */}
                        <div className="w-12 select-none shrink-0 text-right pr-3 text-[9px] text-[#888884] border-r border-[#EAEAE8]/80 mr-2 flex justify-end font-mono">
                          {right?.lineNumber || ""}
                        </div>
                        {/* Symbol */}
                        <span className="w-4 select-none shrink-0 font-bold font-mono text-center opacity-70">
                          {rightSymbol}
                        </span>
                        {/* Content */}
                        <pre className="flex-1 whitespace-pre-wrap break-all pr-3 font-mono select-text">
                          {right?.value ?? ""}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* UNIFIED INLINE VIEW */
              <div className="flex-1 flex flex-col divide-y divide-[#EAEAE8]">
                {displayLines.map((item, idx) => {
                  if (item.type === "skipped") {
                    return (
                      <div
                        key={`skipped-${idx}`}
                        className="bg-[#F4F4F2]/50 text-[#888884] font-mono text-[10px] uppercase font-bold py-3 px-6 flex items-center justify-between border-l-4 border-l-[#D1D1CF]/60 select-none shrink-0"
                      >
                        <span className="tracking-wide">
                          ••• Skipped {item.count} unchanged lines •••
                        </span>
                        <button
                          onClick={() => setShowOnlyChanges(false)}
                          className="text-[9px] font-bold tracking-wider underline hover:text-[#1A1A1A] cursor-pointer font-sans"
                        >
                          SHOW FULL FILE
                        </button>
                      </div>
                    );
                  }

                  const line = item.line;
                  let lineClass = "bg-white text-[#1A1A1A] border-l-4 border-l-transparent";
                  let symbol = " ";
                  if (line.type === "added") {
                    lineClass = "bg-emerald-50/70 text-emerald-800 border-l-4 border-l-emerald-500 font-semibold";
                    symbol = "+";
                  } else if (line.type === "removed") {
                    lineClass = "bg-red-50/70 text-red-800 border-l-4 border-l-red-500 font-semibold";
                    symbol = "-";
                  }

                  return (
                    <div
                      key={`line-${idx}`}
                      className={`flex items-start font-mono text-[11px] leading-relaxed py-1.5 transition-colors hover:bg-stone-50 shrink-0 ${lineClass}`}
                    >
                      {/* Line numbers */}
                      <div className="w-14 select-none shrink-0 text-right pr-4 text-[9px] text-[#888884] border-r border-[#EAEAE8]/80 mr-3 flex justify-end gap-1 font-mono">
                        <span className="w-5 inline-block">{line.lineNumberA || ""}</span>
                        <span className="w-5 inline-block text-[#b1b1ae]">
                          {line.lineNumberB || ""}
                        </span>
                      </div>

                      {/* Diff Symbol */}
                      <span className="w-4 select-none shrink-0 font-bold font-mono text-center opacity-70">
                        {symbol}
                      </span>

                      {/* Line Content */}
                      <pre className="flex-1 whitespace-pre-wrap break-all pr-4 font-mono select-text">
                        {line.value || " "}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all bg-white"
          >
            Close Diff
          </button>

          <button
            onClick={() => onApplyPreset(comparePreset)}
            className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A]"
          >
            Apply & Load Preset
          </button>
        </div>
      </div>
    </div>
  );
}
