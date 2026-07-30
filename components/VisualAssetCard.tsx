"use client";

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2, ImageIcon } from "lucide-react";

interface VisualAssetCardProps {
  img: {
    id: string;
    base64: string;
    blobUrl?: string;
    label: string;
    mimeType: string;
    isFilesApi?: boolean;
    fileUri?: string;
    expirationTime?: string;
    contentHash?: string;
  };
  index: number;
  onUpdateLabel: (id: string, newLabel: string) => void;
  onDeleteImage: (id: string) => void;
}

export default function VisualAssetCard({
  img,
  index,
  onUpdateLabel,
  onDeleteImage,
}: VisualAssetCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [previewPos, setPreviewPos] = useState({ top: 0, left: 0 });

  const imgSrc = (img.blobUrl && img.blobUrl.trim().length > 0)
    ? img.blobUrl
    : (img.base64 && img.base64.trim().length > 0)
    ? img.base64
    : null;

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const previewWidth = 340;
    const estimatedHeight = 400;
    const padding = 16;

    // Show on the right side of the card
    let left = rect.right + 12;

    // If there is not enough space on the right, show on the left side instead
    if (left + previewWidth > window.innerWidth - padding) {
      left = rect.left - previewWidth - 12;
    }

    // Keep left within viewport boundaries
    if (left < padding) {
      left = padding;
    }

    // Align top with the top of the card and check viewport constraints
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

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-white border border-[#D1D1CF] p-2 flex flex-col justify-between gap-1.5 group relative transition-all hover:border-[#1A1A1A]"
    >
      <div className="flex flex-col gap-1.5">
        {/* Thumbnail Box */}
        <div className="aspect-square bg-[#EAEAE8] relative overflow-hidden flex items-center justify-center">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={img.label}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#EAEAE8] text-stone-400 gap-1 p-2 text-center select-none">
              <ImageIcon className="w-6 h-6 text-stone-400 mb-0.5" />
              <span className="text-[8px] font-mono font-bold uppercase text-stone-600 truncate max-w-full">
                {img.isFilesApi ? "FILES API IMAGE" : "REFERENCE IMAGE"}
              </span>
            </div>
          )}
          
          {/* Top-Left Image Index Identifier */}
          <div className="absolute top-1 left-1 bg-[#1A1A1A] text-white text-[8px] font-mono font-bold px-1.5 py-0.5 select-none z-10">
            @image{index + 1}
          </div>

          {/* Top-Right Files API Badge */}
          {img.isFilesApi && (
            <div className="absolute top-1 right-8 bg-emerald-700 text-emerald-100 text-[7px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider select-none z-10" title={img.fileUri || "Gemini Files API"}>
              FILES API
            </div>
          )}

          {/* Delete Asset Button */}
          <button
            onClick={() => onDeleteImage(img.id)}
            className="absolute top-1 right-1 bg-white border border-[#D1D1CF] hover:border-red-600 hover:text-red-600 text-stone-500 p-1 transition-all cursor-pointer shadow-sm z-10"
            title="Delete reference image"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Small Centered ID Caption below the image */}
        <div className="text-center font-mono text-[7px] text-[#888884] select-all tracking-tighter leading-tight break-all">
          ID: {img.id}
        </div>

        {/* Input Map To Label */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] font-mono text-[#888884] uppercase tracking-wider">Map To Name:</span>
          <label htmlFor={`img-label-${img.id}`} className="sr-only">Map To Name</label>
          <input
            id={`img-label-${img.id}`}
            type="text"
            value={img.label}
            onChange={(e) => onUpdateLabel(img.id, e.target.value)}
            placeholder={`Cast member ${index + 1}`}
            className="text-[11px] font-bold underline bg-transparent outline-none w-full text-[#1A1A1A] focus:text-stone-900 focus:no-underline border-b border-transparent focus:border-[#1A1A1A]"
          />
        </div>
      </div>

      {/* Floating Smart Viewport Portal Preview on the Right */}
      {isHovered && imgSrc &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: `${previewPos.top}px`,
              left: `${previewPos.left}px`,
            }}
            className="bg-white border border-[#1A1A1A] p-2 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] pointer-events-none z-50 flex flex-col gap-1.5 animate-fade-in w-fit max-w-[340px]"
          >
            {img.contentHash && (
              <span className="text-[8px] text-emerald-800 font-mono block truncate max-w-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 select-all font-bold text-center">
                HASH: {img.contentHash}
              </span>
            )}
            <div className="border border-[#D1D1CF] overflow-hidden flex items-center justify-center">
              <img
                src={imgSrc}
                alt={img.label}
                className="block w-auto h-auto max-w-[320px] max-h-[380px] object-contain"
              />
            </div>
            <div className="text-center font-mono leading-none py-0.5 flex flex-col gap-1">
              <span className="text-[9px] text-[#1A1A1A] font-bold block truncate max-w-full">
                @image{index + 1} as {img.label || `Cast member ${index + 1}`}
              </span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
