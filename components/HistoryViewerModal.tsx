"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Settings, 
  ChevronDown, 
  Trash2, 
  Upload, 
  Download, 
  Loader2, 
  Star 
} from "lucide-react";
import { HistoryItem, HistorySearchScope } from "../types/history";
import { getStoredImage } from "../lib/indexeddb";
import { exportHistoryToJSON, importHistoryFromJSON } from "../lib/history-export";
import { matchesSearchQuery } from "../lib/search-utils";
import { useModalEscape } from "../hooks/use-modal-stack";
import VideoPlayerModal from "./VideoPlayerModal";
import { HistoryListSidebar } from "./history/HistoryListSidebar";
import { HistoryDetailPanel } from "./history/HistoryDetailPanel";

export interface HistoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onRenameHistoryItem: (id: string, newName: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onLoadHistoryItem: (item: HistoryItem) => void;
  onToggleFavoriteHistoryItem?: (id: string, e?: React.MouseEvent) => void;
  onImportHistory?: (newHistory: HistoryItem[]) => void;
  onClearHistory?: () => void;
  onCompareHistoryItem?: (item: HistoryItem) => void;
  projectName?: string;
}

export default function HistoryViewerModal({
  isOpen,
  onClose,
  history,
  onRenameHistoryItem,
  onDeleteHistoryItem,
  onLoadHistoryItem,
  onToggleFavoriteHistoryItem,
  onImportHistory,
  onClearHistory,
  onCompareHistoryItem,
  projectName,
}: HistoryViewerModalProps) {
  // Register with global LIFO modal escape stack
  useModalEscape(isOpen, onClose);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<HistorySearchScope>("default");
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  const [previewVideo, setPreviewVideo] = useState<{ youtubeUrl: string; title: string; subLabel: string } | null>(null);

  // Export / Import UI states
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ message: string; isError?: boolean } | null>(null);
  const historyFileInputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Cost breakdown popover state (keyed to selected item ID so it auto-resets when switching items)
  const [costPopoverItemId, setCostPopoverItemId] = useState<string | null>(null);
  const [popoverAlign, setPopoverAlign] = useState<"left" | "right">("right");

  // Close export dropdown menu on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExportMenuOpen) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isExportMenuOpen]);

  // Derive selectedItem from history and selectedItemId
  const selectedItem = React.useMemo(() => {
    if (history.length === 0) return null;
    if (selectedItemId) {
      const found = history.find((item) => item.id === selectedItemId);
      if (found) return found;
    }
    return history[0];
  }, [history, selectedItemId]);

  // Scroll selected item into view when modal opens or selected item changes
  useEffect(() => {
    if (isOpen && selectedItem) {
      const timer = setTimeout(() => {
        selectedItemRef.current?.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedItem]);

  // Resolve images asynchronously whenever the selected item changes
  useEffect(() => {
    let isMounted = true;
    async function resolveImages() {
      if (!selectedItem) {
        await Promise.resolve();
        if (isMounted) {
          setResolvedImages({});
        }
        return;
      }

      const imagesMap: Record<string, string> = {};
      if (selectedItem.images) {
        for (const img of selectedItem.images) {
          if (img.id) {
            try {
              const b64 = await getStoredImage(img.id);
              if (b64) {
                imagesMap[img.id] = b64;
              }
            } catch (err) {
              console.error("Failed to load history image:", err);
            }
          }
        }
      }
      if (isMounted) {
        setResolvedImages(imagesMap);
      }
    }

    resolveImages();
    return () => {
      isMounted = false;
    };
  }, [selectedItem]);

  if (!isOpen) return null;

  // Filter history items by search query and activeTab
  const filteredHistory = history.filter((item) => {
    if (activeTab === "favorites" && !item.isFavorite) return false;
    if (!searchQuery.trim()) return true;

    if (searchScope === "default") {
      const title = item.name || item.variables["idea"] || "Untitled Outline";
      return matchesSearchQuery(title, searchQuery);
    }

    if (searchScope === "visual_reference") {
      const imageLabels = (item.images || []).map((img) => img.label);
      const videoLabels = (item.videos || []).map((vid) => vid.label);
      return matchesSearchQuery([...imageLabels, ...videoLabels], searchQuery);
    }

    if (searchScope === "idea") {
      const ideaVal = item.variables["idea"] || "";
      return matchesSearchQuery(ideaVal, searchQuery);
    }

    if (searchScope === "output") {
      const outputVal = item.output || "";
      return matchesSearchQuery(outputVal, searchQuery);
    }

    if (searchScope === "compiled_prompt") {
      const filledVal = item.filledPrompt || "";
      return matchesSearchQuery(filledVal, searchQuery);
    }

    return true;
  });

  const startRename = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(item.id);
    setRenameValue(item.name || item.variables["idea"] || "Untitled Outline");
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (renameValue.trim()) {
      onRenameHistoryItem(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleRenameKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (renameValue.trim()) {
        onRenameHistoryItem(id, renameValue.trim());
      }
      setRenamingId(null);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      setRenamingId(null);
    }
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(null);
  };

  // Export history handler
  const handleExport = async (type: "all" | "favorites" | "selected") => {
    setIsExportMenuOpen(false);
    setIsProcessing(true);
    setStatusBanner(null);
    try {
      const result = await exportHistoryToJSON(history, type, selectedItem, projectName);
      setStatusBanner({
        message: `Successfully exported ${result.count} history item(s) to "${result.filename}"`,
      });
    } catch (err: any) {
      setStatusBanner({
        message: err.message || "Failed to export history records",
        isError: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Import history handler
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusBanner(null);
    try {
      const text = await file.text();
      const { updatedHistory, importedCount } = await importHistoryFromJSON(text, history);
      if (onImportHistory) {
        onImportHistory(updatedHistory);
      }
      setStatusBanner({
        message: `Successfully imported ${importedCount} history record(s) with embedded images!`,
      });
    } catch (err: any) {
      setStatusBanner({
        message: err.message || "Failed to parse and import history JSON file",
        isError: true,
      });
    } finally {
      setIsProcessing(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      id="history-viewer-modal-backdrop"
    >
      <div
        className="bg-white border border-[#D1D1CF] w-full max-w-6xl h-[85vh] md:h-[80vh] flex flex-col shadow-2xl relative rounded-none overflow-hidden"
        id="history-viewer-modal-box"
      >
        {/* Hidden File Input for History Import */}
        <input
          type="file"
          ref={historyFileInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
          id="history-json-import-input"
        />

        {/* Modal Header */}
        <div className="h-14 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0 gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Settings className="w-4 h-4 text-[#1A1A1A] shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider font-sans text-[#1A1A1A] truncate">
              Local Session History Explorer & Lab
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Import Button */}
            <button
              type="button"
              onClick={() => historyFileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-2.5 py-1.5 bg-white hover:bg-[#FAF9F6] text-[#1A1A1A] border border-[#D1D1CF] text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50 rounded-none shadow-xs"
              title="Import history JSON file with embedded images"
            >
              {isProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin text-[#1A1A1A]" />
              ) : (
                <Upload className="w-3 h-3 text-[#1A1A1A]" />
              )}
              Import JSON
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                disabled={isProcessing || history.length === 0}
                className="px-2.5 py-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-none shadow-xs"
                title="Export history records as JSON"
              >
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                ) : (
                  <Download className="w-3 h-3 text-white" />
                )}
                Export JSON
                <ChevronDown className="w-3 h-3 text-white/70" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-white border border-[#D1D1CF] shadow-xl z-[70] py-1 font-mono text-[9px] uppercase tracking-wider divide-y divide-[#EAEAE8] rounded-none animate-fade-in">
                  <button
                    type="button"
                    onClick={() => handleExport("all")}
                    className="w-full text-left px-3 py-2 hover:bg-[#FAF9F6] text-[#1A1A1A] flex items-center justify-between font-bold cursor-pointer"
                  >
                    <span>Export All History</span>
                    <span className="text-[#888884] font-normal">({history.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("favorites")}
                    disabled={history.filter((h) => h.isFavorite).length === 0}
                    className="w-full text-left px-3 py-2 hover:bg-[#FAF9F6] text-[#1A1A1A] flex items-center justify-between font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      Favorites Only
                    </span>
                    <span className="text-[#888884] font-normal">
                      ({history.filter((h) => h.isFavorite).length})
                    </span>
                  </button>
                  {selectedItem && (
                    <button
                      type="button"
                      onClick={() => handleExport("selected")}
                      className="w-full text-left px-3 py-2 hover:bg-[#FAF9F6] text-[#1A1A1A] flex items-center justify-between font-bold cursor-pointer"
                    >
                      <span>Export Selected Slot</span>
                      <span className="text-[#888884] font-normal">(1)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Clear History Button */}
            {onClearHistory && (
              <button
                type="button"
                onClick={onClearHistory}
                disabled={isProcessing || history.length === 0}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-none shadow-xs"
                title="Clear local session history"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
                Clear History
              </button>
            )}

            <button
              onClick={onClose}
              className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer ml-2"
            >
              [ESC] CLOSE
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {statusBanner && (
          <div
            className={`px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-wider border-b flex items-center justify-between animate-fade-in ${
              statusBanner.isError
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            <span>{statusBanner.message}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="hover:underline cursor-pointer ml-4 font-normal"
            >
              [Dismiss]
            </button>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#D1D1CF]">
          {/* Left Panel: Search and List of History Slots */}
          <HistoryListSidebar
            history={history}
            filteredHistory={filteredHistory}
            selectedItem={selectedItem}
            selectedItemRef={selectedItemRef}
            onSelectItem={setSelectedItemId}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchScope={searchScope}
            setSearchScope={setSearchScope}
            renamingId={renamingId}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            onStartRename={startRename}
            onSaveRename={saveRename}
            onCancelRename={cancelRename}
            onRenameKeyDown={handleRenameKeyDown}
            onToggleFavorite={onToggleFavoriteHistoryItem}
            onDeleteHistoryItem={onDeleteHistoryItem}
          />

          {/* Right Panel: Detail Inspection & Output */}
          <HistoryDetailPanel
            selectedItem={selectedItem}
            resolvedImages={resolvedImages}
            onToggleFavoriteHistoryItem={onToggleFavoriteHistoryItem}
            onLoadHistoryItem={onLoadHistoryItem}
            onClose={onClose}
            onCompareHistoryItem={onCompareHistoryItem}
            onPreviewVideo={setPreviewVideo}
            costPopoverItemId={costPopoverItemId}
            setCostPopoverItemId={setCostPopoverItemId}
            popoverAlign={popoverAlign}
            setPopoverAlign={setPopoverAlign}
          />
        </div>
      </div>

      {/* Video Player Modal (Elevated to Tier 3 z-[60]) */}
      <VideoPlayerModal
        isOpen={Boolean(previewVideo)}
        youtubeUrl={previewVideo?.youtubeUrl}
        title={previewVideo?.title || "Video Preview"}
        subLabel={previewVideo?.subLabel}
        onClose={() => setPreviewVideo(null)}
      />
    </div>
  );
}
