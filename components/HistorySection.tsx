"use client";

import React from "react";
import { History, Star, Eye, ChevronDown, FolderOpen, Trash2 } from "lucide-react";

export interface HistoryItem {
  id: string;
  timestamp: string;
  variables: Record<string, string>;
  images: { id?: string; label: string; base64: string; mimeType: string }[];
  videos?: { id?: string; label: string; mimeType?: string; duration?: number; youtubeUrl?: string; isYouTube?: boolean }[];
  output: string;
  filledPrompt: string;
  promptTemplate?: string;
  systemPrompt?: string;
  presetLabel?: string;
  name?: string;
  model?: string;
  thinkingLevel?: string;
  temperature?: number;
  maxTokens?: string;
  isFavorite?: boolean;
}

interface HistorySectionProps {
  history: HistoryItem[];
  isHistoryOpen: boolean;
  toggleHistory: () => void;
  historyTab: "all" | "favorites";
  setHistoryTab: (tab: "all" | "favorites") => void;
  setIsHistoryViewerOpen: (open: boolean) => void;
  setIsHistoryClearConfirmOpen: (open: boolean) => void;
  setPendingLoadItem: (item: HistoryItem) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onDeleteHistoryItem: (id: string, e: React.MouseEvent) => void;
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
    <section className={`flex flex-col ${isHistoryOpen ? "h-52 shrink-0" : "shrink-0"}`} id="history-panel">
      <div 
        onClick={toggleHistory}
        className="flex justify-between items-center mb-3 cursor-pointer select-none group flex-wrap gap-y-2"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            History
          </h2>
          <span className="text-[8px] font-mono text-[#888884] bg-white/60 border border-[#D1D1CF] px-1.5 py-0.5 font-bold">
            {history.length}
          </span>

          {/* Sub-tab filter buttons */}
          <div className="flex items-center gap-0.5 bg-[#FAF9F6] border border-[#D1D1CF] p-0.5" onClick={(e) => e.stopPropagation()}>
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
            onClick={(e) => {
              e.stopPropagation();
              setIsHistoryViewerOpen(true);
            }}
            className="px-2 py-0.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 text-[#1A1A1A] rounded-none shadow-sm shrink-0"
            title="Open History Inspector & Lab Viewer"
          >
            <Eye className="w-3 h-3 text-[#1A1A1A]" />
            Expand
          </button>
          <span className="text-[#888884] group-hover:text-[#1A1A1A] transition-colors">
            {isHistoryOpen ? (
              <ChevronDown className="w-3.5 h-3.5 transform rotate-180 transition-transform" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 transition-transform" />
            )}
          </span>
        </div>
        {history.length > 0 && isHistoryOpen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHistoryClearConfirmOpen(true);
            }}
            className="text-[9px] font-bold text-red-500 hover:text-red-700 tracking-wider font-mono uppercase cursor-pointer"
            id="clear-all-history"
          >
            Clear All
          </button>
        )}
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
                {displayedHistory.map((item) => {
                  const defaultTitle = item.variables["idea"] || "Untitled Outline";
                  const snippet = item.name || (defaultTitle.length > 50 ? defaultTitle.slice(0, 50) + "..." : defaultTitle);
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => setPendingLoadItem(item)}
                      className={`p-3.5 cursor-pointer transition-all flex flex-col group border-l-2 ${
                        item.isFavorite
                          ? "bg-[#FFFDF5] hover:bg-[#FFF9E6] border-l-amber-400"
                          : "hover:bg-[#F4F4F2] border-l-transparent"
                      }`}
                    >
                      {/* Row 1: Favorite toggle on left, Timestamp, image count, and delete control */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#888884]">
                          <button
                            type="button"
                            onClick={(e) => onToggleFavorite(item.id, e)}
                            className={`p-0.5 -ml-1 transition-colors cursor-pointer ${
                              item.isFavorite
                                ? "text-amber-500 hover:text-amber-600"
                                : "text-[#888884] hover:text-amber-500 opacity-60 group-hover:opacity-100"
                            }`}
                            title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star className={`w-3.5 h-3.5 ${item.isFavorite ? "fill-amber-400 text-amber-500" : ""}`} />
                          </button>
                          <span>{item.timestamp}</span>
                          {item.images && item.images.length > 0 && (
                            <span className="text-[8px] bg-[#1A1A1A] text-white px-1 font-mono uppercase font-bold">
                              {item.images.length} IMG
                            </span>
                          )}
                          {item.videos && item.videos.length > 0 && (
                            <span className="text-[8px] bg-purple-900 text-purple-100 px-1 font-mono uppercase font-bold">
                              {item.videos.length} VID
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => onDeleteHistoryItem(item.id, e)}
                            className="text-[#888884] hover:text-red-500 opacity-0 group-hover:opacity-100 p-0.5 transition-all cursor-pointer shrink-0"
                            title="Delete history slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Title */}
                      <h4 className="text-[11px] font-bold uppercase text-[#1A1A1A] truncate tracking-tight w-full">
                        {snippet}
                      </h4>

                      {/* Row 3: Model & Preset Badges */}
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-[8px] text-[#888884] w-full flex-wrap">
                        {item.model && (
                          <span className="border border-[#D1D1CF] bg-white text-[#1A1A1A] px-1 py-0.5 shrink-0 uppercase">
                            {item.model.replace("gemini-", "")}
                          </span>
                        )}
                        {(item.presetLabel || item.systemPrompt || item.promptTemplate) && (
                          <span className="border border-[#D1D1CF] bg-[#EAEAE8] text-[#1A1A1A] px-1 py-0.5 shrink-0 uppercase font-bold truncate max-w-[140px]">
                            {item.presetLabel || "PRESET: CUSTOM"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
