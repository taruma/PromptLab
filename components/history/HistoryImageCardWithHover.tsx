"use client";

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Image as ImageIcon } from "lucide-react";
import { HistoryImage } from "../../types/history";

export interface HistoryImageCardProps {
  img: HistoryImage;
  idx: number;
  b64: string | undefined;
}

export const HistoryImageCardWithHover: React.FC<HistoryImageCardProps> = ({ img, idx, b64 }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [previewPos, setPreviewPos] = useState({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const previewWidth = 340;
    const estimatedHeight = 400;
    const padding = 16;

    let left = rect.right + 12;
    if (left + previewWidth > window.innerWidth - padding) {
      left = rect.left - previewWidth - 12;
    }
    if (left < padding) {
      left = padding;
    }

    let top = rect.top;
    if (top + estimatedHeight > window.innerHeight - padding) {
      top = window.innerHeight - estimatedHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }

    setPreviewPos({
      top: top + scrollY,
      left: left + scrollX,
    });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const hasImageSrc = Boolean(b64 && b64.trim().length > 0);

  return (
    <>
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex items-center gap-2.5 border border-[#D1D1CF] bg-[#F4F4F2] p-1.5 pr-3 text-[10px] font-mono shrink-0 relative group cursor-pointer hover:border-[#1A1A1A] transition-colors"
      >
        <div className="w-9 h-9 relative shrink-0 border border-[#D1D1CF] bg-white overflow-hidden">
          {hasImageSrc ? (
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

      {isHovered && hasImageSrc && typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: `${previewPos.top}px`,
              left: `${previewPos.left}px`,
            }}
            className="bg-white border border-[#1A1A1A] p-2 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] pointer-events-none z-[80] flex flex-col gap-1.5 animate-fade-in w-fit max-w-[340px]"
          >
            {img.contentHash && (
              <span className="text-[8px] text-emerald-800 font-mono block truncate max-w-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 select-all font-bold text-center">
                HASH: {img.contentHash}
              </span>
            )}
            <div className="border border-[#D1D1CF] overflow-hidden flex items-center justify-center">
              <img
                src={b64}
                alt={img.label}
                className="block w-auto h-auto max-w-[320px] max-h-[380px] object-contain"
              />
            </div>
            <div className="text-center font-mono leading-none py-0.5 flex flex-col gap-1">
              <span className="text-[9px] text-[#1A1A1A] font-bold block truncate max-w-full">
                @IMAGE{idx + 1} as {img.label || `Cast member ${idx + 1}`}
              </span>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
