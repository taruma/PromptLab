"use client";

import React, { useEffect } from "react";
import { X, Film, ExternalLink } from "lucide-react";
import YouTubeIcon from "./YouTubeIcon";
import { extractYouTubeVideoId, isYouTubeUrl } from "../lib/video-utils";

interface VideoPlayerModalProps {
  isOpen: boolean;
  videoUrl?: string;
  youtubeUrl?: string;
  title: string;
  subLabel?: string;
  onClose: () => void;
}

export default function VideoPlayerModal({
  isOpen,
  videoUrl,
  youtubeUrl,
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

  if (!isOpen) return null;

  const effectiveYoutubeUrl = youtubeUrl || (videoUrl && isYouTubeUrl(videoUrl) ? videoUrl : undefined);
  const ytVideoId = effectiveYoutubeUrl ? extractYouTubeVideoId(effectiveYoutubeUrl) : null;

  if (!effectiveYoutubeUrl && !videoUrl) return null;

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
            {effectiveYoutubeUrl ? (
              <YouTubeIcon className="w-4 h-4" />
            ) : (
              <Film className="w-4 h-4 text-[#1A1A1A]" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] font-sans truncate max-w-md">
              {title}
            </span>
            {subLabel && (
              <span className="text-[10px] font-mono text-[#888884] uppercase shrink-0">
                [{subLabel}]
              </span>
            )}
            {effectiveYoutubeUrl && (
              <a
                href={effectiveYoutubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-mono text-red-600 hover:underline flex items-center gap-1 ml-2 shrink-0"
                title="Open directly on YouTube"
              >
                <span>YouTube</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
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
        <div className="relative bg-[#1A1A1A] aspect-video w-full flex items-center justify-center overflow-hidden border border-[#D1D1CF]">
          {ytVideoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
              id="active-modal-youtube-iframe"
            />
          ) : videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              className="max-h-[70vh] w-auto max-w-full object-contain"
              id="active-modal-video"
            />
          ) : (
            <div className="p-8 text-center text-white font-mono text-xs">
              Video source unavailable.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center font-mono text-[9px] text-[#888884] uppercase tracking-wider">
          Click outside video or press [ESC] to close
        </div>
      </div>
    </div>
  );
}
