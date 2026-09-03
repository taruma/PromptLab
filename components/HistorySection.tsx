"use client";

import React from "react";
import { History, Star, Eye, ChevronDown, ChevronRight, FolderOpen, Trash2 } from "lucide-react";
import { HistoryItem } from "../types/history";

export type { HistoryItem };

interface HistorySectionProps {
  history: HistoryItem[];
  isHistoryOpen: boolean;
  toggleHistory: () => void;
  historyTab: "all" | "favorites";
  setHistoryTab: (tab: "all" | "favorites") => void;
  setIsHistoryViewerOpen: (open: boolean) => void;
  setIsHistoryClearConfirmOpen?: (open: boolean) => void;
  setPendingLoadItem: (item: HistoryItem) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onDeleteHistoryItem: (id: string, e: React.MouseEvent) => void;
}

function parseTimestamp(rawTimestamp: string) {
  if (!rawTimestamp) return { dateKey: "", full24: "", time24: "" };

  // Match pattern like "Jul 26, 05:22 AM", "Jul 26, 05:22", "Jul 26, 17:22", etc.
  const regex = /^([A-Za-z]{3}\s+\d{1,2}),?\s+(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i;
  const match = rawTimestamp.trim().match(regex);

  if (match) {
    const dateKey = match[1]; // e.g. "Jul 26"
    let hour = parseInt(match[2], 10);
    const minute = match[3];
    const ampm = match[4];

    if (ampm) {
      const upper = ampm.toUpperCase();
      if (upper === "PM" && hour < 12) hour += 12;
      if (upper === "AM" && hour === 12) hour = 0;
    }

    const time24 = `${String(hour).padStart(2, "0")}:${minute}`;
    return {
      dateKey,
      full24: `${dateKey}, ${time24}`,
      time24,
    };
  }

  return {
    dateKey: rawTimestamp.split(",")[0]?.trim() || "",
    full24: rawTimestamp,
    time24: rawTimestamp,
  };
}

export default function HistorySection({
  history,
  isHistoryOpen,
  toggleHistory,
  historyTab,
  setHistoryTab,
  setIsHistoryViewerOpen,
  setIsHistoryClearConfirmOpen,
  setPendingLoadItem,
  onToggleFavorite,
  onDeleteHistoryItem,
}: HistorySectionProps) {
  return (
    <section className={`flex flex-col ${isHistoryOpen ? "h-[260px] shrink-0" : "shrink-0"}`} id="history-panel">
      <div 
        onClick={toggleHistory}
        className="flex justify-between items-center mb-3 cursor-pointer select-none group flex-wrap gap-2"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            History
          </h2>
          <span className="text-[8px] font-mono text-[#888884] bg-white/60 border border-[#D1D1CF] px-1.5 py-0.5 font-bold">
            {history.length}
          </span>
          <span className="text-[#888884] group-hover:text-[#1A1A1A] transition-colors">
            {isHistoryOpen ? (
              <ChevronDown className="w-3.5 h-3.5 transition-transform" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 transition-transform" />
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end" onClick={(e) => e.stopPropagation()}>
          {/* Sub-tab filter buttons */}
          <div className="flex items-center gap-0.5 bg-[#FAF9F6] border border-[#D1D1CF] p-0.5">
            <button
              type="button"
              onClick={() => setHistoryTab("all")}
              className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                historyTab === "all"
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#888884] hover:text-[#1A1A1A]"
              }`}
            >
              All ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab("favorites")}
              className={`px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                historyTab === "favorites"
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#888884] hover:text-[#1A1A1A]"
              }`}
            >
              <Star className={`w-2.5 h-2.5 ${historyTab === "favorites" ? "fill-amber-400 text-amber-400" : ""}`} />
              Favs ({history.filter(h => h.isFavorite).length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsHistoryViewerOpen(true);
            }}
            className="px-2 py-0.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 text-[#1A1A1A] rounded-none shadow-sm shrink-0"
            title="Open History Inspector & Lab Viewer"
          >
            <Eye className="w-3 h-3 text-[#1A1A1A]" />
            Expand
          </button>
        </div>
      </div>

      {isHistoryOpen && (
        <div className="flex-1 bg-white border border-[#D1D1CF] overflow-y-auto custom-scrollbar" id="history-container">
          {(() => {
            const displayedHistory = historyTab === "favorites" ? history.filter(item => item.isFavorite) : history;
            if (displayedHistory.length === 0) {
              return (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#888884]">
                  <FolderOpen className="w-5 h-5 text-[#D1D1CF] mb-1.5" />
                  <span className="text-[9px] uppercase tracking-wider font-bold">
                    {historyTab === "favorites" ? "No Favorites Saved" : "Asset Log Empty"}
                  </span>
                </div>
              );
            }

            return (
              <div className="flex flex-col divide-y divide-[#D1D1CF]" id="history-items-list">
                {(() => {
                  let lastDateKey = "";
                  return displayedHistory.map((item) => {
                    const defaultTitle = item.variables["idea"] || "Untitled Outline";
                    const snippet = item.name || (defaultTitle.length > 50 ? defaultTitle.slice(0, 50) + "..." : defaultTitle);
                    
                    const { dateKey, full24, time24 } = parseTimestamp(item.timestamp);
                    let displayTimestamp = full24;
                    if (dateKey && dateKey === lastDateKey) {
                      displayTimestamp = time24;
                    } else if (dateKey) {
                      lastDateKey = dateKey;
                    }

                    const rawOutput = item.output || "";
                    const outputExcerpt = rawOutput
                      ? rawOutput.replace(/[#*`_>~-]/g, " ").replace(/\s+/g, " ").trim()
                      : "No output preview";

                    return (
                      <div
                        key={item.id}
                        onClick={() => setPendingLoadItem(item)}
                        className={`px-2.5 py-2 cursor-pointer transition-all flex flex-col gap-0.5 group border-l-2 ${
                          item.isFavorite
                            ? "bg-[#FFFDF5] hover:bg-[#FFF9E6] border-l-amber-400"
                            : "hover:bg-[#F4F4F2] border-l-transparent"
                        }`}
                      >
                        {/* Row 1: Star, Timestamp, Media Badges, Title, Delete */}
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Star Button */}
                          <button
                            type="button"
                            onClick={(e) => onToggleFavorite(item.id, e)}
                            className={`p-0.5 -ml-1 transition-colors cursor-pointer shrink-0 ${
                              item.isFavorite
                                ? "text-amber-500 hover:text-amber-600"
                                : "text-[#888884] hover:text-amber-500 opacity-60 group-hover:opacity-100"
                            }`}
                            title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star className={`w-3.5 h-3.5 ${item.isFavorite ? "fill-amber-400 text-amber-500" : ""}`} />
                          </button>

                          {/* Timestamp */}
                          <span className="font-mono text-[9px] text-[#888884] whitespace-nowrap shrink-0">
                            {displayTimestamp}
                          </span>

                          {/* Media Badges */}
                          {item.images && item.images.length > 0 && (
                            <span className="bg-[#1A1A1A] text-white px-1 py-0.5 font-mono uppercase font-bold text-[7.5px] shrink-0 leading-none">
                              {item.images.length} IMG
                            </span>
                          )}
                          {(() => {
                            const rawVids = item.videos || [];
                            const vidCount = rawVids.filter(v => !v.mimeType?.startsWith("audio/") && !(v.mimeType?.startsWith("text/") || v.mimeType === "application/pdf")).length;
                            const audCount = rawVids.filter(v => Boolean(v.mimeType?.startsWith("audio/"))).length;
                            const docCount = rawVids.filter(v => Boolean(v.mimeType?.startsWith("text/") || v.mimeType === "application/pdf" || (v.mimeType && !v.mimeType.startsWith("video/") && !v.mimeType.startsWith("image/") && !v.mimeType.startsWith("audio/")))).length;
                            return (
                              <>
                                {vidCount > 0 && (
                                  <span className="bg-amber-900 text-amber-100 px-1 py-0.5 font-mono uppercase font-bold text-[7.5px] shrink-0 leading-none">
                                    {vidCount} VID
                                  </span>
                                )}
                                {audCount > 0 && (
                                  <span className="bg-purple-900 text-purple-100 px-1 py-0.5 font-mono uppercase font-bold text-[7.5px] shrink-0 leading-none">
                                    {audCount} AUD
                                  </span>
                                )}
                                {docCount > 0 && (
                                  <span className="bg-teal-900 text-teal-100 px-1 py-0.5 font-mono uppercase font-bold text-[7.5px] shrink-0 leading-none">
                                    {docCount} DOC
                                  </span>
                                )}
                              </>
                            );
                          })()}

                          {/* Headline / Title Snippet */}
                          <h4 
                            className="text-[11px] font-bold uppercase text-[#1A1A1A] truncate tracking-tight flex-1 min-w-0"
                            title={snippet}
                          >
                            {snippet}
                          </h4>

                          {/* Delete Action */}
                          <button
                            type="button"
                            onClick={(e) => onDeleteHistoryItem(item.id, e)}
                            className="text-[#888884] hover:text-red-500 opacity-0 group-hover:opacity-100 p-0.5 transition-all cursor-pointer shrink-0 ml-0.5"
                            title="Delete history slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Row 2: Output Excerpt */}
                        <p 
                          className="text-[10px] text-[#888884] font-sans italic truncate pl-[22px] tracking-normal leading-tight group-hover:text-[#333330] transition-colors"
                          title={outputExcerpt}
                        >
                          {outputExcerpt}
                        </p>
                      </div>
                    );
                  });
                })()}
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
