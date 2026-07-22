"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ChevronDown, 
  FolderOpen, 
  Sparkles, 
  Image as ImageIcon,
  Settings,
  Copy,
  Star,
  Download,
  Upload,
  Loader2
} from "lucide-react";
import { getStoredImage } from "../lib/indexeddb";
import { exportHistoryToJSON, importHistoryFromJSON } from "../lib/history-export";

interface HistoryItem {
  id: string;
  timestamp: string;
  variables: Record<string, string>;
  images: { id?: string; label: string; base64: string; mimeType: string }[];
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

interface HistoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onRenameHistoryItem: (id: string, newName: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onLoadHistoryItem: (item: HistoryItem) => void;
  onToggleFavoriteHistoryItem?: (id: string, e?: React.MouseEvent) => void;
  onImportHistory?: (newHistory: HistoryItem[]) => void;
}

export default function HistoryViewerModal({
  isOpen,
  onClose,
  history,
  onRenameHistoryItem,
  onDeleteHistoryItem,
  onLoadHistoryItem,
  onToggleFavoriteHistoryItem,
  onImportHistory
}: HistoryViewerModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<"default" | "visual_reference" | "idea" | "output" | "compiled_prompt">("default");
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  const [showCompiled, setShowCompiled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ideaCopied, setIdeaCopied] = useState(false);
  const [compiledCopied, setCompiledCopied] = useState(false);

  // Export / Import UI states
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ message: string; isError?: boolean } | null>(null);
  const historyFileInputRef = useRef<HTMLInputElement>(null);

  // Derive selectedItem from history and selectedItemId
  const selectedItem = React.useMemo(() => {
    if (history.length === 0) return null;
    if (selectedItemId) {
      const found = history.find(item => item.id === selectedItemId);
      if (found) return found;
    }
    return history[0];
  }, [history, selectedItemId]);

  // Resolve images asynchronously whenever the selected item changes
  useEffect(() => {
    let isMounted = true;
    async function resolveImages() {
      if (!selectedItem) {
        // Run asynchronously to avoid set-state-in-effect warning
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
  const filteredHistory = history.filter(item => {
    if (activeTab === "favorites" && !item.isFavorite) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();

    if (searchScope === "default") {
      const title = item.name || item.variables["idea"] || "Untitled Outline";
      const timestamp = item.timestamp;
      const model = item.model || "";
      return (
        title.toLowerCase().includes(query) ||
        timestamp.toLowerCase().includes(query) ||
        model.toLowerCase().includes(query)
      );
    }

    if (searchScope === "visual_reference") {
      if (!item.images) return false;
      return item.images.some(img => img.label.toLowerCase().includes(query));
    }

    if (searchScope === "idea") {
      const ideaVal = item.variables["idea"] || "";
      return ideaVal.toLowerCase().includes(query);
    }

    if (searchScope === "output") {
      const outputVal = item.output || "";
      return outputVal.toLowerCase().includes(query);
    }

    if (searchScope === "compiled_prompt") {
      const filledVal = item.filledPrompt || "";
      return filledVal.toLowerCase().includes(query);
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
      setRenamingId(null);
    }
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(null);
  };

  const handleCopyOutput = () => {
    if (!selectedItem?.output) return;
    navigator.clipboard.writeText(selectedItem.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export history handler
  const handleExport = async (type: "all" | "favorites" | "selected") => {
    setIsExportMenuOpen(false);
    setIsProcessing(true);
    setStatusBanner(null);
    try {
      const result = await exportHistoryToJSON(history, type, selectedItem);
      setStatusBanner({
        message: `Successfully exported ${result.count} history item(s) to "${result.filename}"`
      });
    } catch (err: any) {
      setStatusBanner({
        message: err.message || "Failed to export history records",
        isError: true
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
        message: `Successfully imported ${importedCount} history record(s) with embedded images!`
      });
    } catch (err: any) {
      setStatusBanner({
        message: err.message || "Failed to parse and import history JSON file",
        isError: true
      });
    } finally {
      setIsProcessing(false);
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  // Custom parameters excluding special placeholders & unreferenced dead variables
  const getCustomParams = (item: HistoryItem | null): [string, string][] => {
    if (!item) return [];

    const entries = Object.entries(item.variables).filter(
      ([key]) => key !== "idea" && key !== "visual_references" && key !== "cast"
    );

    // If item has a saved promptTemplate, strictly match variables against that template
    if (item.promptTemplate) {
      const matches = Array.from(item.promptTemplate.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g));
      const templateVars = new Set(matches.map((m) => m[1]));
      return entries.filter(([key]) => templateVars.has(key));
    }

    // Fallback for legacy history items without saved promptTemplate: keep as-is
    return entries;
  };

  const customParams = getCustomParams(selectedItem);

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="history-viewer-modal-backdrop">
      <div className="bg-white border border-[#D1D1CF] w-full max-w-6xl h-[85vh] md:h-[80vh] flex flex-col shadow-2xl relative rounded-none overflow-hidden" id="history-viewer-modal-box">
        
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
            <div className="relative">
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
                <div className="absolute right-0 mt-1 w-52 bg-white border border-[#D1D1CF] shadow-xl z-50 py-1 font-mono text-[9px] uppercase tracking-wider divide-y divide-[#EAEAE8] rounded-none animate-fade-in">
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
                    disabled={history.filter(h => h.isFavorite).length === 0}
                    className="w-full text-left px-3 py-2 hover:bg-[#FAF9F6] text-[#1A1A1A] flex items-center justify-between font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      Favorites Only
                    </span>
                    <span className="text-[#888884] font-normal">
                      ({history.filter(h => h.isFavorite).length})
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
          <div className={`px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-wider border-b flex items-center justify-between animate-fade-in ${
            statusBanner.isError
              ? "bg-red-50 text-red-800 border-red-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}>
            <span>{statusBanner.isError ? "[ERROR] " : "[✓] "}{statusBanner.message}</span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-stone-500 hover:text-[#1A1A1A] uppercase font-bold text-[9px] cursor-pointer"
            >
              [Dismiss]
            </button>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#D1D1CF]">
          
          {/* Left panel: search and list of history slots */}
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
                    Favorites ({history.filter(h => h.isFavorite).length})
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
                    placeholder="Search history slots..."
                    className="w-full bg-[#FAF9F6] border border-[#D1D1CF] py-1.5 pl-9 pr-3 text-[10px] uppercase tracking-wider font-bold outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A] placeholder-stone-400"
                  />
                </div>
                
                {/* Search Scope Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono font-bold text-[#888884] uppercase tracking-wider shrink-0">Area:</span>
                  <select
                    value={searchScope}
                    onChange={(e) => setSearchScope(e.target.value as any)}
                    className="flex-1 bg-[#FAF9F6] border border-[#D1D1CF] text-[9px] uppercase tracking-wider font-bold py-1 px-2 outline-none focus:border-[#1A1A1A] text-[#1A1A1A] cursor-pointer rounded-none h-7"
                  >
                    <option value="default">Default (Title / Model)</option>
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
                    const displayTitle = item.name || (defaultTitle.length > 50 ? defaultTitle.slice(0, 50) + "..." : defaultTitle);

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className={`p-3.5 cursor-pointer transition-all flex flex-col group relative ${
                          isSelected
                            ? "bg-white border-l-4 border-l-[#1A1A1A]"
                            : item.isFavorite
                            ? "bg-[#FFFDF5] hover:bg-[#FFF9E6] border-l-2 border-l-amber-400"
                            : "hover:bg-[#F4F4F2]"
                        }`}
                      >
                        {/* Row 1: Favorite toggle on left, Timestamp, image count, and hover action controls */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 font-mono text-[8px] text-[#888884]">
                            {onToggleFavoriteHistoryItem && (
                              <button
                                type="button"
                                onClick={(e) => onToggleFavoriteHistoryItem(item.id, e)}
                                className={`p-0.5 -ml-1 transition-colors cursor-pointer ${
                                  item.isFavorite ? "text-amber-500 hover:text-amber-600" : "text-[#888884] hover:text-amber-500 opacity-60 group-hover:opacity-100"
                                }`}
                                title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Star className={`w-3.5 h-3.5 ${item.isFavorite ? "fill-amber-400 text-amber-500" : ""}`} />
                              </button>
                            )}
                            <span>{item.timestamp}</span>
                            {item.images && item.images.length > 0 && (
                              <span className="bg-[#1A1A1A] text-white px-1 py-0.5 font-bold uppercase shrink-0">
                                {item.images.length} IMG
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {renamingId !== item.id && (
                              <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => startRename(item, e)}
                                  className="text-[#888884] hover:text-[#1A1A1A] p-0.5 transition-colors cursor-pointer"
                                  title="Rename history slot"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
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
                        </div>

                        {/* Row 2: Title / Rename input */}
                        {renamingId === item.id ? (
                          <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => handleRenameKeyDown(item.id, e)}
                              autoFocus
                              className="w-full bg-white border border-[#1A1A1A] px-2 py-1 text-[10px] font-bold text-[#1A1A1A] rounded-none outline-none"
                            />
                            <button
                              onClick={(e) => saveRename(item.id, e)}
                              className="p-1 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                              title="Save Name"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelRename}
                              className="p-1 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <h4 className={`text-[10px] font-bold uppercase tracking-tight break-words leading-relaxed w-full ${
                            isSelected ? "text-[#1A1A1A]" : "text-[#555552] group-hover:text-[#1A1A1A]"
                          }`}>
                            {displayTitle}
                          </h4>
                        )}

                        {/* Row 3: Model & Preset Badges */}
                        {(item.model || item.presetLabel) && (
                          <div className="flex items-center gap-1.5 mt-1.5 font-mono text-[8px] text-[#888884] w-full flex-wrap">
                            {item.model && (
                              <span className="border border-[#D1D1CF] bg-white text-[#1A1A1A] px-1 py-0.5 shrink-0 uppercase">
                                {item.model.replace("gemini-", "")}
                              </span>
                            )}
                            {item.presetLabel && (
                              <span className="border border-[#D1D1CF] bg-[#EAEAE8] text-[#1A1A1A] px-1 py-0.5 shrink-0 uppercase font-bold truncate max-w-[140px]">
                                {item.presetLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: details panel */}
          <div className="flex-1 flex flex-col bg-white overflow-y-auto custom-scrollbar p-6 min-w-0 h-2/3 md:h-full">
            {!selectedItem ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-[#888884] max-w-md mx-auto py-12">
                <FolderOpen className="w-8 h-8 text-[#D1D1CF] mb-3" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1A1A1A] mb-1">
                  No Past Sequence Selected
                </h4>
                <p className="text-[11px] leading-relaxed text-[#888884]">
                  Select any generation slot from the left directory column to inspect its dynamic parameters, reference configuration, and synthesized plain-text sequence.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in" id="history-item-details-view">
                
                {/* Title & Metadata Header Row with Load Workspace Action */}
                <div className="border-b border-[#D1D1CF] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[8px] font-mono font-black uppercase tracking-wider text-[#888884]">
                      Active History Spec Slot: {selectedItem.id}
                    </span>
                    <h2 className="text-base font-black uppercase text-[#1A1A1A] tracking-tight leading-tight break-words">
                      {selectedItem.name || (selectedItem.variables["idea"] ? (selectedItem.variables["idea"].length > 100 ? selectedItem.variables["idea"].slice(0, 100) + "..." : selectedItem.variables["idea"]) : "Untitled Outline")}
                    </h2>
                    <span className="text-[10px] text-[#888884] font-mono uppercase block pt-0.5">
                      Synthesized on {selectedItem.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {onToggleFavoriteHistoryItem && (
                      <button
                        onClick={(e) => onToggleFavoriteHistoryItem(selectedItem.id, e)}
                        className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 rounded-none ${
                          selectedItem.isFavorite
                            ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                            : "bg-[#FAF9F6] text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                        }`}
                        title={selectedItem.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className={`w-3.5 h-3.5 ${selectedItem.isFavorite ? "fill-amber-400 text-amber-500" : "text-[#888884]"}`} />
                        {selectedItem.isFavorite ? "Favorited" : "Favorite"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onLoadHistoryItem(selectedItem);
                        onClose();
                      }}
                      className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border border-[#1A1A1A] shrink-0 flex items-center gap-1.5 shadow-sm rounded-none"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      Load Workspace
                    </button>
                  </div>
                </div>

                {/* Compact Engine Configuration Row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[#D1D1CF]/60 pb-3 text-[10px] font-mono text-[#555]">
                  <span className="text-[9px] uppercase tracking-wider text-[#888884] font-black mr-1">
                    Engine Specs:
                  </span>
                  <div className="flex items-center gap-1.5 bg-[#F4F4F2] border border-[#D1D1CF] px-2 py-0.5">
                    <span className="text-[8px] text-[#888884] uppercase font-bold">Model</span>
                    <span className="text-[#1A1A1A] font-extrabold uppercase text-[9px]">
                      {(selectedItem.model || "GEMINI-3.5-FLASH").replace("gemini-", "")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F4F4F2] border border-[#D1D1CF] px-2 py-0.5">
                    <span className="text-[8px] text-[#888884] uppercase font-bold">Reasoning</span>
                    <span className="text-[#1A1A1A] font-extrabold uppercase text-[9px]">
                      {selectedItem.thinkingLevel || "MEDIUM"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F4F4F2] border border-[#D1D1CF] px-2 py-0.5">
                    <span className="text-[8px] text-[#888884] uppercase font-bold">Temp</span>
                    <span className="text-[#1A1A1A] font-extrabold text-[9px]">
                      {(selectedItem.temperature ?? 1.0).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F4F4F2] border border-[#D1D1CF] px-2 py-0.5">
                    <span className="text-[8px] text-[#888884] uppercase font-bold">Max Tokens</span>
                    <span className="text-[#1A1A1A] font-extrabold uppercase text-[9px]">
                      {selectedItem.maxTokens || "UNLIMITED"}
                    </span>
                  </div>
                  {selectedItem.presetLabel && (
                    <div className="flex items-center gap-1.5 bg-[#F4F4F2] border border-[#D1D1CF] px-2 py-0.5">
                      <span className="text-[8px] text-[#888884] uppercase font-bold">Preset</span>
                      <span className="text-[#1A1A1A] font-extrabold uppercase text-[9px]">
                        {selectedItem.presetLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Visual Reference Assets Section */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-[#888884] font-black font-mono">
                    Visual References & Casting Maps ({selectedItem.images?.length || 0})
                  </span>
                  {selectedItem.images && selectedItem.images.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {selectedItem.images.map((img, idx) => {
                        const b64 = resolvedImages[img.id || ""];
                        return (
                          <div key={img.id || idx} className="flex items-center gap-2.5 border border-[#D1D1CF] bg-[#F4F4F2] p-1.5 pr-3 text-[10px] font-mono shrink-0">
                            <div className="w-9 h-9 relative shrink-0 border border-[#D1D1CF] bg-white overflow-hidden">
                              {b64 ? (
                                <img src={b64} alt={img.label} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#EAEAE8] animate-pulse">
                                  <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[8px] text-[#888884] font-black">@IMAGE{idx + 1}</span>
                              <span className="text-[#1A1A1A] font-bold truncate max-w-[140px] uppercase">
                                {img.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[10px] uppercase font-mono italic text-[#888884] border border-dashed border-[#D1D1CF] p-2.5 text-center bg-[#FAF9F6]">
                      No visual reference cards were mapped to this sequence
                    </div>
                  )}
                </div>

                {/* 2-Column Workspace Block: Main Objective & Dynamic Parameters */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                  
                  {/* Left Column: Main Objective / Idea */}
                  <div className="flex flex-col gap-2 min-h-[220px] max-h-[300px]">
                    <div className="flex items-center justify-between shrink-0">
                      <span className="text-[9px] uppercase tracking-wider text-[#888884] font-black font-mono">
                        Main Objective / Idea Text ({"{{ idea }}"})
                      </span>
                      {selectedItem.variables["idea"] && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedItem.variables["idea"]);
                            setIdeaCopied(true);
                            setTimeout(() => setIdeaCopied(false), 2000);
                          }}
                          className="px-2.5 py-0.5 bg-[#FAF9F6] border border-[#D1D1CF] text-[8px] uppercase font-bold tracking-widest hover:bg-white transition-colors cursor-pointer flex items-center gap-1 text-[#1A1A1A]"
                        >
                          <Copy className="w-2.5 h-2.5 text-[#1A1A1A]" />
                          {ideaCopied ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 bg-[#FAF9F6] border border-[#D1D1CF] p-3.5 text-xs leading-relaxed text-[#1A1A1A] whitespace-pre-wrap rounded-none overflow-y-auto custom-scrollbar">
                      {selectedItem.variables["idea"] || (
                        <span className="italic text-[#888884]">No objective text defined.</span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Dynamic Parameters */}
                  <div className="flex flex-col gap-2 min-h-[220px] max-h-[300px]">
                    <span className="text-[9px] uppercase tracking-wider text-[#888884] font-black font-mono shrink-0">
                      Dynamic Parameter Specifications ({customParams.length})
                    </span>
                    <div className="flex-1 bg-white border border-[#D1D1CF] p-3.5 overflow-y-auto custom-scrollbar">
                      {customParams.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {customParams.map(([key, val]) => {
                            const label = key.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                            return (
                              <div key={key} className="flex flex-col gap-1 border-b border-[#F4F4F2] pb-2 last:border-0 last:pb-0">
                                <span className="text-[9px] uppercase font-bold text-[#1A1A1A] tracking-wider truncate" title={label}>{label}</span>
                                <span className="text-[8px] font-mono text-[#888884] -mt-0.5">{"{{"} {key} {"}}"}</span>
                                <span className="text-[10px] text-[#555] font-mono break-all mt-1 bg-[#FAF9F6]/80 p-2 border border-[#EAEAE8]">
                                  {val || <span className="italic text-stone-400">Empty value</span>}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[10px] uppercase font-mono italic text-[#888884] border border-dashed border-[#D1D1CF] p-3 text-center bg-[#FAF9F6]">
                          No custom curly-brace parameters exist
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Collapsible Compiled Instructions with Copy button */}
                <div className="border-t border-[#D1D1CF] pt-4">
                  <div className="flex items-center justify-between w-full">
                    <button
                      onClick={() => setShowCompiled(!showCompiled)}
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[#888884] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      {showCompiled ? "Hide compiled prompt specs [-]" : "Show compiled prompt specs [+]"}
                    </button>
                    {selectedItem.filledPrompt && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedItem.filledPrompt);
                          setCompiledCopied(true);
                          setTimeout(() => setCompiledCopied(false), 2000);
                        }}
                        className="px-2.5 py-0.5 bg-[#FAF9F6] border border-[#D1D1CF] text-[8px] uppercase font-bold tracking-widest hover:bg-white transition-colors cursor-pointer flex items-center gap-1 text-[#1A1A1A]"
                      >
                        <Copy className="w-2.5 h-2.5 text-[#1A1A1A]" />
                        {compiledCopied ? "Copied" : "Copy Specs"}
                      </button>
                    )}
                  </div>
                  {showCompiled && (
                    <div className="mt-2.5 p-3.5 bg-white border border-[#D1D1CF] max-h-40 overflow-y-auto text-[10px] font-mono text-[#555] whitespace-pre-wrap leading-relaxed custom-scrollbar">
                      {selectedItem.filledPrompt}
                    </div>
                  )}
                </div>

                {/* Saved Generation Output Section */}
                <div className="flex flex-col gap-2 border-t border-[#D1D1CF] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider text-[#888884] font-black font-mono">
                      Saved Generation Output ({selectedItem.output?.length || 0} CHARS)
                    </span>
                    {selectedItem.output && (
                      <button
                        onClick={handleCopyOutput}
                        className="px-3 py-1 bg-[#FAF9F6] border border-[#D1D1CF] text-[9px] uppercase font-bold tracking-widest hover:bg-white transition-colors cursor-pointer flex items-center gap-1 text-[#1A1A1A]"
                      >
                        <Copy className="w-2.5 h-2.5 text-[#1A1A1A]" />
                        {copied ? "Copied" : "Copy Output"}
                      </button>
                    )}
                  </div>
                  <div className="bg-white border border-[#D1D1CF] p-5 max-h-80 overflow-y-auto font-serif text-xs leading-relaxed text-[#1A1A1A] whitespace-pre-wrap custom-scrollbar shadow-inner">
                    {selectedItem.output || (
                      <span className="italic text-[#888884] font-sans">No text output exists for this history slot.</span>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
