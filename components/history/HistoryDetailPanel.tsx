"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderOpen, 
  Star, 
  Copy, 
  Check, 
  Settings, 
  GitCompare, 
  Film, 
  Music, 
  FileText, 
  Edit3, 
  X 
} from "lucide-react";
import { HistoryItem } from "../../types/history";
import YouTubeIcon from "../YouTubeIcon";
import { HistoryImageCardWithHover } from "./HistoryImageCardWithHover";
import { HistoryCostPopover } from "./HistoryCostPopover";
import { HistoryOutputViewer } from "./HistoryOutputViewer";

export interface HistoryDetailPanelProps {
  selectedItem: HistoryItem | null;
  resolvedImages: Record<string, string>;
  onToggleFavoriteHistoryItem?: (id: string, e?: React.MouseEvent) => void;
  onLoadHistoryItem: (item: HistoryItem) => void;
  onClose: () => void;
  onCompareHistoryItem?: (item: HistoryItem) => void;
  onPreviewVideo: (video: { youtubeUrl: string; title: string; subLabel: string }) => void;
  onRenameHistoryItem?: (id: string, newName: string) => void;
  costPopoverItemId: string | null;
  setCostPopoverItemId: (id: string | null) => void;
  popoverAlign: "left" | "right";
  setPopoverAlign: (align: "left" | "right") => void;
}

export const HistoryDetailPanel: React.FC<HistoryDetailPanelProps> = ({
  selectedItem,
  resolvedImages,
  onToggleFavoriteHistoryItem,
  onLoadHistoryItem,
  onClose,
  onCompareHistoryItem,
  onPreviewVideo,
  onRenameHistoryItem,
  costPopoverItemId,
  setCostPopoverItemId,
  popoverAlign,
  setPopoverAlign,
}) => {
  const [showCompiled, setShowCompiled] = useState(false);
  const [ideaCopied, setIdeaCopied] = useState(false);
  const [compiledCopied, setCompiledCopied] = useState(false);
  const [copiedParamKey, setCopiedParamKey] = useState<string | null>(null);

  // Inline rename states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");

  const isEditingTitle = Boolean(selectedItem && editingItemId === selectedItem.id);

  const handleStartRename = () => {
    if (!selectedItem) return;
    setEditedTitle(selectedItem.name || selectedItem.variables["idea"] || "Untitled Outline");
    setEditingItemId(selectedItem.id);
  };

  const handleSaveRename = () => {
    if (!selectedItem || !onRenameHistoryItem) return;
    const trimmed = editedTitle.trim();
    if (trimmed) {
      onRenameHistoryItem(selectedItem.id, trimmed);
    }
    setEditingItemId(null);
  };

  const handleCancelRename = () => {
    setEditingItemId(null);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      handleCancelRename();
    }
  };

  const handleCopyParam = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedParamKey(key);
    setTimeout(() => setCopiedParamKey(null), 2000);
  };

  // Custom parameters excluding special placeholders & unreferenced dead variables
  const getCustomParams = (item: HistoryItem | null): [string, string][] => {
    if (!item) return [];

    const entries = Object.entries(item.variables).filter(
      ([key]) => key !== "idea" && key !== "visual_references" && key !== "cast"
    );

    if (item.promptTemplate) {
      const matches = Array.from(item.promptTemplate.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g));
      const templateVars = new Set(matches.map((m) => m[1]));
      return entries.filter(([key]) => templateVars.has(key));
    }

    return entries;
  };

  const customParams = getCustomParams(selectedItem);

  if (!selectedItem) {
    return (
      <div className="flex-1 flex flex-col bg-white overflow-y-auto custom-scrollbar p-6 min-w-0 h-2/3 md:h-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center text-[#888884] max-w-md mx-auto py-12">
          <FolderOpen className="w-8 h-8 text-[#D1D1CF] mb-3" />
          <h4 className="text-xs font-black uppercase tracking-wider text-[#1A1A1A] mb-1">
            No Past Generation Selected
          </h4>
          <p className="text-[11px] leading-relaxed text-[#888884]">
            Select any generation slot from the left directory column to inspect its dynamic parameters, reference configuration, and generated output.
          </p>
        </div>
      </div>
    );
  }

  const titleText = selectedItem.name || (selectedItem.variables["idea"] ? (selectedItem.variables["idea"].length > 100 ? selectedItem.variables["idea"].slice(0, 100) + "..." : selectedItem.variables["idea"]) : "Untitled Outline");

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto custom-scrollbar p-6 min-w-0 h-2/3 md:h-full">
      <div className="space-y-6 animate-fade-in" id="history-item-details-view">
        
        {/* Title & Metadata Header Row with Icon-Only Action Controls */}
        <div className="border-b border-[#D1D1CF] pb-3.5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1.5">
              {/* Top metadata line above title: Generated date & Slot ID */}
              <div className="flex items-center gap-2 text-[9px] font-mono text-[#888884] uppercase">
                <span>Generated: {selectedItem.timestamp}</span>
                <span>•</span>
                <span className="font-bold text-[#1A1A1A]">#{selectedItem.id}</span>
              </div>

              {isEditingTitle ? (
                <div className="flex items-center gap-1.5 max-w-lg">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    className="px-2 py-1 text-sm font-black uppercase tracking-tight text-[#1A1A1A] bg-[#FAF9F6] border border-[#1A1A1A] flex-1 outline-none font-sans"
                    autoFocus
                    placeholder="Outline title..."
                  />
                  <button
                    type="button"
                    onClick={handleSaveRename}
                    className="p-1.5 bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors cursor-pointer"
                    title="Save title (Enter)"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelRename}
                    className="p-1.5 bg-[#FAF9F6] text-[#888884] hover:text-[#1A1A1A] border border-[#D1D1CF] hover:bg-white transition-colors cursor-pointer"
                    title="Cancel rename (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h2 className="text-base font-black uppercase text-[#1A1A1A] tracking-tight leading-tight break-words">
                    {titleText}
                  </h2>
                  {onRenameHistoryItem && (
                    <button
                      type="button"
                      onClick={handleStartRename}
                      className="opacity-40 group-hover:opacity-100 hover:text-[#1A1A1A] p-1 text-[#888884] transition-opacity cursor-pointer"
                      title="Rename sequence"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Color-Coded Metadata Ribbon Directly Below Title */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[9px] font-mono">
                {/* Model Badge (Indigo/Blue) */}
                <div className="inline-flex items-center h-5 px-2 bg-blue-50 text-blue-900 border border-blue-200 text-[9px] font-mono font-bold uppercase tracking-wider leading-none">
                  <span className="text-[9px] text-blue-600 font-semibold mr-1.5">MODEL:</span>
                  <span className="font-extrabold text-blue-950">{(selectedItem.model || "gemini-3.8-flash").replace(/^gemini-/i, "")}</span>
                </div>

                {/* Reasoning Badge (Amber) */}
                <div className="inline-flex items-center h-5 px-2 bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-mono font-bold uppercase tracking-wider leading-none">
                  <span className="text-[9px] text-amber-600 font-semibold mr-1.5">REASONING:</span>
                  <span className="font-extrabold text-amber-950">{selectedItem.thinkingLevel || "MEDIUM"}</span>
                </div>

                {/* Preset Badge (Purple) */}
                {(selectedItem.presetLabel || selectedItem.systemPrompt || selectedItem.promptTemplate) && (
                  <div className="inline-flex items-center h-5 px-2 bg-purple-50 text-purple-900 border border-purple-200 text-[9px] font-mono font-bold uppercase tracking-wider leading-none">
                    <span className="text-[9px] text-purple-600 font-semibold mr-1.5">PRESET:</span>
                    <span className="font-extrabold text-purple-950">{selectedItem.presetLabel ? selectedItem.presetLabel.replace("PRESET: ", "") : "CUSTOM"}</span>
                  </div>
                )}

                {/* Temperature Badge (Only if !== 1.0) */}
                {selectedItem.temperature !== undefined && selectedItem.temperature !== 1.0 && (
                  <div className="inline-flex items-center h-5 px-2 bg-[#F4F4F2] text-[#1A1A1A] border border-[#D1D1CF] text-[9px] font-mono font-bold uppercase tracking-wider leading-none">
                    <span className="text-[9px] text-[#888884] font-semibold mr-1.5">TEMP:</span>
                    <span className="font-extrabold">{selectedItem.temperature.toFixed(1)}</span>
                  </div>
                )}

                {/* Max Tokens Badge (Only if set and !== UNLIMITED) */}
                {selectedItem.maxTokens && selectedItem.maxTokens !== "UNLIMITED" && (
                  <div className="inline-flex items-center h-5 px-2 bg-[#F4F4F2] text-[#1A1A1A] border border-[#D1D1CF] text-[9px] font-mono font-bold uppercase tracking-wider leading-none">
                    <span className="text-[9px] text-[#888884] font-semibold mr-1.5">MAX:</span>
                    <span className="font-extrabold">{selectedItem.maxTokens}</span>
                  </div>
                )}

                {/* Tokens Badge (Neutral Slate) */}
                {selectedItem.tokenUsage && (() => {
                  const prompt = selectedItem.tokenUsage.promptTokens ?? 0;
                  const candidates = selectedItem.tokenUsage.candidatesTokens ?? 0;
                  const total = selectedItem.tokenUsage.totalTokens ?? (prompt + candidates);
                  const thoughts = selectedItem.tokenUsage.thoughtTokens !== undefined
                    ? selectedItem.tokenUsage.thoughtTokens
                    : Math.max(0, total - prompt - candidates);
                  return (
                    <div
                      className="inline-flex items-center h-5 px-2 bg-[#F4F4F2] text-[#1A1A1A] border border-[#D1D1CF] text-[9px] font-mono font-bold uppercase tracking-wider leading-none cursor-default"
                      title={`${prompt.toLocaleString()} in${selectedItem.tokenUsage.cachedTokens ? ` (${selectedItem.tokenUsage.cachedTokens.toLocaleString()} cached)` : ""} / ${candidates.toLocaleString()} out${thoughts > 0 ? ` + ${thoughts.toLocaleString()} thoughts` : ""}`}
                    >
                      <span className="text-[9px] text-[#888884] font-semibold mr-1.5">TOKENS:</span>
                      <span className="font-extrabold">{selectedItem.tokenUsage.totalTokens?.toLocaleString() ?? "-"}</span>
                    </div>
                  );
                })()}

                {/* Interactive Cost Popover (Emerald) */}
                {(selectedItem.estimatedCost || selectedItem.tokenUsage) && (
                  <HistoryCostPopover
                    selectedItem={selectedItem}
                    isOpen={costPopoverItemId === selectedItem.id}
                    onToggle={() => {
                      if (costPopoverItemId === selectedItem.id) {
                        setCostPopoverItemId(null);
                      } else {
                        setCostPopoverItemId(selectedItem.id);
                      }
                    }}
                    onClose={() => setCostPopoverItemId(null)}
                    align={popoverAlign}
                    setAlign={setPopoverAlign}
                  />
                )}
              </div>
            </div>

            {/* Minimalist Icon-Only Action Cluster */}
            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
              {onToggleFavoriteHistoryItem && (
                <button
                  type="button"
                  onClick={(e) => onToggleFavoriteHistoryItem(selectedItem.id, e)}
                  className={`p-2 transition-all cursor-pointer border rounded-none flex items-center justify-center ${
                    selectedItem.isFavorite
                      ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                      : "bg-[#FAF9F6] text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                  }`}
                  title={selectedItem.isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star className={`w-3.5 h-3.5 ${selectedItem.isFavorite ? "fill-amber-400 text-amber-500" : "text-[#888884]"}`} />
                </button>
              )}

              {onCompareHistoryItem && (selectedItem.systemPrompt || selectedItem.promptTemplate) && (
                <button
                  type="button"
                  onClick={() => onCompareHistoryItem(selectedItem)}
                  className="p-2 bg-[#FAF9F6] hover:bg-white text-[#1A1A1A] border border-[#D1D1CF] hover:border-[#1A1A1A] transition-all cursor-pointer rounded-none flex items-center justify-center"
                  title="Compare prompt & template against active workspace"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onLoadHistoryItem(selectedItem);
                  onClose();
                }}
                className="p-2 bg-[#1A1A1A] hover:bg-[#333] text-white transition-all cursor-pointer border border-[#1A1A1A] rounded-none flex items-center justify-center shadow-sm"
                title="Load sequence into active workspace"
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* References Section */}
        <div className="flex flex-col gap-2">
          <span className="text-[9px] uppercase tracking-wider text-[#888884] font-black font-mono">
            References ({(selectedItem.images?.length || 0) + (selectedItem.videos?.length || 0)})
          </span>
          {((selectedItem.images && selectedItem.images.length > 0) || (selectedItem.videos && selectedItem.videos.length > 0)) ? (
            <div className="flex flex-wrap gap-3">
              {selectedItem.images?.map((img, idx) => {
                const b64 = resolvedImages[img.id || ""];
                return (
                  <HistoryImageCardWithHover
                    key={img.id || idx}
                    img={img}
                    idx={idx}
                    b64={b64}
                  />
                );
              })}

              {(() => {
                let vCount = 0;
                let aCount = 0;
                let dCount = 0;
                return selectedItem.videos?.map((vid, idx) => {
                  const isYt = vid.isYouTube || Boolean(vid.youtubeUrl);
                  const isAudio = Boolean(vid.mimeType?.startsWith("audio/"));
                  const isDoc = Boolean(
                    vid.mimeType?.startsWith("text/") ||
                    vid.mimeType === "application/pdf" ||
                    (vid.mimeType && !vid.mimeType.startsWith("video/") && !vid.mimeType.startsWith("image/") && !vid.mimeType.startsWith("audio/"))
                  );
                  let tag = "";
                  if (isAudio) {
                    aCount++;
                    tag = `@AUDIO${aCount}`;
                  } else if (isDoc) {
                    dCount++;
                    tag = `@DOC${dCount}`;
                  } else {
                    vCount++;
                    tag = `@VIDEO${vCount}`;
                  }

                  return (
                    <div
                      key={vid.id || idx}
                      onClick={() => {
                        if (isYt && vid.youtubeUrl) {
                          onPreviewVideo({
                            youtubeUrl: vid.youtubeUrl,
                            title: vid.label || `Video ${vCount}`,
                            subLabel: tag,
                          });
                        }
                      }}
                      className={`flex items-center gap-2.5 border ${
                        isYt
                          ? 'border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400 cursor-pointer'
                          : isAudio
                          ? 'border-purple-300 bg-purple-50'
                          : isDoc
                          ? 'border-teal-300 bg-teal-50'
                          : 'border-amber-300 bg-amber-50'
                      } p-1.5 pr-3 text-[10px] font-mono shrink-0 transition-colors`}
                      title={isYt ? "Click to play YouTube video" : undefined}
                    >
                      <div className={`w-9 h-9 relative shrink-0 border ${
                        isYt
                          ? 'border-red-200 bg-red-100'
                          : isAudio
                          ? 'border-purple-200 bg-purple-100'
                          : isDoc
                          ? 'border-teal-200 bg-teal-100'
                          : 'border-amber-200 bg-amber-100'
                      } flex items-center justify-center overflow-hidden`}>
                        {isYt ? (
                          <YouTubeIcon className="w-4 h-4" />
                        ) : isAudio ? (
                          <Music className="w-4 h-4 text-purple-700" />
                        ) : isDoc ? (
                          <FileText className="w-4 h-4 text-teal-700" />
                        ) : (
                          <Film className="w-4 h-4 text-amber-700" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[8px] ${
                          isYt ? 'text-red-700' : isAudio ? 'text-purple-700' : isDoc ? 'text-teal-700' : 'text-amber-800'
                        } font-black flex items-center gap-1`}>
                          {tag} {isYt ? '[YT ▶ PLAY]' : ''}
                        </span>
                        <span className="text-[#1A1A1A] font-bold truncate max-w-[140px] uppercase">
                          {vid.label}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="text-[10px] uppercase font-mono italic text-[#888884] border border-dashed border-[#D1D1CF] p-2.5 text-center bg-[#FAF9F6]">
              No reference assets were attached to this sequence
            </div>
          )}
        </div>

        {/* 2-Column Adaptive Workspace Block: Main Objective & Dynamic Parameters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          
          {/* Left Column: Main Objective / Idea */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[9px] uppercase tracking-wider text-[#888884] font-black font-mono">
                Main Objective / Idea ({"{{ idea }}"})
              </span>
              {selectedItem.variables["idea"] && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedItem.variables["idea"]);
                    setIdeaCopied(true);
                    setTimeout(() => setIdeaCopied(false), 2000);
                  }}
                  className="px-2 py-0.5 bg-[#FAF9F6] border border-[#D1D1CF] text-[8px] uppercase font-bold tracking-widest hover:bg-white transition-colors cursor-pointer flex items-center gap-1 text-[#1A1A1A]"
                  title="Copy idea text"
                >
                  {ideaCopied ? (
                    <>
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5 text-[#1A1A1A]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="bg-[#FAF9F6] border border-[#D1D1CF] p-3.5 text-xs leading-relaxed text-[#1A1A1A] whitespace-pre-wrap rounded-none max-h-56 overflow-y-auto custom-scrollbar">
              {selectedItem.variables["idea"] || (
                <span className="italic text-[#888884]">No objective text defined.</span>
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Parameters with Individual Value Copy Triggers */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-wider text-[#888884] font-black font-mono shrink-0">
              Dynamic Parameters ({customParams.length})
            </span>
            <div className="bg-white border border-[#D1D1CF] p-3.5 max-h-56 overflow-y-auto custom-scrollbar">
              {customParams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customParams.map(([key, val]) => {
                    const label = key.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <div key={key} className="flex flex-col gap-1 border border-[#EAEAE8] bg-[#FAF9F6]/50 p-2.5">
                        <div className="flex items-center justify-between gap-1">
                          <div className="min-w-0 flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-[#1A1A1A] tracking-wider truncate" title={label}>
                              {label}
                            </span>
                            <span className="text-[8px] font-mono text-[#888884]">
                              {"{{"} {key} {"}}"}
                            </span>
                          </div>
                          {val && (
                            <button
                              type="button"
                              onClick={() => handleCopyParam(key, val)}
                              className="p-1 text-[#888884] hover:text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-[#D1D1CF] shrink-0"
                              title="Copy parameter value"
                            >
                              {copiedParamKey === key ? (
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-[#444] font-mono break-all mt-1 bg-white p-2 border border-[#EAEAE8]">
                          {val || <span className="italic text-stone-400">Empty value</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full min-h-[60px] flex items-center justify-center text-[9px] uppercase font-mono italic text-[#888884] border border-dashed border-[#D1D1CF] p-3 text-center bg-[#FAF9F6]">
                  No custom parameters configured
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Collapsible Compiled Instructions with Copy button */}
        <div className="border-t border-[#D1D1CF] pt-4">
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setShowCompiled(!showCompiled)}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[#888884] hover:text-[#1A1A1A] transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              {showCompiled ? "Hide compiled prompt specs [-]" : "Show compiled prompt specs [+]"}
            </button>
            {selectedItem.filledPrompt && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedItem.filledPrompt);
                  setCompiledCopied(true);
                  setTimeout(() => setCompiledCopied(false), 2000);
                }}
                className="px-2.5 py-0.5 bg-[#FAF9F6] border border-[#D1D1CF] text-[8px] uppercase font-bold tracking-widest hover:bg-white transition-colors cursor-pointer flex items-center gap-1 text-[#1A1A1A]"
              >
                {compiledCopied ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5 text-[#1A1A1A]" />
                    <span>Copy Specs</span>
                  </>
                )}
              </button>
            )}
          </div>
          {showCompiled && (
            <div className="mt-2.5 p-3.5 bg-white border border-[#D1D1CF] max-h-40 overflow-y-auto text-[10px] font-mono text-[#555] whitespace-pre-wrap leading-relaxed custom-scrollbar">
              {selectedItem.filledPrompt}
            </div>
          )}
        </div>

        {/* Modular Saved Generation Output & Reasoning Viewer */}
        <HistoryOutputViewer
          key={selectedItem.id}
          output={selectedItem.output}
          thinkingResult={selectedItem.thinkingResult}
          slotId={selectedItem.id}
          title={titleText}
          tokenUsage={selectedItem.tokenUsage}
          model={selectedItem.model}
        />

      </div>
    </div>
  );
};
