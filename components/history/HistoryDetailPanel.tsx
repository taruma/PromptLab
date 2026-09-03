"use client";

import React, { useState } from "react";
import { 
  FolderOpen, 
  Star, 
  Copy, 
  Settings, 
  GitCompare, 
  Film, 
  Music, 
  FileText 
} from "lucide-react";
import { HistoryItem } from "../../types/history";
import YouTubeIcon from "../YouTubeIcon";
import { HistoryImageCardWithHover } from "./HistoryImageCardWithHover";
import { HistoryCostPopover } from "./HistoryCostPopover";

export interface HistoryDetailPanelProps {
  selectedItem: HistoryItem | null;
  resolvedImages: Record<string, string>;
  onToggleFavoriteHistoryItem?: (id: string, e?: React.MouseEvent) => void;
  onLoadHistoryItem: (item: HistoryItem) => void;
  onClose: () => void;
  onCompareHistoryItem?: (item: HistoryItem) => void;
  onPreviewVideo: (video: { youtubeUrl: string; title: string; subLabel: string }) => void;
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
  costPopoverItemId,
  setCostPopoverItemId,
  popoverAlign,
  setPopoverAlign,
}) => {
  const [showCompiled, setShowCompiled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ideaCopied, setIdeaCopied] = useState(false);
  const [compiledCopied, setCompiledCopied] = useState(false);

  const handleCopyOutput = () => {
    if (!selectedItem?.output) return;
    navigator.clipboard.writeText(selectedItem.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            No Past Sequence Selected
          </h4>
          <p className="text-[11px] leading-relaxed text-[#888884]">
            Select any generation slot from the left directory column to inspect its dynamic parameters, reference configuration, and synthesized plain-text sequence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto custom-scrollbar p-6 min-w-0 h-2/3 md:h-full">
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
              {(selectedItem.model || "gemini-3.8-flash").replace(/^gemini-/i, "")}
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
          {selectedItem.tokenUsage && (() => {
            const prompt = selectedItem.tokenUsage.promptTokens ?? 0;
            const candidates = selectedItem.tokenUsage.candidatesTokens ?? 0;
            const total = selectedItem.tokenUsage.totalTokens ?? (prompt + candidates);
            const thoughts = selectedItem.tokenUsage.thoughtTokens !== undefined
              ? selectedItem.tokenUsage.thoughtTokens
              : Math.max(0, total - prompt - candidates);
            return (
              <div
                className="flex items-center gap-1.5 bg-[#F4F4F2] border border-[#D1D1CF] px-2 py-0.5"
                title={`${prompt.toLocaleString()} in${selectedItem.tokenUsage.cachedTokens ? ` (${selectedItem.tokenUsage.cachedTokens.toLocaleString()} cached)` : ""} / ${candidates.toLocaleString()} out${thoughts > 0 ? ` + ${thoughts.toLocaleString()} thoughts` : ""}`}
              >
                <span className="text-[8px] text-[#888884] uppercase font-bold">Tokens</span>
                <span className="text-[#1A1A1A] font-extrabold uppercase text-[9px]">
                  {selectedItem.tokenUsage.totalTokens?.toLocaleString() ?? "-"}
                </span>
              </div>
            );
          })()}

          {/* Interactive Cost Breakdown Popover */}
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

          {(selectedItem.presetLabel || selectedItem.systemPrompt || selectedItem.promptTemplate) && (
            <div className="flex items-center gap-1.5 bg-[#F4F4F2] border border-[#D1D1CF] px-2 py-0.5">
              <span className="text-[8px] text-[#888884] uppercase font-bold">Preset</span>
              <span className="text-[#1A1A1A] font-extrabold uppercase text-[9px]">
                {selectedItem.presetLabel ? selectedItem.presetLabel.replace("PRESET: ", "") : "CUSTOM"}
              </span>
              {onCompareHistoryItem && (selectedItem.systemPrompt || selectedItem.promptTemplate) && (
                <button
                  type="button"
                  onClick={() => onCompareHistoryItem(selectedItem)}
                  className="ml-1 px-1.5 py-0.5 bg-white hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white border border-[#D1D1CF] hover:border-[#1A1A1A] transition-all cursor-pointer font-sans text-[8px] font-bold uppercase flex items-center gap-1"
                  title="Compare system prompt and prompt template diff with active workspace"
                >
                  <GitCompare className="w-2.5 h-2.5" />
                  <span>Diff</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Visual Reference Assets Section */}
        <div className="flex flex-col gap-2">
          <span className="text-[9px] uppercase tracking-wider text-[#888884] font-black font-mono">
            Visual References & Casting Maps ({(selectedItem.images?.length || 0) + (selectedItem.videos?.length || 0)})
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
    </div>
  );
};
