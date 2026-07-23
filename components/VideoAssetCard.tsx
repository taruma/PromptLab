"use client";

import React, { useState } from "react";
import { Trash2, Play, Film } from "lucide-react";
import VideoPlayerModal from "./VideoPlayerModal";
import YouTubeIcon from "./YouTubeIcon";
import { getYouTubeThumbnailUrl, extractYouTubeVideoId } from "../lib/video-utils";

interface VideoAssetCardProps {
  video: {
    id: string;
    base64?: string;
    youtubeUrl?: string;
    isYouTube?: boolean;
    label: string;
    mimeType?: string;
  };
  index: number;
  onUpdateLabel: (id: string, newLabel: string) => void;
  onDeleteVideo: (id: string) => void;
}

export default function VideoAssetCard({
  video,
  index,
  onUpdateLabel,
  onDeleteVideo,
}: VideoAssetCardProps) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const isYt = video.isYouTube || Boolean(video.youtubeUrl);
  const ytThumbnail = video.youtubeUrl ? getYouTubeThumbnailUrl(video.youtubeUrl) : null;
  const ytVideoId = video.youtubeUrl ? extractYouTubeVideoId(video.youtubeUrl) : null;

  return (
    <>
      <div
        className="bg-white border border-[#D1D1CF] p-2.5 flex flex-col justify-between gap-2.5 group relative transition-all hover:border-[#1A1A1A]"
        id={`video-asset-card-${video.id}`}
      >
        <div className="flex flex-col gap-2">
          {/* Video Thumbnail Box with Play Button Overlay */}
          <div
            onClick={() => setIsPlayerOpen(true)}
            className="aspect-square bg-[#1A1A1A] relative overflow-hidden flex items-center justify-center cursor-pointer group/vid"
            title={isYt ? "Click to play YouTube video" : "Click to play video"}
          >
            {isYt && ytThumbnail ? (
              // YouTube Thumbnail
              <img
                src={ytThumbnail}
                alt={video.label}
                className="w-full h-full object-cover opacity-85 group-hover/vid:opacity-100 transition-opacity"
              />
            ) : video.base64 ? (
              // Local File Video
              <video
                src={video.base64}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover opacity-85 group-hover/vid:opacity-100 transition-opacity"
              />
            ) : (
              // Fallback YouTube placeholder
              <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-400 gap-1 p-2">
                <YouTubeIcon className="w-8 h-8" />
                <span className="text-[8px] font-mono uppercase text-stone-400 truncate max-w-full">
                  {ytVideoId || "YouTube Video"}
                </span>
              </div>
            )}

            {/* Play Overlay Badge */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/vid:bg-black/10 transition-colors">
              <div className="w-9 h-9 bg-white/90 border border-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center group-hover/vid:scale-110 transition-transform shadow-md">
                {isYt ? (
                  <YouTubeIcon className="w-5 h-5" />
                ) : (
                  <Play className="w-4 h-4 fill-[#1A1A1A] ml-0.5 text-[#1A1A1A]" />
                )}
              </div>
            </div>

            {/* Top-Left Video Index Identifier - Always retains @videoN mapping */}
            <div className="absolute top-1 left-1 bg-[#1A1A1A] text-white text-[8px] font-mono font-bold px-1.5 py-0.5 select-none flex items-center gap-1 z-10">
              <Film className="w-2.5 h-2.5 text-amber-400" />
              @video{index + 1}
            </div>

            {/* Top-Right Badge for YouTube */}
            {isYt && (
              <div className="absolute top-1 right-8 bg-red-600 text-white text-[7px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider select-none z-10">
                YT
              </div>
            )}

            {/* Delete Asset Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteVideo(video.id);
              }}
              className="absolute top-1 right-1 bg-white border border-[#D1D1CF] hover:border-red-600 hover:text-red-600 text-stone-500 p-1 transition-all cursor-pointer shadow-sm z-10"
              title="Delete reference video"
              id={`delete-video-btn-${video.id}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* ID or YouTube URL Caption */}
          <div className="text-center font-mono text-[7px] text-[#888884] select-all tracking-tighter leading-tight break-all truncate" title={video.youtubeUrl || video.id}>
            {isYt ? `YT: ${ytVideoId || video.youtubeUrl}` : `ID: ${video.id}`}
          </div>

          {/* Input Map To Label */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-mono text-[#888884] uppercase tracking-wider">
              Map To Name:
            </span>
            <label htmlFor={`vid-label-${video.id}`} className="sr-only">
              Map To Name
            </label>
            <input
              id={`vid-label-${video.id}`}
              type="text"
              value={video.label}
              onChange={(e) => onUpdateLabel(video.id, e.target.value)}
              placeholder={`Video reference ${index + 1}`}
              className="text-[11px] font-bold underline bg-transparent outline-none w-full text-[#1A1A1A] focus:text-stone-900 focus:no-underline border-b border-transparent focus:border-[#1A1A1A]"
            />
          </div>
        </div>
      </div>

      {/* Full Video Player Modal */}
      <VideoPlayerModal
        isOpen={isPlayerOpen}
        videoUrl={video.base64}
        youtubeUrl={video.youtubeUrl}
        title={video.label || `Video ${index + 1}`}
        subLabel={`@video${index + 1}`}
        onClose={() => setIsPlayerOpen(false)}
      />
    </>
  );
}
