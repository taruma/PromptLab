"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, Star, CheckSquare, Layers } from "lucide-react";
import { UserPreset } from "../lib/preset-export";

interface PresetExportDropdownProps {
  allCount: number;
  favoritesCount: number;
  activePreset?: UserPreset | null;
  onExport: (exportType: "all" | "favorites" | "selected") => void;
  disabled?: boolean;
}

export default function PresetExportDropdown({
  allCount,
  favoritesCount,
  activePreset,
  onExport,
  disabled = false,
}: PresetExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (exportType: "all" | "favorites" | "selected") => {
    setIsOpen(false);
    onExport(exportType);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white border border-[#1A1A1A] text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export user presets to JSON"
      >
        <Download className="w-3.5 h-3.5 shrink-0 text-white" />
        <span className="hidden sm:inline">Export Presets</span>
        <ChevronDown className={`w-3 h-3 text-white transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-[#D1D1CF] shadow-xl z-50 flex flex-col p-1 text-[10px] font-mono uppercase font-bold">
          <div className="px-2 py-1 text-[8px] text-[#888884] border-b border-[#D1D1CF]/50 mb-1 font-sans">
            EXPORT USER PRESETS
          </div>

          <button
            onClick={() => handleSelect("all")}
            disabled={allCount === 0}
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#F4F4F2] text-[#1A1A1A] flex items-center justify-between transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#888884]" />
              <span>Export All</span>
            </div>
            <span className="text-[8px] bg-[#EAEAE8] text-[#888884] px-1 py-0.5">
              {allCount}
            </span>
          </button>

          <button
            onClick={() => handleSelect("favorites")}
            disabled={favoritesCount === 0}
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#F4F4F2] text-[#1A1A1A] flex items-center justify-between transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Export Favorites</span>
            </div>
            <span className="text-[8px] bg-[#EAEAE8] text-[#888884] px-1 py-0.5">
              {favoritesCount}
            </span>
          </button>

          <button
            onClick={() => handleSelect("selected")}
            disabled={!activePreset}
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#F4F4F2] text-[#1A1A1A] flex items-center justify-between transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">
                {activePreset ? activePreset.name : "Active Preset"}
              </span>
            </div>
            <span className="text-[8px] bg-[#EAEAE8] text-[#888884] px-1 py-0.5 shrink-0 ml-1">
              {activePreset ? "Active" : "None"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
