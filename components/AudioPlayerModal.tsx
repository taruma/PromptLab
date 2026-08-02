"use client";

import React, { useEffect } from "react";
import { X, Music, Volume2 } from "lucide-react";

interface AudioPlayerModalProps {
  isOpen: boolean;
  audioUrl?: string;
  fileUri?: string;
  title: string;
  subLabel?: string;
  mimeType?: string;
  onClose: () => void;
}

export default function AudioPlayerModal({
  isOpen,
  audioUrl,
  fileUri,
  title,
  subLabel,
  mimeType = "audio/mp3",
  onClose,
}: AudioPlayerModalProps) {
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

  const cleanAudioUrl = (audioUrl && audioUrl.trim().length > 0) ? audioUrl : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      id="audio-player-modal-backdrop"
    >
      <div
        className="relative bg-white border border-[#1A1A1A] p-4 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] max-w-md w-full flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
        id="audio-player-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D1D1CF] pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Music className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] font-sans truncate">
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
            className="p-1 border border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F4F4F2] transition-all cursor-pointer shrink-0"
            title="Close audio player"
            id="close-audio-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Player Container */}
        <div className="bg-purple-950 text-purple-100 p-5 flex flex-col items-center justify-center gap-3 border border-purple-800">
          <div className="w-12 h-12 bg-purple-900/80 border border-purple-700 flex items-center justify-center rounded-full animate-pulse">
            <Volume2 className="w-6 h-6 text-purple-300" />
          </div>
          <div className="text-center flex flex-col gap-1 w-full">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-100">
              Audio Reference Asset
            </span>
            <span className="text-[10px] font-mono text-purple-300">
              MIME: {mimeType}
            </span>
            {fileUri && (
              <span className="text-[9px] font-mono text-purple-400 break-all truncate max-w-full mt-0.5">
                URI: {fileUri}
              </span>
            )}
          </div>

          {cleanAudioUrl ? (
            <audio
              src={cleanAudioUrl}
              controls
              autoPlay
              className="w-full mt-2 accent-purple-500"
            />
          ) : (
            <div className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-800 p-2 text-center w-full mt-1">
              Audio is linked via Gemini Files API URI.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#1A1A1A] text-white text-[10px] font-mono uppercase tracking-wider hover:bg-stone-800 cursor-pointer"
            id="audio-modal-close-action-btn"
          >
            Close Player
          </button>
        </div>
      </div>
    </div>
  );
}
