"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Settings,
  FolderOpen,
  RefreshCw,
  Search,
  X,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Star,
  GitCompare,
  Trash2,
  Check,
  Sparkles,
} from "lucide-react";
import PresetExportDropdown from "./PresetExportDropdown";
import PromptTemplateHelpTooltip from "./PromptTemplateHelpTooltip";
import { type UserPreset } from "../lib/preset-export";
import { type PresetConfig } from "./PresetCompareModal";
import { formatPresetDateShort } from "../lib/utils";

export interface SystemPresetItem {
  id: string;
  name: string;
  systemPrompt: string;
  promptTemplate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromptConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  promptTemplate: string;
  defaultSystemPrompt: string;
  defaultPromptTemplate: string;
  tempSystemPrompt: string;
  setTempSystemPrompt: (val: string) => void;
  tempPromptTemplate: string;
  setTempPromptTemplate: (val: string) => void;
  presets: SystemPresetItem[];
  customPresets: UserPreset[];
  setCustomPresets: React.Dispatch<React.SetStateAction<UserPreset[]>>;
  loadedPresetId: string | null;
  setLoadedPresetId: (val: string | null) => void;
  activeEditingPresetId: string | null;
  setActiveEditingPresetId: (val: string | null) => void;
  newPresetName: string;
  setNewPresetName: (val: string) => void;
  pinnedPresetIds: string[];
  setPinnedPresetIds: React.Dispatch<React.SetStateAction<string[]>>;
  presetStatusBanner: { message: string; isError?: boolean } | null;
  setPresetStatusBanner: (val: { message: string; isError?: boolean } | null) => void;
  activeProjectName?: string;
  onApply: () => void;
  onResetPrompts: () => void;
  onSaveCustomPreset: () => void;
  onUpdateCustomPreset: () => void;
  onDeleteCustomPreset: (id: string, e: React.MouseEvent) => void;
  onExportPresets: (exportType: "all" | "favorites" | "selected") => void;
  onImportPresets: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenComparePreset: (preset: PresetConfig) => void;
  extractVariables: (templateText: string) => string[];
}

export default function PromptConfigModal({
  isOpen,
  onClose,
  systemPrompt,
  promptTemplate,
  defaultSystemPrompt,
  defaultPromptTemplate,
  tempSystemPrompt,
  setTempSystemPrompt,
  tempPromptTemplate,
  setTempPromptTemplate,
  presets,
  customPresets,
  setCustomPresets,
  loadedPresetId,
  setLoadedPresetId,
  activeEditingPresetId,
  setActiveEditingPresetId,
  newPresetName,
  setNewPresetName,
  pinnedPresetIds,
  setPinnedPresetIds,
  presetStatusBanner,
  setPresetStatusBanner,
  activeProjectName,
  onApply,
  onResetPrompts,
  onSaveCustomPreset,
  onUpdateCustomPreset,
  onDeleteCustomPreset,
  onExportPresets,
  onImportPresets,
  onOpenComparePreset,
  extractVariables,
}: PromptConfigModalProps) {
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Internal UI states initialized lazily from localStorage
  const [presetSearch, setPresetSearch] = useState<string>("");
  const [activePresetTab, setActivePresetTab] = useState<"all" | "system" | "custom">(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTab = localStorage.getItem("prompt_generator_preset_filter_tab");
        if (savedTab && (savedTab === "all" || savedTab === "system" || savedTab === "custom")) {
          return savedTab;
        }
      } catch {}
    }
    return "all";
  });
  const [presetSortMode, setPresetSortMode] = useState<"date-new" | "date-old" | "name-asc" | "name-desc">(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSort = localStorage.getItem("prompt_generator_preset_sort");
        if (savedSort && (savedSort === "date-new" || savedSort === "date-old" || savedSort === "name-asc" || savedSort === "name-desc")) {
          return savedSort;
        }
      } catch {}
    }
    return "date-new";
  });
  const [isSystemPresetsOpen, setIsSystemPresetsOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedSysOpen = localStorage.getItem("prompt_generator_sys_presets_open");
        if (savedSysOpen !== null) {
          return savedSysOpen === "true";
        }
      } catch {}
    }
    return true;
  });
  const [isCustomPresetsOpen, setIsCustomPresetsOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCustomOpen = localStorage.getItem("prompt_generator_custom_presets_open");
        if (savedCustomOpen !== null) {
          return savedCustomOpen === "true";
        }
      } catch {}
    }
    return true;
  });

  if (!isOpen) return null;

  const togglePinPreset = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updatedPinned: string[] = [];
    setPinnedPresetIds((prev) => {
      updatedPinned = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      try {
        localStorage.setItem("prompt_generator_pinned_presets", JSON.stringify(updatedPinned));
      } catch (err) {
        console.error("Failed to save pinned presets", err);
      }
      return updatedPinned;
    });

    setCustomPresets((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          return { ...p, isFavorite: updatedPinned.includes(id) };
        }
        return p;
      });
      try {
        localStorage.setItem("prompt_generator_custom_presets", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to update custom presets in localStorage", err);
      }
      return updated;
    });
  };

  const handleSortChange = (mode: "date-new" | "date-old" | "name-asc" | "name-desc") => {
    setPresetSortMode(mode);
    try {
      localStorage.setItem("prompt_generator_preset_sort", mode);
    } catch (e) {
      console.error("Failed to save preset sort mode", e);
    }
  };

  const handlePresetTabChange = (tab: "all" | "system" | "custom") => {
    setActivePresetTab(tab);
    try {
      localStorage.setItem("prompt_generator_preset_filter_tab", tab);
    } catch (e) {
      console.error("Failed to save preset filter tab", e);
    }
  };

  const sortAndFilterPresets = <T extends { id: string; name: string; systemPrompt: string; promptTemplate: string; createdAt?: string; updatedAt?: string }>(
    presetList: T[]
  ): T[] => {
    const filtered = presetList.filter((p) => p.name.toLowerCase().includes(presetSearch.toLowerCase()));

    return [...filtered].sort((a, b) => {
      const aPinned = pinnedPresetIds.includes(a.id);
      const bPinned = pinnedPresetIds.includes(b.id);

      // Pinned items always sort to top
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      if (presetSortMode === "date-new") {
        const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
        const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
        if (bTime !== aTime) return bTime - aTime;
      } else if (presetSortMode === "date-old") {
        const aTime = Date.parse(a.updatedAt || a.createdAt || "") || 0;
        const bTime = Date.parse(b.updatedAt || b.createdAt || "") || 0;
        if (bTime !== aTime) return aTime - bTime;
      } else if (presetSortMode === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      return a.name.localeCompare(b.name);
    });
  };

  const isPresetModified = () => {
    if (!loadedPresetId) return false;
    const preset = presets.find((p) => p.id === loadedPresetId) || customPresets.find((p) => p.id === loadedPresetId);
    if (!preset) return false;
    return tempSystemPrompt !== preset.systemPrompt || tempPromptTemplate !== preset.promptTemplate;
  };

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6" id="prompt-config-modal">
      <div className="bg-white border border-[#D1D1CF] w-full max-w-5xl h-[85vh] flex flex-col justify-between shadow-2xl relative">
        {/* Hidden Input for User Presets Import */}
        <input
          type="file"
          ref={jsonInputRef}
          onChange={onImportPresets}
          accept=".json"
          className="hidden"
        />

        {/* Modal Header */}
        <div className="h-16 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#888884]" />
            <h3 className="text-xs font-black uppercase tracking-wider font-sans">
              System Prompt & Template Editor
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-[#F4F4F2] text-[#1A1A1A] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Import user presets JSON file"
            >
              <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#888884]" />
              <span className="hidden sm:inline">Import Presets</span>
            </button>

            <PresetExportDropdown
              allCount={customPresets.length}
              favoritesCount={customPresets.filter((p) => p.isFavorite || pinnedPresetIds.includes(p.id)).length}
              activePreset={
                activeEditingPresetId
                  ? customPresets.find((p) => p.id === activeEditingPresetId) || null
                  : loadedPresetId
                  ? presets.find((p) => p.id === loadedPresetId) || customPresets.find((p) => p.id === loadedPresetId) || null
                  : null
              }
              onExport={onExportPresets}
            />

            <button
              onClick={onResetPrompts}
              className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-[#D1D1CF] hover:border-red-300 text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Deselect active preset and reset system prompt and template"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span className="hidden sm:inline">Reset Prompts</span>
            </button>

            <button
              onClick={onClose}
              className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer ml-2"
            >
              [ESC] CLOSE
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {presetStatusBanner && (
          <div
            className={`px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-wider border-b flex items-center justify-between shrink-0 animate-fade-in ${
              presetStatusBanner.isError
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            <span>{presetStatusBanner.isError ? "[ERROR] " : "[✓] "}{presetStatusBanner.message}</span>
            <button
              onClick={() => setPresetStatusBanner(null)}
              className="hover:opacity-75 cursor-pointer ml-4 font-sans text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#F4F4F2]/50">
          {/* Left Sidebar: Presets & Disk Management */}
          <div className="w-full md:w-72 border-r border-[#D1D1CF] bg-white p-4 flex flex-col gap-3.5 shrink-0 overflow-hidden">
            {/* Preset Search, Filter & Sort Controls */}
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-3.5 h-3.5 text-[#888884] absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search presets..."
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    className="w-full bg-[#F4F4F2] border border-[#D1D1CF] pl-8 pr-7 py-1.5 text-[10px] uppercase font-bold tracking-wider outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A]"
                  />
                  {presetSearch && (
                    <button
                      onClick={() => setPresetSearch("")}
                      className="absolute right-2 text-[#888884] hover:text-[#1A1A1A] cursor-pointer p-0.5 transition-colors"
                      title="Instant clear search filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Compact Symbol Sorter */}
                <div className="relative flex items-center border border-[#D1D1CF] bg-[#F4F4F2] hover:bg-white px-1.5 py-1.5 transition-colors shrink-0" title="Sort presets (NEW / OLD / A-Z / Z-A)">
                  <ArrowUpDown className="w-3 h-3 text-[#888884] shrink-0 mr-0.5 pointer-events-none" />
                  <select
                    value={presetSortMode}
                    onChange={(e) => handleSortChange(e.target.value as "date-new" | "date-old" | "name-asc" | "name-desc")}
                    className="bg-transparent text-[8px] font-black uppercase tracking-wider outline-none text-[#1A1A1A] cursor-pointer py-0.5"
                  >
                    <option value="date-new">NEW</option>
                    <option value="date-old">OLD</option>
                    <option value="name-asc">A-Z</option>
                    <option value="name-desc">Z-A</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 w-full border border-[#D1D1CF] bg-[#F4F4F2] p-0.5">
                <button
                  onClick={() => handlePresetTabChange("all")}
                  className={`text-[8px] font-black uppercase tracking-wider py-1 text-center transition-all cursor-pointer ${
                    activePresetTab === "all"
                      ? "bg-white text-[#1A1A1A] border border-[#D1D1CF]/30 shadow-xs"
                      : "text-[#888884] hover:text-[#1A1A1A]"
                  }`}
                >
                  All ({presets.length + customPresets.length})
                </button>
                <button
                  onClick={() => handlePresetTabChange("system")}
                  className={`text-[8px] font-black uppercase tracking-wider py-1 text-center transition-all cursor-pointer ${
                    activePresetTab === "system"
                      ? "bg-white text-[#1A1A1A] border border-[#D1D1CF]/30 shadow-xs"
                      : "text-[#888884] hover:text-[#1A1A1A]"
                  }`}
                >
                  Sys ({presets.length})
                </button>
                <button
                  onClick={() => handlePresetTabChange("custom")}
                  className={`text-[8px] font-black uppercase tracking-wider py-1 text-center transition-all cursor-pointer ${
                    activePresetTab === "custom"
                      ? "bg-white text-[#1A1A1A] border border-[#D1D1CF]/30 shadow-xs"
                      : "text-[#888884] hover:text-[#1A1A1A]"
                  }`}
                >
                  User ({customPresets.length})
                </button>
              </div>
            </div>

            <hr className="border-[#D1D1CF] shrink-0" />

            {/* Scrollable Preset Lists Container */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-4">
              {/* System Presets */}
              {(activePresetTab === "all" || activePresetTab === "system") && (
                <div>
                  {activePresetTab === "all" && (
                    <button
                      onClick={() => {
                        const newVal = !isSystemPresetsOpen;
                        setIsSystemPresetsOpen(newVal);
                        localStorage.setItem("prompt_generator_sys_presets_open", String(newVal));
                      }}
                      className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] mb-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>System Presets</span>
                        <span className="text-[8px] bg-[#EAEAE8] text-[#888884] px-1 py-0.5 font-mono">
                          {presetSearch
                            ? `${sortAndFilterPresets(presets).length}/${presets.length}`
                            : presets.length}
                        </span>
                      </div>
                      {isSystemPresetsOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#888884]" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#888884]" />
                      )}
                    </button>
                  )}

                  {(activePresetTab === "system" || isSystemPresetsOpen) && (
                    <div className="flex flex-col gap-1 transition-all">
                      {sortAndFilterPresets(presets).map((preset) => {
                        const isLoaded = loadedPresetId === preset.id;
                        const isModified =
                          isLoaded &&
                          (tempSystemPrompt !== preset.systemPrompt || tempPromptTemplate !== preset.promptTemplate);
                        const isPinned = pinnedPresetIds.includes(preset.id);
                        const updatedDate = formatPresetDateShort(preset.updatedAt || preset.createdAt);
                        const hoverTitle = updatedDate ? `${preset.name} (Updated: ${updatedDate})` : preset.name;

                        return (
                          <div
                            key={preset.id}
                            className={`w-full border flex items-center justify-between transition-all text-[9px] font-bold uppercase tracking-wider ${
                              isLoaded
                                ? isModified
                                  ? "bg-amber-50 border-amber-500 text-amber-900 shadow-xs"
                                  : "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                                : "bg-[#F4F4F2] text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                            }`}
                          >
                            <button
                              onClick={(e) => togglePinPreset(preset.id, e)}
                              className={`p-1.5 cursor-pointer border-r shrink-0 transition-colors ${
                                isLoaded
                                  ? isModified
                                    ? "border-amber-500/30 hover:bg-amber-100"
                                    : "border-[#333] hover:bg-[#333]"
                                  : "border-[#D1D1CF] hover:bg-white"
                              }`}
                              title={isPinned ? "Unstar preset" : "Star preset to top"}
                            >
                              <Star
                                className={`w-3 h-3 ${
                                  isPinned ? "fill-amber-400 text-amber-500" : "text-[#888884] hover:text-amber-500"
                                }`}
                              />
                            </button>

                            <button
                              onClick={() => {
                                setTempSystemPrompt(preset.systemPrompt);
                                setTempPromptTemplate(preset.promptTemplate);
                                setActiveEditingPresetId(null);
                                setNewPresetName("");
                                setLoadedPresetId(preset.id);
                                try {
                                  localStorage.setItem("prompt_generator_loaded_preset_id", preset.id);
                                } catch (e) {}
                              }}
                              className="flex-1 text-left cursor-pointer truncate flex items-center gap-1.5 justify-between min-w-0 px-2 py-1"
                              title={hoverTitle}
                            >
                              <span className="truncate">{preset.name}</span>
                              {isModified && (
                                <span className="text-[8px] bg-amber-200 text-amber-800 px-1 py-0.5 rounded-none font-mono font-bold shrink-0 animate-pulse ml-1">
                                  [EDIT]
                                </span>
                              )}
                              {isLoaded && !isModified && (
                                <span className="text-[8px] bg-emerald-700 text-white px-1 py-0.5 rounded-none font-mono font-bold shrink-0 ml-1">
                                  [ACT]
                                </span>
                              )}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenComparePreset(preset);
                              }}
                              className={`p-1.5 transition-all cursor-pointer border-l shrink-0 ${
                                isLoaded
                                  ? isModified
                                    ? "border-amber-500/30 hover:bg-amber-100 text-amber-700"
                                    : "border-[#333] hover:bg-[#333] text-amber-400"
                                  : "border-[#D1D1CF] hover:bg-white text-[#888884] hover:text-[#1A1A1A]"
                              }`}
                              title="Compare differences with active workspace"
                            >
                              <GitCompare className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                      {sortAndFilterPresets(presets).length === 0 && (
                        <div className="text-[9px] text-[#888884] font-mono italic p-2 border border-[#D1D1CF] bg-[#F4F4F2] uppercase text-center">
                          No Matches Found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Presets */}
              {(activePresetTab === "all" || activePresetTab === "custom") && (
                <div>
                  {activePresetTab === "all" && (
                    <button
                      onClick={() => {
                        const newVal = !isCustomPresetsOpen;
                        setIsCustomPresetsOpen(newVal);
                        localStorage.setItem("prompt_generator_custom_presets_open", String(newVal));
                      }}
                      className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#1A1A1A] mb-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Your Presets</span>
                        <span className="text-[8px] bg-[#EAEAE8] text-[#888884] px-1 py-0.5 font-mono">
                          {presetSearch
                            ? `${sortAndFilterPresets(customPresets).length}/${customPresets.length}`
                            : customPresets.length}
                        </span>
                      </div>
                      {isCustomPresetsOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#888884]" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#888884]" />
                      )}
                    </button>
                  )}

                  {(activePresetTab === "custom" || isCustomPresetsOpen) && (
                    <div className="flex flex-col gap-1 transition-all">
                      {sortAndFilterPresets(customPresets).map((preset) => {
                        const isLoaded = loadedPresetId === preset.id;
                        const isModified =
                          isLoaded &&
                          (tempSystemPrompt !== preset.systemPrompt || tempPromptTemplate !== preset.promptTemplate);
                        const isPinned = pinnedPresetIds.includes(preset.id);
                        const updatedDate = formatPresetDateShort(preset.updatedAt || preset.createdAt);
                        const hoverTitle = updatedDate ? `${preset.name} (Updated: ${updatedDate})` : preset.name;

                        return (
                          <div
                            key={preset.id}
                            className={`w-full border flex items-center justify-between transition-all text-[9px] font-bold uppercase tracking-wider ${
                              isLoaded
                                ? isModified
                                  ? "bg-amber-50 border-amber-500 text-amber-900 shadow-xs"
                                  : "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                                : "bg-[#F4F4F2] text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                            }`}
                          >
                            <button
                              onClick={(e) => togglePinPreset(preset.id, e)}
                              className={`p-1.5 cursor-pointer border-r shrink-0 transition-colors ${
                                isLoaded
                                  ? isModified
                                    ? "border-amber-500/30 hover:bg-amber-100"
                                    : "border-[#333] hover:bg-[#333]"
                                  : "border-[#D1D1CF] hover:bg-white"
                              }`}
                              title={isPinned ? "Unstar preset" : "Star preset to top"}
                            >
                              <Star
                                className={`w-3 h-3 ${
                                  isPinned ? "fill-amber-400 text-amber-500" : "text-[#888884] hover:text-amber-500"
                                }`}
                              />
                            </button>

                            <button
                              onClick={() => {
                                setTempSystemPrompt(preset.systemPrompt);
                                setTempPromptTemplate(preset.promptTemplate);
                                setActiveEditingPresetId(preset.id);
                                setNewPresetName(preset.name);
                                setLoadedPresetId(preset.id);
                                try {
                                  localStorage.setItem("prompt_generator_loaded_preset_id", preset.id);
                                } catch (e) {}
                              }}
                              className="flex-1 text-left cursor-pointer truncate flex items-center gap-1.5 justify-between min-w-0 px-2 py-1"
                              title={hoverTitle}
                            >
                              <span className="truncate">{preset.name}</span>
                              {isModified && (
                                <span className="text-[8px] bg-amber-200 text-amber-800 px-1 py-0.5 rounded-none font-mono font-bold shrink-0 animate-pulse ml-1">
                                  [EDIT]
                                </span>
                              )}
                              {isLoaded && !isModified && (
                                <span className="text-[8px] bg-emerald-700 text-white px-1 py-0.5 rounded-none font-mono font-bold shrink-0 ml-1">
                                  [ACT]
                                </span>
                              )}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenComparePreset(preset);
                              }}
                              className={`p-1.5 transition-all cursor-pointer border-l shrink-0 ${
                                isLoaded
                                  ? isModified
                                    ? "border-amber-500/30 hover:bg-amber-100 text-amber-700"
                                    : "border-[#333] hover:bg-[#333] text-amber-400"
                                  : "border-[#D1D1CF] hover:bg-white text-[#888884] hover:text-[#1A1A1A]"
                              }`}
                              title="Compare differences with active workspace"
                            >
                              <GitCompare className="w-3 h-3" />
                            </button>

                            <button
                              onClick={(e) => onDeleteCustomPreset(preset.id, e)}
                              className={`p-1.5 transition-all cursor-pointer border-l shrink-0 hover:text-red-500 ${
                                isLoaded
                                  ? isModified
                                    ? "border-amber-500/30 hover:bg-amber-100"
                                    : "border-[#333] hover:bg-[#333]"
                                  : "border-[#D1D1CF] hover:bg-white"
                              }`}
                              title="Delete preset"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                      {sortAndFilterPresets(customPresets).length === 0 && (
                        <div className="text-[9px] text-[#888884] font-mono italic p-2 border border-[#D1D1CF] bg-[#F4F4F2] uppercase text-center">
                          No Matches Found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Bottom Save / Workspace Area */}
            <div className="shrink-0 pt-3 border-t border-[#D1D1CF] bg-white flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1A1A1A]">
                  {activeEditingPresetId ? "Preset Workspace" : "Save Current As Preset"}
                </h4>
                {loadedPresetId && (
                  <button
                    onClick={() => {
                      setActiveEditingPresetId(null);
                      setNewPresetName("");
                      setLoadedPresetId(null);
                      try {
                        localStorage.removeItem("prompt_generator_loaded_preset_id");
                      } catch (e) {}
                    }}
                    className="text-[9px] font-mono font-bold text-red-500 hover:text-red-700 uppercase cursor-pointer"
                    title="Deselect loaded preset to start a new workspace"
                  >
                    [Deselect]
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-preset-name" className="sr-only">
                  New Preset Name
                </label>
                <input
                  id="new-preset-name"
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Preset name (e.g. Scriptwriter)"
                  className="w-full bg-[#F4F4F2] border border-[#D1D1CF] p-2 text-[10px] outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A]"
                />
                {activeEditingPresetId ? (
                  <div className="flex flex-col gap-1.5">
                    {isPresetModified() && (
                      <p className="text-[8px] text-amber-700 font-mono font-black uppercase leading-tight tracking-wider animate-pulse flex items-center gap-1">
                        <span>● PRESET HAS UNSAVED CHANGES</span>
                      </p>
                    )}
                    <button
                      onClick={onUpdateCustomPreset}
                      className={`w-full py-2 text-white text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                        isPresetModified()
                          ? "bg-amber-600 hover:bg-amber-700 border-amber-600 shadow-sm animate-pulse"
                          : "bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      Update Loaded Preset
                    </button>
                    <button
                      onClick={onSaveCustomPreset}
                      className="w-full py-1.5 bg-white hover:bg-[#F4F4F2] text-[#1A1A1A] border border-[#D1D1CF] text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                      Save As New Preset
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {!activeEditingPresetId && isPresetModified() && (
                      <p className="text-[8px] text-amber-700 font-mono font-black uppercase leading-tight tracking-wider flex items-center gap-1">
                        <span>● MODIFIED SYSTEM PRESET (SAVE NEW)</span>
                      </p>
                    )}
                    <button
                      onClick={onSaveCustomPreset}
                      className="w-full py-2 bg-[#1A1A1A] text-white hover:bg-[#333] border border-[#1A1A1A] text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                      Save Preset
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Editors Space */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5">
            {/* Workspace code grids */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-1 min-h-0">
              {/* System Prompt block */}
              <div className="flex flex-col gap-2 min-h-[250px]">
                <label htmlFor="modal-system-prompt" className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]">
                  System Instructions
                </label>
                <textarea
                  id="modal-system-prompt"
                  value={tempSystemPrompt}
                  onChange={(e) => setTempSystemPrompt(e.target.value)}
                  placeholder="Define the core persona and rules for the Gemini model..."
                  className="flex-1 w-full bg-white border border-[#D1D1CF] p-4 text-xs font-mono leading-relaxed outline-none focus:border-[#1A1A1A] resize-none text-[#1A1A1A] placeholder-stone-400 custom-scrollbar h-full"
                />
              </div>

              {/* Prompt Template block */}
              <div className="flex flex-col gap-2 min-h-[250px]">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="modal-prompt-template" className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A]">
                      Prompt Template
                    </label>
                    <PromptTemplateHelpTooltip />
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span
                      className={`text-[8px] px-1.5 py-0.5 border font-bold uppercase transition-all ${
                        /\{\{\s*idea\s*\}\}/.test(tempPromptTemplate)
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                      title={
                        /\{\{\s*idea\s*\}\}/.test(tempPromptTemplate)
                          ? "{{ idea }} placeholder connects to Main Objective / Idea"
                          : "{{ idea }} placeholder is missing from prompt template"
                      }
                    >
                      {/\{\{\s*idea\s*\}\}/.test(tempPromptTemplate) ? "✓ {{ idea }}" : "⚠️ {{ idea }} missing"}
                    </span>
                    <span
                      className={`text-[8px] px-1.5 py-0.5 border font-bold uppercase transition-all ${
                        /\{\{\s*(visual_references|cast)\s*\}\}/.test(tempPromptTemplate)
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                      title={
                        /\{\{\s*(visual_references|cast)\s*\}\}/.test(tempPromptTemplate)
                          ? "Media references placeholder is present"
                          : "{{ visual_references }} or {{ cast }} placeholder is missing from prompt template"
                      }
                    >
                      {/\{\{\s*cast\s*\}\}/.test(tempPromptTemplate)
                        ? "✓ {{ cast }}"
                        : /\{\{\s*visual_references\s*\}\}/.test(tempPromptTemplate)
                        ? "✓ {{ visual_references }}"
                        : "⚠️ {{ visual_references }} missing"}
                    </span>
                  </div>
                </div>
                <textarea
                  id="modal-prompt-template"
                  value={tempPromptTemplate}
                  onChange={(e) => setTempPromptTemplate(e.target.value)}
                  placeholder="Build custom prompts using {{ variable_name }} templates..."
                  className="flex-1 w-full bg-white border border-[#D1D1CF] p-4 text-xs font-mono leading-relaxed outline-none focus:border-[#1A1A1A] resize-none text-[#1A1A1A] placeholder-stone-400 custom-scrollbar h-full"
                />
              </div>
            </div>

            {/* Active Dynamic Variables parsed */}
            <div className="bg-white border border-[#D1D1CF] p-3 flex flex-col gap-1.5 shrink-0">
              <span className="text-[9px] uppercase tracking-wider font-bold text-[#888884] font-mono">
                Live Parsed Template Variables ({extractVariables(tempPromptTemplate).filter((v) => v !== "visual_references" && v !== "cast" && v !== "idea").length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {extractVariables(tempPromptTemplate)
                  .filter((v) => v !== "visual_references" && v !== "cast" && v !== "idea")
                  .map((v) => (
                    <span key={v} className="text-[9px] bg-[#EAEAE8] text-[#1A1A1A] px-2 py-0.5 font-mono border border-[#D1D1CF] uppercase">
                      {v}
                    </span>
                  ))}
                {extractVariables(tempPromptTemplate).filter((v) => v !== "visual_references" && v !== "cast" && v !== "idea").length === 0 && (
                  <span className="text-[9px] text-[#888884] italic font-mono uppercase">
                    No custom variables detected
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-end bg-[#F4F4F2] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onApply}
              className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A]"
            >
              Apply & Compile Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
