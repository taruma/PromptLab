"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";

interface VisualAssetCardProps {
  img: {
    id: string;
    base64: string;
    label: string;
    mimeType: string;
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

  const handleMouseEnter = () => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const previewWidth = 280;
    const estimatedHeight = 320;
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
      className="bg-white border border-[#D1D1CF] p-2.5 flex flex-col justify-between gap-2.5 group relative transition-all hover:border-[#1A1A1A]"
    >
      <div className="flex flex-col gap-2">
        {/* Thumbnail Box */}
        <div className="aspect-square bg-[#EAEAE8] relative overflow-hidden flex items-center justify-center">
          <img
            src={img.base64}
            alt={img.label}
            className="w-full h-full object-cover"
          />
          
          {/* Top-Left Image Index Identifier */}
          <div className="absolute top-1 left-1 bg-[#1A1A1A] text-white text-[8px] font-mono font-bold px-1.5 py-0.5 select-none">
            @image{index + 1}
          </div>

          {/* Delete Asset Button */}
          <button
            onClick={() => onDeleteImage(img.id)}
            className="absolute top-1 right-1 bg-white border border-[#D1D1CF] hover:border-red-600 hover:text-red-600 text-stone-500 p-1 transition-all cursor-pointer shadow-sm"
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
      {isHovered &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: `${previewPos.top}px`,
              left: `${previewPos.left}px`,
              width: "280px",
            }}
            className="bg-white border border-[#1A1A1A] p-2 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] pointer-events-none z-50 flex flex-col gap-1.5 animate-fade-in"
          >
            <div className="relative bg-[#EAEAE8] max-h-[320px] overflow-hidden flex items-center justify-center border border-[#D1D1CF]">
              <img
                src={img.base64}
                alt={img.label}
                className="w-full h-auto max-h-[300px] object-contain"
              />
            </div>
            <div className="text-center font-mono leading-none py-0.5">
              <span className="text-[9px] text-[#1A1A1A] font-bold block truncate">
                @image{index + 1} as {img.label || `Cast member ${index + 1}`}
              </span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
