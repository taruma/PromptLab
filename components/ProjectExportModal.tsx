"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Download,
  FolderKanban,
  HardDrive,
  Minimize2,
  FileCode,
  Bookmark,
  History,
  Layers,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sliders
} from "lucide-react";
import { Project, ProjectExportOptions } from "../lib/projects";
import { useModalEscape } from "../hooks/use-modal-stack";

interface ProjectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onConfirmExport: (options: ProjectExportOptions) => Promise<void>;
}

type ExportMode = "full" | "compact" | "template" | "custom";

export default function ProjectExportModal({
  isOpen,
  onClose,
  project,
  onConfirmExport,
}: ProjectExportModalProps) {
  // Register with global LIFO modal escape stack (Tier 3)
  useModalEscape(isOpen, onClose);

  const [mode, setMode] = useState<ExportMode>("full");
  const [includePresets, setIncludePresets] = useState<boolean>(true);
  const [includeAssets, setIncludeAssets] = useState<boolean>(true);
  const [includeHistory, setIncludeHistory] = useState<boolean>(true);
  const [includeHistoryImages, setIncludeHistoryImages] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Compute metrics from project
  const presetsCount = project?.customPresets?.length || 0;
  const assetCount = project?.assetLibrary?.length || 0;
  const historyCount = project?.history?.length || 0;

  // Count total history images
  const historyImageCount = useMemo(() => {
    if (!project?.history || !Array.isArray(project.history)) return 0;
    let count = 0;
    for (const item of project.history) {
      if (item.images && Array.isArray(item.images)) {
        count += item.images.length;
      }
    }
    return count;
  }, [project?.history]);

  // Handle quick mode changes
  const handleSelectMode = (newMode: ExportMode) => {
    setMode(newMode);
    if (newMode === "full") {
      setIncludePresets(true);
      setIncludeAssets(true);
      setIncludeHistory(true);
      setIncludeHistoryImages(true);
    } else if (newMode === "compact") {
      setIncludePresets(true);
      setIncludeAssets(true);
      setIncludeHistory(true);
      setIncludeHistoryImages(false);
    } else if (newMode === "template") {
      setIncludePresets(true);
      setIncludeAssets(true);
      setIncludeHistory(false);
      setIncludeHistoryImages(false);
    }
  };

  const handleCustomToggle = (
    key: "presets" | "assets" | "history" | "historyImages",
    value: boolean
  ) => {
    setMode("custom");
    if (key === "presets") setIncludePresets(value);
    if (key === "assets") setIncludeAssets(value);
    if (key === "history") {
      setIncludeHistory(value);
      if (!value) setIncludeHistoryImages(false);
    }
    if (key === "historyImages") setIncludeHistoryImages(value);
  };

  if (!isOpen || !project) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onConfirmExport({
        includePresets,
        includeAssets,
        includeHistory,
        includeHistoryImages,
      });
      onClose();
    } catch (err) {
      console.error("Failed to export project", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1A1A1A]/60 backdrop-blur-xs animate-fade-in"
      id="project-export-modal-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#F4F4F2] border-2 border-[#1A1A1A] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] rounded-none"
        id="project-export-modal-panel"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#D1D1CF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black uppercase tracking-widest font-sans text-[#1A1A1A] truncate">
                EXPORT PROJECT WORKSPACE
              </h3>
              <p className="text-[9px] font-mono text-[#888884] uppercase tracking-wider truncate">
                TARGET: <strong className="text-[#1A1A1A]">{project.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-[#F4F4F2] text-[#888884] hover:text-[#1A1A1A] transition-all cursor-pointer rounded-none shrink-0"
            title="Close (Escape)"
            id="close-project-export-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Quick Scope Presets */}
          <div>
            <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#888884] mb-2">
              SELECT EXPORT SCOPE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Full Backup */}
              <button
                type="button"
                onClick={() => handleSelectMode("full")}
                className={`p-3 border text-left flex flex-col justify-between transition-all cursor-pointer rounded-none ${
                  mode === "full"
                    ? "bg-white border-[#1A1A1A] shadow-xs"
                    : "bg-white/60 border-[#D1D1CF] hover:border-[#888884] hover:bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                      Full Backup
                    </span>
                    {mode === "full" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <p className="text-[9.5px] text-[#888884] leading-relaxed">
                    Includes everything: presets, asset library, and full generation history with reference images.
                  </p>
                </div>
                <div className="mt-2 text-[8px] font-mono text-emerald-700 font-bold uppercase">
                  Complete Archive
                </div>
              </button>

              {/* Compact History */}
              <button
                type="button"
                onClick={() => handleSelectMode("compact")}
                className={`p-3 border text-left flex flex-col justify-between transition-all cursor-pointer rounded-none ${
                  mode === "compact"
                    ? "bg-white border-[#1A1A1A] shadow-xs"
                    : "bg-white/60 border-[#D1D1CF] hover:border-[#888884] hover:bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                      <Minimize2 className="w-3.5 h-3.5 text-amber-600" />
                      Compact
                    </span>
                    {mode === "compact" && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                  <p className="text-[9.5px] text-[#888884] leading-relaxed">
                    Includes all prompts, presets, assets, and history text, but strips heavy history image blobs.
                  </p>
                </div>
                <div className="mt-2 text-[8px] font-mono text-amber-700 font-bold uppercase">
                  Text-Only History
                </div>
              </button>

              {/* Starter Template */}
              <button
                type="button"
                onClick={() => handleSelectMode("template")}
                className={`p-3 border text-left flex flex-col justify-between transition-all cursor-pointer rounded-none ${
                  mode === "template"
                    ? "bg-white border-[#1A1A1A] shadow-xs"
                    : "bg-white/60 border-[#D1D1CF] hover:border-[#888884] hover:bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-blue-600" />
                      Template
                    </span>
                    {mode === "template" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <p className="text-[9.5px] text-[#888884] leading-relaxed">
                    Clean workspace for sharing: prompts, presets, and asset library only. Zero history records.
                  </p>
                </div>
                <div className="mt-2 text-[8px] font-mono text-blue-700 font-bold uppercase">
                  Clean Workspace
                </div>
              </button>
            </div>
          </div>

          {/* Granular Toggles */}
          <div className="bg-white border border-[#D1D1CF] p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D1D1CF]/60 pb-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#888884]" />
                Granular Component Inclusions
              </span>
              {mode === "custom" && (
                <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 bg-neutral-100 text-[#1A1A1A] border border-[#D1D1CF]">
                  Custom Scope
                </span>
              )}
            </div>

            <div className="space-y-2.5 font-mono text-[10.5px]">
              {/* Custom Presets */}
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includePresets}
                    onChange={(e) => handleCustomToggle("presets", e.target.checked)}
                    className="rounded-none border-[#D1D1CF] text-[#1A1A1A] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[#1A1A1A]">Custom Presets</span>
                </div>
                <span className="text-[#888884] text-[10px]">{presetsCount} presets</span>
              </label>

              {/* Asset Library */}
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeAssets}
                    onChange={(e) => handleCustomToggle("assets", e.target.checked)}
                    className="rounded-none border-[#D1D1CF] text-[#1A1A1A] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[#1A1A1A]">Asset Library Images</span>
                </div>
                <span className="text-[#888884] text-[10px]">{assetCount} assets</span>
              </label>

              {/* Generation History */}
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeHistory}
                    onChange={(e) => handleCustomToggle("history", e.target.checked)}
                    className="rounded-none border-[#D1D1CF] text-[#1A1A1A] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[#1A1A1A]">Generation History</span>
                </div>
                <span className="text-[#888884] text-[10px]">{historyCount} records</span>
              </label>

              {/* History Reference Images (Nested) */}
              <div className="pl-6 border-l-2 border-[#D1D1CF] ml-2.5">
                <label
                  className={`flex items-center justify-between select-none ${
                    includeHistory ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeHistory && includeHistoryImages}
                      disabled={!includeHistory}
                      onChange={(e) => handleCustomToggle("historyImages", e.target.checked)}
                      className="rounded-none border-[#D1D1CF] text-[#1A1A1A] focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-[#1A1A1A]">Include History Reference Images</span>
                  </div>
                  <span className="text-[#888884] text-[10px]">{historyImageCount} images</span>
                </label>
                <p className="text-[9px] text-[#888884] mt-0.5 font-sans">
                  Uncheck to strip image blobs from history records, reducing package size significantly.
                </p>
              </div>
            </div>
          </div>

          {/* Package Breakdown Summary Ribbon */}
          <div className="grid grid-cols-4 gap-2 bg-white p-3 border border-[#D1D1CF] font-mono text-center">
            <div className="flex flex-col items-center justify-center border-r border-[#D1D1CF]/50 pr-1">
              <div className="flex items-center gap-1 text-[#888884] text-[8px] uppercase tracking-wider">
                <Bookmark className="w-2.5 h-2.5" /> Presets
              </div>
              <span className={`text-sm font-bold mt-0.5 ${includePresets ? "text-[#1A1A1A]" : "text-[#888884] line-through"}`}>
                {includePresets ? presetsCount : 0}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border-r border-[#D1D1CF]/50 px-1">
              <div className="flex items-center gap-1 text-[#888884] text-[8px] uppercase tracking-wider">
                <History className="w-2.5 h-2.5" /> History
              </div>
              <span className={`text-sm font-bold mt-0.5 ${includeHistory ? "text-[#1A1A1A]" : "text-[#888884] line-through"}`}>
                {includeHistory ? historyCount : 0}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border-r border-[#D1D1CF]/50 px-1">
              <div className="flex items-center gap-1 text-[#888884] text-[8px] uppercase tracking-wider">
                <Layers className="w-2.5 h-2.5" /> Assets
              </div>
              <span className={`text-sm font-bold mt-0.5 ${includeAssets ? "text-[#1A1A1A]" : "text-[#888884] line-through"}`}>
                {includeAssets ? assetCount : 0}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center pl-1">
              <div className="flex items-center gap-1 text-emerald-700 text-[8px] uppercase tracking-wider font-bold">
                <ImageIcon className="w-2.5 h-2.5" /> Images
              </div>
              <span className="text-sm font-bold text-emerald-600 mt-0.5">
                {(includeAssets ? assetCount : 0) + (includeHistory && includeHistoryImages ? historyImageCount : 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-[#D1D1CF] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[9px] font-mono text-[#888884] uppercase tracking-wider truncate">
            SCOPE: <strong className="text-[#1A1A1A]">{mode.toUpperCase()}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-3.5 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-[#F4F4F2] text-[9px] font-mono uppercase font-bold tracking-wider text-[#1A1A1A] transition-all cursor-pointer disabled:opacity-50 rounded-none"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white border border-[#1A1A1A] text-[9px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 rounded-none shadow-xs"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-white" />
                  <span>Preparing JSON Export...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON Bundle</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
