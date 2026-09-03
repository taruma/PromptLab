"use client";

import React from "react";
import { Search, Trash2, Edit2, Check, X, Star } from "lucide-react";
import { HistoryItem, HistorySearchScope } from "../../types/history";

export interface HistoryListSidebarProps {
  history: HistoryItem[];
  filteredHistory: HistoryItem[];
  selectedItem: HistoryItem | null;
  selectedItemRef: React.RefObject<HTMLDivElement | null>;
  onSelectItem: (id: string) => void;
  activeTab: "all" | "favorites";
  setActiveTab: (tab: "all" | "favorites") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchScope: HistorySearchScope;
  setSearchScope: (scope: HistorySearchScope) => void;
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (val: string) => void;
  onStartRename: (item: HistoryItem, e: React.MouseEvent) => void;
  onSaveRename: (id: string, e: React.MouseEvent) => void;
  onCancelRename: (e: React.MouseEvent) => void;
  onRenameKeyDown: (id: string, e: React.KeyboardEvent) => void;
  onToggleFavorite?: (id: string, e?: React.MouseEvent) => void;
  onDeleteHistoryItem: (id: string) => void;
}

export const HistoryListSidebar: React.FC<HistoryListSidebarProps> = ({
  history,
  filteredHistory,
  selectedItem,
  selectedItemRef,
  onSelectItem,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  searchScope,
  setSearchScope,
  renamingId,
  renameValue,
  setRenameValue,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onRenameKeyDown,
  onToggleFavorite,
  onDeleteHistoryItem,
}) => {
  return (
    <div className="w-full md:w-80 flex flex-col shrink-0 bg-[#FAF9F6] h-1/3 md:h-full min-h-[180px] md:min-h-0">
      {/* Search & Tabs Header */}
      <div className="p-4 border-b border-[#D1D1CF] bg-white">
        <div className="space-y-2.5">
          {/* Tabs: All vs Favorites */}
          <div className="flex items-center gap-1 border-b border-[#D1D1CF] pb-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                activeTab === "all"
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-[#FAF9F6] text-[#888884] border-[#D1D1CF] hover:text-[#1A1A1A]"
              }`}
            >
              All ({history.length})
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 py-1 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                activeTab === "favorites"
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-[#FAF9F6] text-[#888884] border-[#D1D1CF] hover:text-[#1A1A1A]"
              }`}
            >
              <Star className={`w-3 h-3 ${activeTab === "favorites" ? "fill-amber-400 text-amber-400" : ""}`} />
              Favorites ({history.filter((h) => h.isFavorite).length})
            </button>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-3.5 h-3.5 text-[#888884]" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && searchQuery) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  setSearchQuery("");
                }
              }}
              placeholder="Search history slots..."
              className="w-full bg-[#FAF9F6] border border-[#D1D1CF] py-1.5 pl-9 pr-8 text-[10px] uppercase tracking-wider font-bold outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A] placeholder-stone-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#888884] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Scope Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-mono font-bold text-[#888884] uppercase tracking-wider shrink-0">
              Area:
            </span>
            <select
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value as HistorySearchScope)}
              className="flex-1 bg-[#FAF9F6] border border-[#D1D1CF] text-[9px] uppercase tracking-wider font-bold py-1 px-2 outline-none focus:border-[#1A1A1A] text-[#1A1A1A] cursor-pointer rounded-none h-7"
            >
              <option value="default">Default (Title)</option>
              <option value="visual_reference">Visual Reference Labels</option>
              <option value="idea">Main Objective / Idea</option>
              <option value="output">Saved Output Text</option>
              <option value="compiled_prompt">Compiled Prompt Specs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Slots List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#888884] uppercase font-mono text-[9px] gap-1">
            <span>{activeTab === "favorites" ? "No favorited logs found" : "No history logs found"}</span>
            {searchQuery && <span className="italic">Modify search filter</span>}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#EAEAE8]">
            {filteredHistory.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const defaultTitle = item.variables["idea"] || "Untitled Outline";
              const displayTitle =
                item.name || (defaultTitle.length > 50 ? defaultTitle.slice(0, 50) + "..." : defaultTitle);

              const rawOutput = item.output || "";
              const cleanedText = rawOutput
                ? rawOutput.replace(/[#*`_>~-]/g, " ").replace(/\s+/g, " ").trim()
                : "No output generated.";
              const outputExcerpt =
                cleanedText.length > 140 ? cleanedText.slice(0, 137) + "..." : cleanedText;

              return (
                <div
                  key={item.id}
                  ref={isSelected ? selectedItemRef : null}
                  onClick={() => onSelectItem(item.id)}
                  className={`px-3 py-2.5 cursor-pointer transition-all flex flex-col gap-1 group relative ${
                    isSelected
                      ? "bg-[#FEF3C7] border-l-4 border-l-[#1A1A1A]"
                      : item.isFavorite
                      ? "bg-[#FFFDF5] hover:bg-[#FFF9E6] border-l-2 border-l-amber-400"
                      : "bg-white hover:bg-[#F4F4F2] border-l-2 border-l-transparent"
                  }`}
                >
                  {/* Row 1: Star, Timestamp, Media Badges, Action Buttons (Rename/Delete) */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#888884] min-w-0">
                      {onToggleFavorite && (
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
                      )}
                      <span className="shrink-0 text-[#1A1A1A] font-semibold">{item.timestamp}</span>

                      {item.images && item.images.length > 0 && (
                        <span className="bg-[#1A1A1A] text-white px-1 py-0.5 font-bold uppercase text-[7.5px] leading-none shrink-0">
                          {item.images.length} IMG
                        </span>
                      )}
                      {(() => {
                        const rawVids = item.videos || [];
                        const vidCount = rawVids.filter(
                          (v) =>
                            !v.mimeType?.startsWith("audio/") &&
                            !(v.mimeType?.startsWith("text/") || v.mimeType === "application/pdf")
                        ).length;
                        const audCount = rawVids.filter((v) => Boolean(v.mimeType?.startsWith("audio/"))).length;
                        const docCount = rawVids.filter((v) =>
                          Boolean(
                            v.mimeType?.startsWith("text/") ||
                              v.mimeType === "application/pdf" ||
                              (v.mimeType &&
                                !v.mimeType.startsWith("video/") &&
                                !v.mimeType.startsWith("image/") &&
                                !v.mimeType.startsWith("audio/"))
                          )
                        ).length;
                        return (
                          <>
                            {vidCount > 0 && (
                              <span className="bg-amber-900 text-amber-100 px-1 py-0.5 font-bold uppercase text-[7.5px] leading-none shrink-0">
                                {vidCount} VID
                              </span>
                            )}
                            {audCount > 0 && (
                              <span className="bg-purple-900 text-purple-100 px-1 py-0.5 font-bold uppercase text-[7.5px] leading-none shrink-0">
                                {audCount} AUD
                              </span>
                            )}
                            {docCount > 0 && (
                              <span className="bg-teal-900 text-teal-100 px-1 py-0.5 font-bold uppercase text-[7.5px] leading-none shrink-0">
                                {docCount} DOC
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {renamingId !== item.id && (
                      <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={(e) => onStartRename(item, e)}
                          className="text-[#888884] hover:text-[#1A1A1A] p-0.5 transition-colors cursor-pointer"
                          title="Rename history slot"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHistoryItem(item.id);
                          }}
                          className="text-[#888884] hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                          title="Delete history slot"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Row 2: Title / Rename input */}
                  {renamingId === item.id ? (
                    <div
                      className="flex items-center gap-1.5 w-full my-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => onRenameKeyDown(item.id, e)}
                        autoFocus
                        className="w-full bg-white border border-[#1A1A1A] px-2 py-0.5 text-[10px] font-bold text-[#1A1A1A] rounded-none outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => onSaveRename(item.id, e)}
                        className="p-1 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                        title="Save Name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={onCancelRename}
                        className="p-1 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <h4
                      className={`text-[11px] font-bold uppercase tracking-tight line-clamp-1 leading-snug w-full ${
                        isSelected
                          ? "text-[#1A1A1A] font-black"
                          : "text-[#333330] group-hover:text-[#1A1A1A]"
                      }`}
                      title={displayTitle}
                    >
                      {displayTitle}
                    </h4>
                  )}

                  {/* Row 3: Model & Preset Badges */}
                  <div className="flex items-center gap-1 font-mono text-[8px] text-[#888884] w-full flex-wrap">
                    {item.model && (
                      <span className="border border-[#D1D1CF] bg-white text-[#1A1A1A] px-1 py-0.5 shrink-0 uppercase font-bold leading-none">
                        {item.model.replace("gemini-", "")}
                      </span>
                    )}
                    {(item.presetLabel || item.systemPrompt || item.promptTemplate) && (
                      <span
                        className="border border-[#D1D1CF] bg-[#EAEAE8] text-[#1A1A1A] px-1 py-0.5 shrink-0 uppercase font-bold truncate max-w-[130px] leading-none"
                        title={item.presetLabel || "CUSTOM"}
                      >
                        {item.presetLabel || "CUSTOM"}
                      </span>
                    )}
                  </div>

                  {/* Row 4: Output Excerpt */}
                  <p
                    className={`text-[10px] font-sans italic line-clamp-2 overflow-hidden text-ellipsis leading-tight transition-colors ${
                      isSelected ? "text-[#444]" : "text-[#888884] group-hover:text-[#666]"
                    }`}
                  >
                    &ldquo;{outputExcerpt}&rdquo;
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
