"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  Globe,
  Tag,
  Target,
  FileText,
  Paperclip,
  Sliders,
  Terminal,
  LayoutList,
  Rows,
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

export interface SearchScopeOption {
  id: HistorySearchScope;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SEARCH_SCOPE_OPTIONS: SearchScopeOption[] = [
  {
    id: "all",
    label: "All Content (Universal)",
    shortLabel: "ALL",
    description: "Searches Title, Idea, Params, Output, Media & Prompts",
    icon: Globe,
  },
  {
    id: "default",
    label: "Slot Name / Title",
    shortLabel: "TITLE",
    description: "Custom slot names or auto-derived outline titles",
    icon: Tag,
  },
  {
    id: "idea",
    label: "Main Objective (Idea)",
    shortLabel: "IDEA",
    description: "Dedicated {{idea}} objective textarea contents",
    icon: Target,
  },
  {
    id: "output",
    label: "Generated Output",
    shortLabel: "OUTPUT",
    description: "Synthesized narrative response and story text",
    icon: FileText,
  },
  {
    id: "visual_reference",
    label: "Media Reference Labels",
    shortLabel: "MEDIA",
    description: "Casting labels (@image, @video, @audio, @doc)",
    icon: Paperclip,
  },
  {
    id: "parameters",
    label: "Dynamic Parameters",
    shortLabel: "PARAMS",
    description: "Form inputs: variable names and customized values",
    icon: Sliders,
  },
  {
    id: "compiled_prompt",
    label: "Compiled Prompt Specs",
    shortLabel: "PROMPT",
    description: "Full assembled prompt instructions sent to engine",
    icon: Terminal,
  },
];

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
  const [isScopeMenuOpen, setIsScopeMenuOpen] = useState(false);
  const scopeMenuRef = useRef<HTMLDivElement>(null);

  // View density mode: "detailed" (4-row card with excerpt) vs "compact" (ultra-dense single line)
  const [densityMode, setDensityMode] = useState<"detailed" | "compact">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("promptlab_history_density_mode");
        if (saved === "detailed" || saved === "compact") return saved;
      } catch (e) {
        // Fallback
      }
    }
    return "detailed";
  });

  const handleSetDensityMode = (mode: "detailed" | "compact") => {
    setDensityMode(mode);
    try {
      localStorage.setItem("promptlab_history_density_mode", mode);
    } catch (e) {
      // Fallback
    }
  };

  // Dynamic presets and models extracted from historical records
  const uniquePresets = useMemo(() => getUniquePresets(history), [history]);
  const uniqueModels = useMemo(() => getUniqueModels(history), [history]);
  const activeFilterCount = useMemo(() => countActiveFilters(filterState), [filterState]);

  const currentScope = useMemo(() => {
    return (
      SEARCH_SCOPE_OPTIONS.find((s) => s.id === filterState.searchScope) ||
      SEARCH_SCOPE_OPTIONS[0]
    );
  }, [filterState.searchScope]);

  // Close scope dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (scopeMenuRef.current && !scopeMenuRef.current.contains(e.target as Node)) {
        setIsScopeMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isScopeMenuOpen) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setIsScopeMenuOpen(false);
      }
    };
    if (isScopeMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isScopeMenuOpen]);

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

    // Compact Mode: Sleek 2-line card (Title + Media dots + Single-line excerpt)
    if (densityMode === "compact") {
      return (
        <div
          key={item.id}
          ref={isSelected ? selectedItemRef : null}
          onClick={() => onSelectItem(item.id)}
          className={`px-3 py-1.5 cursor-pointer transition-all flex flex-col gap-0.5 group relative ${
            isSelected
              ? "bg-[#FEF3C7] border-l-2 border-l-[#1A1A1A]"
              : item.isFavorite
              ? "bg-[#FFFDF5] hover:bg-[#FFF9E6] border-l-2 border-l-amber-400"
              : "bg-white hover:bg-[#F4F4F2] border-l-2 border-l-transparent"
          }`}
        >
          {/* Line 1: Star, Rank, Title / Rename, Media Dots, Cost Badge, Actions */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => onToggleFavorite(item.id, e)}
                  className={`p-0.5 -ml-1 transition-colors cursor-pointer shrink-0 ${
                    item.isFavorite
                      ? "text-amber-500 hover:text-amber-600"
                      : "text-[#888884] hover:text-amber-500 opacity-50 group-hover:opacity-100"
                  }`}
                  title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className={`w-3 h-3 ${item.isFavorite ? "fill-amber-400 text-amber-500" : ""}`} />
                </button>
              )}

              {/* Rank index when sorting by Cost or Name */}
              {typeof index === "number" && !isDateSorting && (
                <span className="bg-[#EAEAE8] text-[#1A1A1A] font-bold px-1 py-0.2 text-[7.5px] font-mono leading-none shrink-0">
                  #{index + 1}
                </span>
              )}

              {/* Title or Inline Rename Input */}
              {renamingId === item.id ? (
                <div
                  className="flex items-center gap-1 w-full min-w-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => onRenameKeyDown(item.id, e)}
                    autoFocus
                    className="w-full bg-white border border-[#1A1A1A] px-1 py-0 text-[9.5px] font-bold text-[#1A1A1A] rounded-none outline-none leading-none h-5"
                  />
                  <button
                    type="button"
                    onClick={(e) => onSaveRename(item.id, e)}
                    className="p-0.5 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                    title="Save Name"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={onCancelRename}
                    className="p-0.5 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <h4
                  className={`text-[10px] font-bold uppercase tracking-tight truncate leading-tight min-w-0 ${
                    isSelected
                      ? "text-[#1A1A1A] font-black"
                      : "text-[#333330] group-hover:text-[#1A1A1A]"
                  }`}
                  title={displayTitle}
                >
                  {displayTitle}
                </h4>
              )}
            </div>

            {/* Right: Cost Badge (on Cost Sort), Media Indicator Dots, Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Cost Badge surfaced when sorting by Cost */}
              {isCostSorting && item.estimatedCost && (
                <span className="border border-emerald-400 bg-emerald-50 text-emerald-800 px-1 py-0.2 font-mono text-[7.5px] shrink-0 uppercase font-bold leading-none">
                  {item.estimatedCost}
                </span>
              )}

              {/* Media Indicator Dots */}
              {(Boolean(item.images?.length) || vidCount > 0 || audCount > 0 || docCount > 0) && (
                <div className="flex items-center gap-1 shrink-0" title="Attached media references">
                  {item.images && item.images.length > 0 && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] shrink-0"
                      title={`${item.images.length} Image reference${item.images.length > 1 ? "s" : ""}`}
                    />
                  )}
                  {vidCount > 0 && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                      title={`${vidCount} Video reference${vidCount > 1 ? "s" : ""}`}
                    />
                  )}
                  {audCount > 0 && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0"
                      title={`${audCount} Audio reference${audCount > 1 ? "s" : ""}`}
                    />
                  )}
                  {docCount > 0 && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0"
                      title={`${docCount} Document reference${docCount > 1 ? "s" : ""}`}
                    />
                  )}
                </div>
              )}

              {/* Actions on Hover */}
              {renamingId !== item.id && (
                <div className="flex items-center gap-0.5 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={(e) => onStartRename(item, e)}
                    className="text-[#888884] hover:text-[#1A1A1A] p-0.5 transition-colors cursor-pointer"
                    title="Rename history slot"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
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
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Line 2: Single-line Output Excerpt */}
          <p
            className={`text-[9px] font-sans italic truncate leading-tight transition-colors ${
              isSelected ? "text-[#444]" : "text-[#888884] group-hover:text-[#666]"
            }`}
            title={cleanedText}
          >
            &ldquo;{outputExcerpt}&rdquo;
          </p>
        </div>
      );
    }

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
      <div className="p-3.5 border-b border-[#D1D1CF] bg-white space-y-2.5 relative z-20">
        {/* Tabs: All vs Favorites & View Density Toggle */}
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

          {/* View Density Toggle: Detailed vs Ultra-Dense Compact */}
          <div className="flex items-center gap-0.5 ml-1 border-l border-[#D1D1CF] pl-1 shrink-0">
            <button
              type="button"
              onClick={() => handleSetDensityMode("detailed")}
              className={`p-1 border transition-colors cursor-pointer ${
                densityMode === "detailed"
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-[#FAF9F6] text-[#888884] border-[#D1D1CF] hover:text-[#1A1A1A] hover:bg-white"
              }`}
              title="Detailed View (rich cards with output excerpts)"
              aria-label="Detailed View"
            >
              <LayoutList className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleSetDensityMode("compact")}
              className={`p-1 border transition-colors cursor-pointer ${
                densityMode === "compact"
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-[#FAF9F6] text-[#888884] border-[#D1D1CF] hover:text-[#1A1A1A] hover:bg-white"
              }`}
              title="Compact View (ultra-dense single-line rows)"
              aria-label="Compact View"
            >
              <Rows className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Search Input Bar with Integrated Scope Selector on the side */}
        <div className="relative flex items-stretch border border-[#D1D1CF] bg-[#FAF9F6] focus-within:border-[#1A1A1A] transition-all">
          <span className="pl-2.5 text-[#888884] pointer-events-none flex items-center shrink-0">
            <Search className="w-3.5 h-3.5" />
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
            placeholder={
              filterState.searchScope === "all"
                ? "Search all content & params..."
                : `Search in ${currentScope.label}...`
            }
            className="w-full bg-transparent py-1.5 pl-2 pr-1 text-[10px] uppercase tracking-wider font-bold outline-none text-[#1A1A1A] placeholder-stone-400 min-w-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="px-1.5 flex items-center text-[#888884] hover:text-[#1A1A1A] transition-colors cursor-pointer shrink-0"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Scope Selector on Side of Search Box */}
          <div className="relative border-l border-[#D1D1CF] shrink-0 flex items-stretch" ref={scopeMenuRef}>
            <button
              type="button"
              onClick={() => setIsScopeMenuOpen(!isScopeMenuOpen)}
              className={`px-2.5 py-1.5 flex items-center justify-center cursor-pointer transition-colors ${
                isScopeMenuOpen || filterState.searchScope !== "all"
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-white text-[#555] hover:text-[#1A1A1A] hover:bg-[#F4F4F2]"
              }`}
              title={`Search Scope: ${currentScope.label} (Click to change)`}
              aria-label={`Search Scope: ${currentScope.label}`}
            >
              <currentScope.icon className="w-3.5 h-3.5 shrink-0" />
            </button>

            {/* Scope Dropdown Menu with Rich Details */}
            {isScopeMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-[#D1D1CF] shadow-xl z-50 py-1 font-mono text-[9px] uppercase tracking-wider divide-y divide-[#EAEAE8] rounded-none animate-fade-in">
                <div className="px-2.5 py-1 text-[7.5px] font-bold text-[#888884] uppercase tracking-widest bg-[#FAF9F6]">
                  Target Search Area
                </div>
                {SEARCH_SCOPE_OPTIONS.map((opt) => {
                  const isSelected = filterState.searchScope === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFilterState((prev) => ({ ...prev, searchScope: opt.id }));
                        setIsScopeMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 flex items-start gap-2 hover:bg-[#FAF9F6] transition-colors cursor-pointer ${
                        isSelected ? "bg-[#FEF3C7] border-l-2 border-l-[#1A1A1A]" : ""
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          isSelected ? "text-[#1A1A1A]" : "text-[#888884]"
                        }`}
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-bold leading-none ${
                              isSelected ? "text-[#1A1A1A]" : "text-[#444]"
                            }`}
                          >
                            {opt.label}
                          </span>
                          {opt.id === "all" && (
                            <span className="inline-flex items-center px-1 py-0.2 text-[7px] font-mono font-bold uppercase tracking-wider border border-[#D1D1CF] bg-white text-[#666] leading-none shrink-0">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] text-[#888884] font-sans normal-case tracking-normal leading-tight mt-1">
                          {opt.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
