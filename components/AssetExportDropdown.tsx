"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, Upload, ChevronDown, CheckSquare, Layers, FolderDown, Star } from "lucide-react";

interface AssetExportDropdownProps {
  totalCount: number;
  selectedCount: number;
  favoritesCount?: number;
  onExportAll: () => void;
  onExportFavorites?: () => void;
  onExportSelected: () => void;
  onImportClick: () => void;
  disabled?: boolean;
}

export default function AssetExportDropdown({
  totalCount,
  selectedCount,
  favoritesCount = 0,
  onExportAll,
  onExportFavorites,
  onExportSelected,
  onImportClick,
  disabled = false,
}: AssetExportDropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key (capture phase per modal-overlay-architecture)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setIsOpen(false);
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
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="asset-export-dropdown-wrapper">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-2 py-1.5 sm:px-2.5 bg-[#1A1A1A] hover:bg-[#333333] text-white border border-[#1A1A1A] text-[8.5px] sm:text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed font-mono whitespace-nowrap"
        title="Backup or Restore Asset Library (JSON)"
        id="asset-library-port-btn"
      >
        <FolderDown className="w-3.5 h-3.5 shrink-0 text-white" />
        <span>Backup / Restore</span>
        <ChevronDown className={`w-3 h-3 text-white transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-1 w-56 bg-white border border-[#D1D1CF] shadow-xl z-50 flex flex-col p-1 text-[10px] font-mono uppercase font-bold animate-fade-in"
          id="asset-export-menu"
        >
          <div className="px-2 py-1 text-[8px] text-[#888884] border-b border-[#D1D1CF]/50 mb-1 font-sans">
            ASSET BACKUP & RESTORE (JSON)
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onImportClick();
            }}
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#F4F4F2] text-[#1A1A1A] flex items-center justify-between transition-colors cursor-pointer"
            id="import-assets-option"
          >
            <div className="flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Import Assets</span>
            </div>
            <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.5">
              .JSON
            </span>
          </button>

          <div className="my-1 border-t border-[#D1D1CF]/50" />

          {/* Export All */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onExportAll();
            }}
            disabled={totalCount === 0}
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#F4F4F2] text-[#1A1A1A] flex items-center justify-between transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            id="export-all-assets-option"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#888884]" />
              <span>Export All</span>
            </div>
            <span className="text-[8px] bg-[#EAEAE8] text-[#888884] px-1 py-0.5">
              {totalCount}
            </span>
          </button>

          {/* Export Favorites / Pinned */}
          {onExportFavorites && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onExportFavorites();
              }}
              disabled={favoritesCount === 0}
              className="w-full text-left px-2.5 py-1.5 hover:bg-[#F4F4F2] text-[#1A1A1A] flex items-center justify-between transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              id="export-favorites-assets-option"
            >
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                <span>Export Favorites</span>
              </div>
              <span className="text-[8px] bg-[#EAEAE8] text-[#888884] px-1 py-0.5">
                {favoritesCount}
              </span>
            </button>
          )}

          {/* Export Selected */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onExportSelected();
            }}
            disabled={selectedCount === 0}
            className="w-full text-left px-2.5 py-1.5 hover:bg-[#F4F4F2] text-[#1A1A1A] flex items-center justify-between transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            id="export-selected-assets-option"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckSquare className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" />
              <span className="truncate">Export Selected</span>
            </div>
            <span className="text-[8px] bg-[#EAEAE8] text-[#888884] px-1 py-0.5">
              {selectedCount}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
