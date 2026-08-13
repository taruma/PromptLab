"use client";

import React from "react";
import { HistoryItem } from "./HistorySection";
import { Calendar, Cpu, Bookmark, Image as ImageIcon, Video as VideoIcon, Music, FileText } from "lucide-react";
import { calculateEstimatedCost } from "@/lib/pricing";

interface HistoryCardSummaryProps {
  item: HistoryItem;
  className?: string;
}

export default function HistoryCardSummary({ item, className = "" }: HistoryCardSummaryProps) {
  const title = item.name || item.variables["idea"] || "Untitled Outline";
  const rawOutput = item.output || "";
  const cleanedText = rawOutput
    ? rawOutput.replace(/[#*`_>~-]/g, " ").replace(/\s+/g, " ").trim()
    : "No output generated.";
  const outputExcerpt = cleanedText.length > 220
    ? cleanedText.slice(0, 217) + "..."
    : cleanedText;

  const imageCount = item.images?.length || 0;
  const rawVideos = item.videos || [];
  const videoCount = rawVideos.filter(v => !v.mimeType?.startsWith("audio/") && !(v.mimeType?.startsWith("text/") || v.mimeType === "application/pdf")).length;
  const audioCount = rawVideos.filter(v => Boolean(v.mimeType?.startsWith("audio/"))).length;
  const docCount = rawVideos.filter(v => Boolean(v.mimeType?.startsWith("text/") || v.mimeType === "application/pdf" || (v.mimeType && !v.mimeType.startsWith("video/") && !v.mimeType.startsWith("image/") && !v.mimeType.startsWith("audio/")))).length;

  const modelName = item.model || "gemini-3.5-flash";
  const presetName = item.presetLabel;

  return (
    <div className={`bg-white border border-[#D1D1CF] p-3.5 flex flex-col gap-2.5 shadow-xs ${className}`}>
      {/* Top Meta Bar: Timestamp + Badges */}
      <div className="flex items-center justify-between flex-wrap gap-1.5 border-b border-[#EAEAE8] pb-2">
        {/* Date / Timestamp */}
        <div className="flex items-center gap-1 text-[#888884] font-mono text-[10px] font-bold">
          <Calendar className="w-3 h-3 text-[#888884] shrink-0" />
          <span>{item.timestamp || "Unknown Date"}</span>
        </div>

        {/* Badges Container */}
        <div className="flex items-center flex-wrap gap-1">
          {imageCount > 0 && (
            <span className="bg-[#1A1A1A] text-white px-1.5 py-0.5 font-mono uppercase font-bold text-[8px] tracking-wider leading-none flex items-center gap-1">
              <ImageIcon className="w-2.5 h-2.5" />
              {imageCount} IMG
            </span>
          )}
          {videoCount > 0 && (
            <span className="bg-[#1A1A1A] text-[#F59E0B] border border-[#F59E0B]/30 px-1.5 py-0.5 font-mono uppercase font-bold text-[8px] tracking-wider leading-none flex items-center gap-1">
              <VideoIcon className="w-2.5 h-2.5" />
              {videoCount} VID
            </span>
          )}
          {audioCount > 0 && (
            <span className="bg-purple-900 text-purple-100 px-1.5 py-0.5 font-mono uppercase font-bold text-[8px] tracking-wider leading-none flex items-center gap-1">
              <Music className="w-2.5 h-2.5 text-purple-300" />
              {audioCount} AUD
            </span>
          )}
          {docCount > 0 && (
            <span className="bg-teal-900 text-teal-100 px-1.5 py-0.5 font-mono uppercase font-bold text-[8px] tracking-wider leading-none flex items-center gap-1">
              <FileText className="w-2.5 h-2.5 text-teal-300" />
              {docCount} DOC
            </span>
          )}
          {modelName && (
            <span className="bg-[#EAEAE8] text-[#1A1A1A] border border-[#D1D1CF] px-1.5 py-0.5 font-mono uppercase font-bold text-[8px] tracking-wider leading-none flex items-center gap-1">
              <Cpu className="w-2.5 h-2.5 text-[#666]" />
              {modelName}
            </span>
          )}
          {item.tokenUsage?.totalTokens !== undefined && (
            <span className="bg-[#EAEAE8] text-[#1A1A1A] border border-[#D1D1CF] px-1.5 py-0.5 font-mono uppercase font-bold text-[8px] tracking-wider leading-none flex items-center gap-1" title={`${item.tokenUsage.promptTokens ?? "-"} in ${item.tokenUsage.cachedTokens ? `(${item.tokenUsage.cachedTokens.toLocaleString()} cached) ` : ""}/ ${item.tokenUsage.candidatesTokens ?? "-"} out`}>
              {item.tokenUsage.totalTokens.toLocaleString()} TKS
            </span>
          )}
          {(item.estimatedCost || item.tokenUsage) && (() => {
            const displayCost = item.estimatedCost || (item.tokenUsage ? calculateEstimatedCost(item.model || "gemini-3.6-flash", item.tokenUsage)?.formattedTotalCost : null);
            return displayCost ? (
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 font-mono font-bold text-[8px] tracking-wider leading-none flex items-center gap-1" title={`Cost: ${displayCost}`}>
                {displayCost}
              </span>
            ) : null;
          })()}
          {presetName && (
            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 font-mono uppercase font-bold text-[8px] tracking-wider leading-none flex items-center gap-1 max-w-[130px] truncate" title={presetName}>
              <Bookmark className="w-2.5 h-2.5 text-amber-700 shrink-0" />
              <span className="truncate">{presetName}</span>
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <span className="text-[9px] font-mono uppercase text-[#888884] tracking-widest font-bold block mb-0.5">Title / Main Objective</span>
        <h4 className="text-xs font-black uppercase text-[#1A1A1A] tracking-wider font-sans line-clamp-2 leading-snug">
          {title}
        </h4>
      </div>

      {/* Output Excerpt */}
      <div>
        <span className="text-[9px] font-mono uppercase text-[#888884] tracking-widest font-bold block mb-0.5">Output Excerpt</span>
        <p className="text-[11px] text-[#555552] font-sans italic line-clamp-3 overflow-hidden text-ellipsis bg-[#F4F4F2]/60 p-2 border border-[#EAEAE8] leading-relaxed">
          {outputExcerpt}
        </p>
      </div>
    </div>
  );
}
