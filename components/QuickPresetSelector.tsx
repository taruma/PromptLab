"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Bookmark,
  Star,
  Settings,
  Search,
  ArrowUpDown,
  X,
  Sparkles
} from "lucide-react";
import { UserPreset } from "../lib/preset-export";

export interface PresetItem {
  id: string;
  name: string;
  systemPrompt: string;
  promptTemplate: string;
  createdAt?: string;
  updatedAt?: string;
  isFavorite?: boolean;
}

interface QuickPresetSelectorProps {
  presets: PresetItem[];
  customPresets: UserPreset[];
  systemPrompt: string;
  promptTemplate: string;
  loadedPresetId: string | null;
  pinnedPresetIds?: string[];
  onSelectPreset: (preset: PresetItem) => void;
  onOpenPromptConfig: () => void;
  onTogglePinPreset?: (id: string, e?: React.MouseEvent) => void;
}

type TabType = "all" | "favorites" | "system" | "user";
type SortMode = "date-new" | "date-old" | "name-asc" | "name-desc";

export default function QuickPresetSelector({
  presets,
  customPresets,
  systemPrompt,
  promptTemplate,
  loadedPresetId,
  pinnedPresetIds: externalPinnedIds,
  onSelectPreset,
  onOpenPromptConfig,
  onTogglePinPreset: externalTogglePin,
}: QuickPresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Persist active tab selection in localStorage
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("quick_preset_active_tab");
        if (saved && ["all", "favorites", "system", "user"].includes(saved)) {
          return saved as TabType;
        }
      } catch (e) {
        // Fallback
      }
    }
    return "all";
  });

  // Persist sort mode in localStorage
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("quick_preset_sort_mode");
        if (saved && ["date-new", "date-old", "name-asc", "name-desc"].includes(saved)) {
          return saved as SortMode;
        }
      } catch (e) {
        // Fallback
      }
    }
    return "date-new";
  });
  
  // Persist collapsible section states for 'all' tab
  const [isFavoritesOpen, setIsFavoritesOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("quick_preset_fav_open");
        if (saved !== null) return saved === "true";
      } catch (e) {
        // Fallback
      }
    }
    return true;
  });

  const [isSystemOpen, setIsSystemOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("quick_preset_sys_open");
        if (saved !== null) return saved === "true";
      } catch (e) {
        // Fallback
      }
    }
    return true;
  });

  const [isUserOpen, setIsUserOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("quick_preset_user_open");
        if (saved !== null) return saved === "true";
      } catch (e) {
        // Fallback
      }
    }
    return true;
  });

  const toggleFavoritesOpen = () => {
    setIsFavoritesOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("quick_preset_fav_open", String(next));
      } catch (e) {
        console.error("Failed to save favorites collapsible state", e);
      }
      return next;
    });
  };

  const toggleSystemOpen = () => {
    setIsSystemOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("quick_preset_sys_open", String(next));
      } catch (e) {
        console.error("Failed to save system collapsible state", e);
      }
      return next;
    });
  };

  const toggleUserOpen = () => {
    setIsUserOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("quick_preset_user_open", String(next));
      } catch (e) {
        console.error("Failed to save user collapsible state", e);
      }
      return next;
    });
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    try {
      localStorage.setItem("quick_preset_active_tab", tab);
    } catch (e) {
      console.error("Failed to save active tab preference", e);
    }
  };

  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode);
    try {
      localStorage.setItem("quick_preset_sort_mode", mode);
    } catch (e) {
      console.error("Failed to save sort mode preference", e);
    }
  };

  // Internal pinned IDs state fallback if not passed as prop
  const [internalPinnedIds, setInternalPinnedIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("prompt_generator_pinned_presets");
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const pinnedIds = externalPinnedIds !== undefined ? externalPinnedIds : internalPinnedIds;

  const handlePinToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (externalTogglePin) {
      externalTogglePin(id, e);
    } else {
      let updated: string[] = [];
      setInternalPinnedIds((prev) => {
        updated = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
        try {
          localStorage.setItem("prompt_generator_pinned_presets", JSON.stringify(updated));
        } catch (err) {
          console.error("Failed to save pinned presets", err);
        }
        return updated;
      });
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Determine active preset
  const activeSystemPreset = presets.find((p) => p.id === loadedPresetId);
  const activeCustomPreset = customPresets.find((p) => p.id === loadedPresetId);

  const matchingPreset =
    activeSystemPreset ||
    activeCustomPreset ||
    presets.find((p) => p.systemPrompt === systemPrompt && p.promptTemplate === promptTemplate) ||
    customPresets.find((p) => p.systemPrompt === systemPrompt && p.promptTemplate === promptTemplate);

  const isModified =
    matchingPreset &&
    (matchingPreset.systemPrompt !== systemPrompt || matchingPreset.promptTemplate !== promptTemplate);

  const displayLabel = matchingPreset
    ? matchingPreset.name
    : systemPrompt || promptTemplate
    ? "Custom Workspace"
    : "Select Preset";

  const isSystem = matchingPreset ? presets.some((p) => p.id === matchingPreset.id) : false;

  // Sorting helper
  const sortPresetsList = <T extends PresetItem>(list: T[]): T[] => {
    return [...list].sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      if (sortMode === "date-new") {
        const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
        const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
        if (bTime !== aTime) return bTime - aTime;
      } else if (sortMode === "date-old") {
        const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
        const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
        if (bTime !== aTime) return aTime - bTime;
      } else if (sortMode === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      return a.name.localeCompare(b.name);
    });
  };

  // Filter lists by query
  const query = searchQuery.trim().toLowerCase();
  const filterByQuery = <T extends PresetItem>(list: T[]) =>
    list.filter((p) => p.name.toLowerCase().includes(query));

  const filteredSystem = sortPresetsList(filterByQuery(presets));
  const filteredCustom = sortPresetsList(filterByQuery(customPresets));

  const allPresetsCombined: PresetItem[] = [...presets, ...customPresets];
  const favoritePresets = sortPresetsList(
    filterByQuery(allPresetsCombined.filter((p) => pinnedIds.includes(p.id)))
  );

  return (
    <div className="relative inline-block text-left" ref={containerRef} id="quick-preset-selector">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-8.5 px-3 bg-white hover:bg-[#F4F4F2] border border-[#D1D1CF] hover:border-[#1A1A1A] transition-all cursor-pointer flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] shadow-2xs rounded-none"
        title="Quick switch preset"
        id="quick-preset-trigger-btn"
      >
        <Bookmark className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span className="max-w-[130px] md:max-w-[200px] truncate font-black text-[#1A1A1A]">
          {displayLabel}
        </span>

        {matchingPreset && !isModified && (
          <span
            className={`text-[8px] font-mono font-bold px-1 py-0.2 shrink-0 ${
              isSystem ? "bg-[#EAEAE8] text-[#1A1A1A]" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {isSystem ? "SYS" : "USER"}
          </span>
        )}

        {isModified && (
          <span className="text-[8px] bg-amber-100 text-amber-800 font-mono font-bold px-1 py-0.2 shrink-0 animate-pulse">
            [EDIT]
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#888884] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[#1A1A1A]" : ""
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className="absolute left-0 mt-1.5 w-80 md:w-96 bg-white border border-[#D1D1CF] shadow-2xl z-50 flex flex-col max-h-[80vh] animate-fade-in rounded-none"
          id="quick-preset-dropdown-menu"
        >
          {/* Header & Search */}
          <div className="p-2.5 border-b border-[#D1D1CF] bg-[#F4F4F2] flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Quick Preset Selector
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPromptConfig();
                }}
                className="text-[9px] font-mono font-bold text-[#888884] hover:text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                title="Open full prompt template editor"
              >
                <Settings className="w-3 h-3" />
                Manage All
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex items-center">
              <Search className="w-3 h-3 text-[#888884] absolute left-2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search presets..."
                className="w-full bg-white border border-[#D1D1CF] pl-7 pr-7 py-1 text-[10px] outline-none focus:border-[#1A1A1A] text-[#1A1A1A] rounded-none font-mono"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-[#888884] hover:text-[#1A1A1A] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Tabs & Sorting Controls Bar */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#D1D1CF]/60">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1">
                {(["all", "favorites", "system", "user"] as TabType[]).map((tab) => {
                  const isActive = activeTab === tab;
                  const label =
                    tab === "all"
                      ? "ALL"
                      : tab === "favorites"
                      ? `★ (${pinnedIds.length})`
                      : tab === "system"
                      ? `SYS (${presets.length})`
                      : `USER (${customPresets.length})`;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => handleTabChange(tab)}
                      className={`px-1.5 py-0.5 text-[8.5px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                        isActive
                          ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                          : "bg-white text-[#888884] border-[#D1D1CF] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1">
                <ArrowUpDown className="w-2.5 h-2.5 text-[#888884]" />
                <select
                  value={sortMode}
                  onChange={(e) => handleSortChange(e.target.value as SortMode)}
                  className="bg-white border border-[#D1D1CF] text-[8.5px] font-mono font-bold text-[#1A1A1A] px-1 py-0.5 outline-none cursor-pointer"
                >
                  <option value="date-new">Newest</option>
                  <option value="date-old">Oldest</option>
                  <option value="name-asc">A-Z</option>
                  <option value="name-desc">Z-A</option>
                </select>
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar min-h-[180px]">
            {/* === TAB: ALL (Keeps section labels with collapsible headers) === */}
            {activeTab === "all" && (
              <>
                {/* FAVORITES SECTION IN 'ALL' TAB */}
                {favoritePresets.length > 0 && (
                  <div className="flex flex-col gap-1 border-b border-[#D1D1CF]/40 pb-2">
                    <button
                      type="button"
                      onClick={toggleFavoritesOpen}
                      className="px-1 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-50/80 border border-amber-200/60 font-mono flex items-center justify-between cursor-pointer hover:bg-amber-100/80"
                    >
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Favorites / Pinned ({favoritePresets.length})
                      </span>
                      {isFavoritesOpen ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>

                    {isFavoritesOpen &&
                      favoritePresets.map((preset) => (
                        <PresetRow
                          key={`fav-${preset.id}`}
                          preset={preset}
                          isActive={matchingPreset?.id === preset.id}
                          isPinned={pinnedIds.includes(preset.id)}
                          isSystem={presets.some((p) => p.id === preset.id)}
                          onSelect={() => {
                            onSelectPreset(preset);
                            setIsOpen(false);
                          }}
                          onTogglePin={(e) => handlePinToggle(preset.id, e)}
                        />
                      ))}
                  </div>
                )}

                {/* SYSTEM PRESETS IN 'ALL' TAB */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={toggleSystemOpen}
                    className="px-1 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#1A1A1A] bg-[#EAEAE8] border border-[#D1D1CF]/60 font-mono flex items-center justify-between cursor-pointer hover:bg-[#D1D1CF]/60"
                  >
                    <span>System Presets ({filteredSystem.length})</span>
                    {isSystemOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  {isSystemOpen &&
                    (filteredSystem.length > 0 ? (
                      filteredSystem.map((preset) => (
                        <PresetRow
                          key={preset.id}
                          preset={preset}
                          isActive={matchingPreset?.id === preset.id}
                          isPinned={pinnedIds.includes(preset.id)}
                          isSystem={true}
                          onSelect={() => {
                            onSelectPreset(preset);
                            setIsOpen(false);
                          }}
                          onTogglePin={(e) => handlePinToggle(preset.id, e)}
                        />
                      ))
                    ) : (
                      <div className="p-2 text-center text-[9px] text-[#888884] font-mono italic">
                        No matching system presets.
                      </div>
                    ))}
                </div>

                {/* USER PRESETS IN 'ALL' TAB */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={toggleUserOpen}
                    className="px-1 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-50 border border-emerald-200/60 font-mono flex items-center justify-between cursor-pointer hover:bg-emerald-100/60"
                  >
                    <span>User Presets ({filteredCustom.length})</span>
                    {isUserOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  {isUserOpen &&
                    (filteredCustom.length > 0 ? (
                      filteredCustom.map((preset) => (
                        <PresetRow
                          key={preset.id}
                          preset={preset}
                          isActive={matchingPreset?.id === preset.id}
                          isPinned={pinnedIds.includes(preset.id)}
                          isSystem={false}
                          onSelect={() => {
                            onSelectPreset(preset);
                            setIsOpen(false);
                          }}
                          onTogglePin={(e) => handlePinToggle(preset.id, e)}
                        />
                      ))
                    ) : (
                      <div className="p-2 text-center text-[9px] text-[#888884] font-mono italic">
                        {customPresets.length === 0
                          ? "No custom user presets saved yet."
                          : "No matching user presets."}
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* === TAB: FAVORITES (Clean listing without section label header) === */}
            {activeTab === "favorites" && (
              <div className="flex flex-col gap-1">
                {favoritePresets.length > 0 ? (
                  favoritePresets.map((preset) => (
                    <PresetRow
                      key={`fav-tab-${preset.id}`}
                      preset={preset}
                      isActive={matchingPreset?.id === preset.id}
                      isPinned={pinnedIds.includes(preset.id)}
                      isSystem={presets.some((p) => p.id === preset.id)}
                      onSelect={() => {
                        onSelectPreset(preset);
                        setIsOpen(false);
                      }}
                      onTogglePin={(e) => handlePinToggle(preset.id, e)}
                    />
                  ))
                ) : (
                  <div className="p-6 text-center text-[10px] text-[#888884] font-mono italic flex flex-col items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span>No favorite presets pinned yet.</span>
                    <span className="text-[8.5px]">Click the star icon next to any preset to pin it here.</span>
                  </div>
                )}
              </div>
            )}

            {/* === TAB: SYSTEM (Clean listing without section label header) === */}
            {activeTab === "system" && (
              <div className="flex flex-col gap-1">
                {filteredSystem.length > 0 ? (
                  filteredSystem.map((preset) => (
                    <PresetRow
                      key={`sys-tab-${preset.id}`}
                      preset={preset}
                      isActive={matchingPreset?.id === preset.id}
                      isPinned={pinnedIds.includes(preset.id)}
                      isSystem={true}
                      onSelect={() => {
                        onSelectPreset(preset);
                        setIsOpen(false);
                      }}
                      onTogglePin={(e) => handlePinToggle(preset.id, e)}
                    />
                  ))
                ) : (
                  <div className="p-6 text-center text-[10px] text-[#888884] font-mono italic">
                    No matching system presets found.
                  </div>
                )}
              </div>
            )}

            {/* === TAB: USER (Clean listing without section label header) === */}
            {activeTab === "user" && (
              <div className="flex flex-col gap-1">
                {filteredCustom.length > 0 ? (
                  filteredCustom.map((preset) => (
                    <PresetRow
                      key={`user-tab-${preset.id}`}
                      preset={preset}
                      isActive={matchingPreset?.id === preset.id}
                      isPinned={pinnedIds.includes(preset.id)}
                      isSystem={false}
                      onSelect={() => {
                        onSelectPreset(preset);
                        setIsOpen(false);
                      }}
                      onTogglePin={(e) => handlePinToggle(preset.id, e)}
                    />
                  ))
                ) : (
                  <div className="p-6 text-center text-[10px] text-[#888884] font-mono italic">
                    {customPresets.length === 0
                      ? "No custom user presets saved yet."
                      : "No matching user presets found."}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2 border-t border-[#D1D1CF] bg-[#F4F4F2] shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenPromptConfig();
              }}
              className="w-full py-1.5 bg-white hover:bg-[#EAEAE8] border border-[#D1D1CF] text-[9.5px] font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <Settings className="w-3 h-3 text-[#888884]" />
              Manage All Presets & Prompts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Single Row Component for Presets
function PresetRow({
  preset,
  isActive,
  isPinned,
  isSystem,
  onSelect,
  onTogglePin,
}: {
  preset: PresetItem;
  isActive: boolean;
  isPinned: boolean;
  isSystem: boolean;
  onSelect: () => void;
  onTogglePin: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`w-full text-left px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between border transition-all cursor-pointer group ${
        isActive
          ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
          : "bg-[#F4F4F2] text-[#1A1A1A] border-transparent hover:border-[#D1D1CF] hover:bg-white"
      }`}
    >
      <div className="flex items-center gap-1.5 truncate pr-2">
        <button
          type="button"
          onClick={onTogglePin}
          title={isPinned ? "Unpin from favorites" : "Pin to favorites"}
          className="p-0.5 text-[#888884] hover:text-amber-500 transition-colors cursor-pointer shrink-0"
        >
          <Star
            className={`w-3 h-3 ${
              isPinned
                ? "fill-amber-400 text-amber-500"
                : "text-stone-400 opacity-60 group-hover:opacity-100"
            }`}
          />
        </button>
        <span className="truncate">{preset.name}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0 font-mono text-[8px]">
        {isActive && (
          <span className="bg-emerald-600 text-white px-1 py-0.2 font-bold flex items-center gap-0.5">
            <Check className="w-2.5 h-2.5" /> ACT
          </span>
        )}
        <span
          className={`px-1 py-0.2 font-bold ${
            isActive
              ? "text-stone-[#300]"
              : isSystem
              ? "text-[#888884]"
              : "text-emerald-700 bg-emerald-100/60"
          }`}
        >
          {isSystem ? "SYS" : "USER"}
        </span>
      </div>
    </div>
  );
}
