"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Star,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import {
  HistoryItem,
  HistoryFilterState,
  HistorySortOption,
  HistorySearchScope,
  HistoryMediaType,
} from "../../types/history";
import {
  groupHistoryByDate,
  getUniquePresets,
  getUniqueModels,
  countActiveFilters,
} from "../../lib/history-grouping";

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
  filterState: HistoryFilterState;
  setFilterState: React.Dispatch<React.SetStateAction<HistoryFilterState>>;
  onResetFilters: () => void;
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
  filterState,
  setFilterState,
  onResetFilters,
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [collapsedBuckets, setCollapsedBuckets] = useState<Record<string, boolean>>({});

  // Dynamic presets and models extracted from historical records
  const uniquePresets = useMemo(() => getUniquePresets(history), [history]);
  const uniqueModels = useMemo(() => getUniqueModels(history), [history]);
  const activeFilterCount = useMemo(() => countActiveFilters(filterState), [filterState]);

  const isCostSorting = filterState.sortBy === "cost_desc" || filterState.sortBy === "cost_asc";
  const isDateSorting = filterState.sortBy === "date_desc" || filterState.sortBy === "date_asc";

  // Group by date only when sorting by date
  const dateGroups = useMemo(() => {
    if (!isDateSorting) return [];
    return groupHistoryByDate(filteredHistory);
  }, [filteredHistory, isDateSorting]);

  const toggleBucketCollapse = (bucket: string) => {
    setCollapsedBuckets((prev) => ({
      ...prev,
      [bucket]: !prev[bucket],
    }));
  };

  const handleMediaFilterToggle = (type: HistoryMediaType) => {
    setFilterState((prev) => {
      const isAlreadyActive = prev.mediaFilters.includes(type);
      return {
        ...prev,
        mediaFilters: isAlreadyActive
          ? prev.mediaFilters.filter((t) => t !== type)
          : [...prev.mediaFilters, type],
      };
    });
  };

  const renderHistoryCard = (item: HistoryItem, index?: number) => {
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
        {/* Row 1: Star, Timestamp / Rank, Media Badges, Action Buttons (Rename/Delete) */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#888884] min-w-0 flex-wrap">
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

            {/* Rank index when sorting by Cost or Name */}
            {typeof index === "number" && !isDateSorting && (
              <span className="bg-[#EAEAE8] text-[#1A1A1A] font-bold px-1 py-0.2 text-[8px] leading-none shrink-0">
                #{index + 1}
              </span>
            )}

            <span className="shrink-0 text-[#1A1A1A] font-semibold">{item.timestamp}</span>

            {item.images && item.images.length > 0 && (
              <span className="bg-[#1A1A1A] text-white px-1 py-0.5 font-bold uppercase text-[7.5px] leading-none shrink-0">
                {item.images.length} IMG
              </span>
            )}
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

        {/* Row 3: Model & Preset Badges (+ Cost & Token Badges when sorting by Cost) */}
        <div className="flex items-center gap-1 font-mono text-[8px] text-[#888884] w-full flex-wrap">
          {item.model && (
            <span className="border border-[#D1D1CF] bg-white text-[#1A1A1A] px-1 py-0.5 shrink-0 uppercase font-bold leading-none">
              {item.model.replace("gemini-", "")}
            </span>
          )}

          {(item.presetLabel || item.systemPrompt || item.promptTemplate) && (
            <span
              className="border border-[#D1D1CF] bg-[#EAEAE8] text-[#1A1A1A] px-1 py-0.5 shrink-0 uppercase font-bold truncate max-w-[120px] leading-none"
              title={item.presetLabel || "CUSTOM"}
            >
              {item.presetLabel || "CUSTOM"}
            </span>
          )}

          {/* Explicit Cost Badge surfaced when sorting by Cost */}
          {isCostSorting && item.estimatedCost && (
            <span className="border border-emerald-400 bg-emerald-50 text-emerald-800 px-1 py-0.5 shrink-0 uppercase font-bold leading-none">
              {item.estimatedCost}
            </span>
          )}

          {/* Token count helper when sorting by Cost */}
          {isCostSorting && item.tokenUsage?.totalTokens && (
            <span className="border border-[#D1D1CF] bg-[#FAF9F6] text-[#666] px-1 py-0.5 shrink-0 font-bold leading-none">
              {item.tokenUsage.totalTokens >= 1000
                ? `${(item.tokenUsage.totalTokens / 1000).toFixed(1)}k`
                : item.tokenUsage.totalTokens}{" "}
              TOK
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
  };

  return (
    <div className="w-full md:w-80 flex flex-col shrink-0 bg-[#FAF9F6] h-1/3 md:h-full min-h-[180px] md:min-h-0">
      {/* Header: Tabs, Search Bar, & Filter Drawer Toggle */}
      <div className="p-3.5 border-b border-[#D1D1CF] bg-white space-y-2.5">
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

        {/* Search Input Bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
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
            className="w-full bg-[#FAF9F6] border border-[#D1D1CF] py-1.5 pl-8 pr-7 text-[10px] uppercase tracking-wider font-bold outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A] placeholder-stone-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-[#888884] hover:text-[#1A1A1A] transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Filter Collapsible Drawer Trigger Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider border cursor-pointer transition-all ${
              isDrawerOpen || activeFilterCount > 0
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-[#FAF9F6] text-[#555] border-[#D1D1CF] hover:text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Sort & Filter</span>
              {activeFilterCount > 0 && (
                <span className="bg-amber-400 text-[#1A1A1A] px-1 py-0.2 text-[8px] font-black rounded-none leading-none">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {activeFilterCount > 0 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onResetFilters();
                  }}
                  className="text-amber-300 hover:text-white underline text-[8px] mr-1 lowercase tracking-normal flex items-center gap-0.5"
                  title="Reset all filters to defaults"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  reset
                </span>
              )}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${isDrawerOpen ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {/* Collapsible Filter & Sort Drawer Panel */}
          {isDrawerOpen && (
            <div className="p-2.5 bg-[#FAF9F6] border border-[#D1D1CF] space-y-2.5 animate-fade-in font-mono text-[9px]">
              {/* Row 1: Sort By */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold text-[#888884] uppercase tracking-wider">
                  Sort By:
                </span>
                <select
                  value={filterState.sortBy}
                  onChange={(e) =>
                    setFilterState((prev) => ({
                      ...prev,
                      sortBy: e.target.value as HistorySortOption,
                    }))
                  }
                  className="w-full bg-white border border-[#D1D1CF] text-[9px] uppercase tracking-wider font-bold py-1 px-1.5 outline-none focus:border-[#1A1A1A] text-[#1A1A1A] cursor-pointer rounded-none h-7"
                >
                  <option value="date_desc">Date (Newest First)</option>
                  <option value="date_asc">Date (Oldest First)</option>
                  <option value="cost_desc">Cost (Highest First)</option>
                  <option value="cost_asc">Cost (Lowest First)</option>
                  <option value="name_asc">Title / Name (A - Z)</option>
                </select>
              </div>

              {/* Row 2: Search Scope (Area) */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold text-[#888884] uppercase tracking-wider">
                  Search Scope (Area):
                </span>
                <select
                  value={filterState.searchScope}
                  onChange={(e) =>
                    setFilterState((prev) => ({
                      ...prev,
                      searchScope: e.target.value as HistorySearchScope,
                    }))
                  }
                  className="w-full bg-white border border-[#D1D1CF] text-[9px] uppercase tracking-wider font-bold py-1 px-1.5 outline-none focus:border-[#1A1A1A] text-[#1A1A1A] cursor-pointer rounded-none h-7"
                >
                  <option value="all">All Content (Universal)</option>
                  <option value="default">Slot Name / Title</option>
                  <option value="idea">Main Objective (Idea)</option>
                  <option value="output">Generated Output</option>
                  <option value="visual_reference">Media Labels (@image/@video)</option>
                  <option value="compiled_prompt">Compiled Prompt Specs</option>
                </select>
              </div>

              {/* Row 3: Preset Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold text-[#888884] uppercase tracking-wider">
                  Preset Filter:
                </span>
                <select
                  value={filterState.presetFilter}
                  onChange={(e) =>
                    setFilterState((prev) => ({
                      ...prev,
                      presetFilter: e.target.value,
                    }))
                  }
                  className="w-full bg-white border border-[#D1D1CF] text-[9px] uppercase tracking-wider font-bold py-1 px-1.5 outline-none focus:border-[#1A1A1A] text-[#1A1A1A] cursor-pointer rounded-none h-7"
                >
                  <option value="all">All Presets ({history.length})</option>
                  {uniquePresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label} ({preset.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 4: Model & Reasoning Level */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-[#888884] uppercase tracking-wider">
                    Model:
                  </span>
                  <select
                    value={filterState.modelFilter}
                    onChange={(e) =>
                      setFilterState((prev) => ({
                        ...prev,
                        modelFilter: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-[#D1D1CF] text-[9px] uppercase tracking-wider font-bold py-1 px-1.5 outline-none focus:border-[#1A1A1A] text-[#1A1A1A] cursor-pointer rounded-none h-7"
                  >
                    <option value="all">All Models</option>
                    {uniqueModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label} ({model.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-bold text-[#888884] uppercase tracking-wider">
                    Reasoning:
                  </span>
                  <select
                    value={filterState.thinkingFilter}
                    onChange={(e) =>
                      setFilterState((prev) => ({
                        ...prev,
                        thinkingFilter: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-[#D1D1CF] text-[9px] uppercase tracking-wider font-bold py-1 px-1.5 outline-none focus:border-[#1A1A1A] text-[#1A1A1A] cursor-pointer rounded-none h-7"
                  >
                    <option value="all">All Levels</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                    <option value="MINIMAL">Minimal</option>
                    <option value="OFF">None / Off</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Multi-Select Media Filter (AND logic) */}
              <div className="flex flex-col gap-1 pt-1 border-t border-[#D1D1CF]">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-[#888884] uppercase tracking-wider">
                    Media Filter (Match ALL):
                  </span>
                  {filterState.mediaFilters.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setFilterState((prev) => ({ ...prev, mediaFilters: [] }))
                      }
                      className="text-[8px] text-[#888884] hover:text-[#1A1A1A] underline cursor-pointer"
                    >
                      Clear media
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {(
                    [
                      { id: "image", label: "IMG", title: "Reference Images" },
                      { id: "video", label: "VID", title: "Reference Videos (MP4, YouTube)" },
                      { id: "audio", label: "AUD", title: "Audio Clips (MP3, WAV, etc.)" },
                      { id: "doc", label: "DOC", title: "Documents & Text Files (PDF, TXT, MD)" },
                    ] as { id: HistoryMediaType; label: string; title: string }[]
                  ).map((m) => {
                    const isActive = filterState.mediaFilters.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleMediaFilterToggle(m.id)}
                        className={`py-1 px-1 text-[8.5px] font-mono font-bold uppercase tracking-wider border cursor-pointer text-center transition-all ${
                          isActive
                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                            : "bg-white text-[#666] border-[#D1D1CF] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                        }`}
                        title={m.title}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slots List: Either Date Grouped or Flat Ranked */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#888884] uppercase font-mono text-[9px] gap-2">
            <span>
              {activeTab === "favorites"
                ? "No favorited logs match current filters"
                : "No history logs match current filters"}
            </span>
            {(searchQuery || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  onResetFilters();
                }}
                className="px-2.5 py-1 bg-white border border-[#D1D1CF] text-[#1A1A1A] hover:border-[#1A1A1A] text-[8.5px] font-bold uppercase tracking-wider cursor-pointer shadow-xs"
              >
                Reset Filters & Search
              </button>
            )}
          </div>
        ) : isDateSorting ? (
          /* Date Grouped Section Headers */
          <div className="flex flex-col">
            {dateGroups.map((group) => {
              const isCollapsed = collapsedBuckets[group.bucket];
              return (
                <div key={group.bucket} className="flex flex-col">
                  {/* Sticky Section Header */}
                  <div
                    onClick={() => toggleBucketCollapse(group.bucket)}
                    className="sticky top-0 z-10 bg-[#EAEAE8] border-y border-[#D1D1CF] px-3 py-1 text-[8.5px] font-mono font-bold uppercase tracking-wider text-[#333] flex items-center justify-between cursor-pointer select-none hover:bg-[#E2E2DF] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <ChevronDown
                        className={`w-3 h-3 text-[#666] transition-transform duration-150 ${
                          isCollapsed ? "-rotate-90" : ""
                        }`}
                      />
                      <span>{group.label}</span>
                    </div>
                    <span className="text-[#888884] font-normal text-[8px]">
                      ({group.items.length})
                    </span>
                  </div>

                  {/* Group Items */}
                  {!isCollapsed && (
                    <div className="flex flex-col divide-y divide-[#EAEAE8]">
                      {group.items.map((item) => renderHistoryCard(item))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Ranked List for Cost / Name Sorting */
          <div className="flex flex-col divide-y divide-[#EAEAE8]">
            {filteredHistory.map((item, idx) => renderHistoryCard(item, idx))}
          </div>
        )}
      </div>
    </div>
  );
};
