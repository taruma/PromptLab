"use client";

import React, { useState, useEffect } from "react";
import { X, Film, AlertCircle } from "lucide-react";
import YouTubeIcon from "./YouTubeIcon";
import { isYouTubeUrl } from "../lib/video-utils";

interface AddYouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddYouTube: (url: string, label: string) => void;
  nextIndex: number;
}

export default function AddYouTubeModal({
  isOpen,
  onClose,
  onAddYouTube,
  nextIndex,
}: AddYouTubeModalProps) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset modal state whenever modal is opened
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setUrl("");
    setLabel(`YouTube Clip ${nextIndex}`);
    setError(null);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please enter a YouTube video URL.");
      return;
    }

    if (!isYouTubeUrl(trimmedUrl)) {
      setError("Invalid YouTube URL. Please provide a valid YouTube link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)");
      return;
    }

    onAddYouTube(trimmedUrl, label.trim() || `YouTube Clip ${nextIndex}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      id="add-youtube-modal-backdrop"
    >
      <div
        className="relative bg-white border border-[#1A1A1A] p-5 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] max-w-lg w-full flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
        id="add-youtube-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D1D1CF] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-red-50 border border-red-200">
              <YouTubeIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] font-sans">
                Add YouTube Reference
              </h3>
              <p className="text-[9px] font-mono text-[#888884] uppercase">
                Mapped as @video{nextIndex}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F4F4F2] transition-all cursor-pointer"
            title="Close modal"
            id="close-youtube-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-300 p-2.5 flex items-start gap-2 text-[10px] text-red-700 font-mono">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="youtube-url-input"
              className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] flex justify-between"
            >
              <span>YouTube Video URL</span>
              <span className="text-[8px] font-mono text-[#888884]">https://youtube.com/...</span>
            </label>
            <input
              id="youtube-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=9hE5-98ZeCg"
              autoFocus
              className="bg-white border border-[#D1D1CF] p-3 text-xs outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A] font-mono"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="youtube-label-input"
              className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] flex justify-between"
            >
              <span>Map To Name (Label)</span>
              <span className="text-[8px] font-mono text-[#888884]">@video{nextIndex} as...</span>
            </label>
            <input
              id="youtube-label-input"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`YouTube Clip ${nextIndex}`}
              className="bg-white border border-[#D1D1CF] p-3 text-xs outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A]"
            />
          </div>

          <div className="bg-[#F4F4F2] border border-[#D1D1CF] p-3 text-[10px] text-[#888884] font-mono leading-relaxed">
            <span className="font-bold text-[#1A1A1A] uppercase">{"// HOW IT WORKS:"}</span>
            <br />
            The model receives the video via Gemini API <code className="text-[#1A1A1A] font-bold">fileData</code>. In prompt templates, it will be mapped as <code className="text-[#1A1A1A] font-bold">@video{nextIndex} as {label || `YouTube Clip ${nextIndex}`}</code>.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#D1D1CF]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer text-[#1A1A1A]"
            >
              [ESC] Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white border border-[#1A1A1A] text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
            >
              <YouTubeIcon className="w-3.5 h-3.5" />
              Add YouTube Reference
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
