"use client";

import React, { useEffect } from "react";
import { X, Film } from "lucide-react";

interface VideoPlayerModalProps {
  isOpen: boolean;
  videoUrl: string;
  title: string;
  subLabel?: string;
  onClose: () => void;
}

export default function VideoPlayerModal({
  isOpen,
  videoUrl,
  title,
  subLabel,
  onClose,
}: VideoPlayerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !videoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      id="video-player-modal-backdrop"
    >
      <div
        className="relative bg-white border border-[#1A1A1A] p-4 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] max-w-3xl w-full flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
        id="video-player-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D1D1CF] pb-2.5">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[#1A1A1A]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] font-sans truncate max-w-md">
              {title}
            </span>
            {subLabel && (
              <span className="text-[10px] font-mono text-[#888884] uppercase shrink-0">
                [{subLabel}]
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F4F4F2] transition-all cursor-pointer"
            title="Close video player"
            id="close-video-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="relative bg-[#1A1A1A] max-h-[70vh] flex items-center justify-center overflow-hidden border border-[#D1D1CF]">
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            className="max-h-[70vh] w-auto max-w-full object-contain"
            id="active-modal-video"
          />
        </div>

        {/* Footer info */}
        <div className="text-center font-mono text-[9px] text-[#888884] uppercase tracking-wider">
          Click outside video or press [ESC] to close
        </div>
      </div>
    </div>
  );
}
