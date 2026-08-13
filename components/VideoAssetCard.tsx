"use client";

import React, { useState } from "react";
import { Trash2, Play, Film, Music, FileText, Volume2 } from "lucide-react";
import VideoPlayerModal from "./VideoPlayerModal";
import AudioPlayerModal from "./AudioPlayerModal";
import YouTubeIcon from "./YouTubeIcon";
import { getYouTubeThumbnailUrl, extractYouTubeVideoId } from "../lib/video-utils";

interface VideoAssetCardProps {
  video: {
    id: string;
    base64?: string;
    blobUrl?: string;
    youtubeUrl?: string;
    isYouTube?: boolean;
    isFilesApi?: boolean;
    fileUri?: string;
    expirationTime?: string;
    sizeBytes?: number;
    label: string;
    mimeType?: string;
  };
  index: number;
  tag?: string;
  onUpdateLabel: (id: string, newLabel: string) => void;
  onDeleteVideo: (id: string) => void;
}

export default function VideoAssetCard({
  video,
  index,
  tag,
  onUpdateLabel,
  onDeleteVideo,
}: VideoAssetCardProps) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);

  const isYt = Boolean(video.isYouTube || (video.youtubeUrl && video.youtubeUrl.trim().length > 0));
  const rawLocalVideoSrc = (video.blobUrl && video.blobUrl.trim().length > 0) ? video.blobUrl : (video.base64 && video.base64.trim().length > 0) ? video.base64 : null;
  const localVideoSrc = rawLocalVideoSrc;
  
  const isAudio = Boolean(video.mimeType?.startsWith("audio/"));
  const isDoc = Boolean(video.mimeType?.startsWith("text/") || video.mimeType === "application/pdf");
  const isVideo = !isAudio && !isDoc;
  
  const isPlayableVideo = isVideo && (isYt || Boolean(localVideoSrc));
  const isPlayableAudio = isAudio;

  const displayTag = tag || (isAudio ? `@audio${index + 1}` : isDoc ? `@doc${index + 1}` : `@video${index + 1}`);

  const rawYtThumbnail = video.youtubeUrl ? getYouTubeThumbnailUrl(video.youtubeUrl) : null;
  const ytThumbnail = (rawYtThumbnail && rawYtThumbnail.trim().length > 0) ? rawYtThumbnail : null;
  const ytVideoId = video.youtubeUrl ? extractYouTubeVideoId(video.youtubeUrl) : null;

  return (
    <>
      <div
        className="bg-white border border-[#D1D1CF] p-2 flex flex-col justify-between gap-1.5 group relative transition-all hover:border-[#1A1A1A]"
        id={`video-asset-card-${video.id}`}
      >
        <div className="flex flex-col gap-1.5">
          {/* Asset Thumbnail Box */}
          <div
            onClick={() => {
              if (isPlayableVideo) {
                setIsPlayerOpen(true);
              } else if (isPlayableAudio) {
                setIsAudioPlayerOpen(true);
              }
            }}
            className={`aspect-square bg-[#1A1A1A] relative overflow-hidden flex items-center justify-center group/vid ${
              isPlayableVideo || isPlayableAudio ? "cursor-pointer" : "cursor-default"
            }`}
            title={
              isYt
                ? "Click to play YouTube video"
                : isVideo
                ? "Click to play video"
                : isAudio
                ? "Click to listen to audio asset"
                : "Attached document reference"
            }
          >
            {isYt ? (
              ytThumbnail ? (
                // YouTube Thumbnail
                <img
                  src={ytThumbnail}
                  alt={video.label}
                  className="w-full h-full object-cover opacity-85 group-hover/vid:opacity-100 transition-opacity"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                // YouTube fallback placeholder when thumbnail unavailable
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 text-stone-400 gap-1 p-2">
                  <YouTubeIcon className="w-8 h-8 text-red-500" />
                  <span className="text-[8px] font-mono uppercase text-stone-400 truncate max-w-full">
                    {ytVideoId ? `YT: ${ytVideoId}` : "YOUTUBE VIDEO"}
                  </span>
                </div>
              )
            ) : isVideo && localVideoSrc ? (
              // Local File Video with Base64 Stream or Object URL
              <video
                src={localVideoSrc}
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover opacity-85 group-hover/vid:opacity-100 transition-opacity"
              />
            ) : isAudio ? (
              // Audio Reference Placeholder
              <div className="w-full h-full flex flex-col items-center justify-center bg-purple-950 text-purple-200 gap-1 p-2 text-center select-none">
                <Music className="w-7 h-7 text-purple-400 mb-0.5" />
                <span className="text-[9px] font-mono font-bold uppercase text-purple-100 truncate max-w-full">
                  {video.isFilesApi ? "FILES API AUDIO" : "AUDIO ASSET"}
                </span>
                <span className="text-[7px] font-mono uppercase text-purple-400 tracking-wider">
                  {video.fileUri ? "(URI LINKED)" : "(AUDIO REF)"}
                </span>
              </div>
            ) : isDoc ? (
              // Document Reference Placeholder
              <div className="w-full h-full flex flex-col items-center justify-center bg-teal-950 text-teal-200 gap-1 p-2 text-center select-none">
                <FileText className="w-7 h-7 text-teal-400 mb-0.5" />
                <span className="text-[9px] font-mono font-bold uppercase text-teal-100 truncate max-w-full">
                  {video.isFilesApi ? "FILES API DOC" : "DOCUMENT"}
                </span>
                <span className="text-[7px] font-mono uppercase text-teal-400 tracking-wider">
                  {video.fileUri ? "(URI LINKED)" : "(TEXT REF)"}
                </span>
              </div>
            ) : (
              // Local MP4 Video Reference Placeholder (loaded from history without stream)
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#1A1A1A] text-stone-400 gap-1 p-2 text-center select-none">
                <Film className="w-7 h-7 text-amber-400/90 mb-0.5" />
                <span className="text-[9px] font-mono font-bold uppercase text-stone-200 truncate max-w-full">
                  {video.isFilesApi ? "FILES API VIDEO" : "MP4 REFERENCE"}
                </span>
                <span className="text-[7px] font-mono uppercase text-stone-500 tracking-wider">
                  {video.isFilesApi ? "(URI LINKED)" : "(NO LOCAL STREAM)"}
                </span>
              </div>
            )}

            {/* Video Play Overlay Badge (STRICTLY FOR VIDEO ONLY) */}
            {isPlayableVideo ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/vid:bg-black/10 transition-colors">
                <div className="w-9 h-9 bg-white/90 border border-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center group-hover/vid:scale-110 transition-transform shadow-md">
                  {isYt ? (
                    <YouTubeIcon className="w-5 h-5 text-red-600" />
                  ) : (
                    <Play className="w-4 h-4 fill-[#1A1A1A] ml-0.5 text-[#1A1A1A]" />
                  )}
                </div>
              </div>
            ) : isAudio ? (
              /* Audio Listen Hover Badge (NO Play button) */
              <div className="absolute inset-0 flex items-center justify-center bg-purple-950/40 opacity-0 group-hover/vid:opacity-100 transition-opacity">
                <div className="px-2 py-1 bg-purple-900 border border-purple-400 text-purple-100 text-[8px] font-mono font-bold flex items-center gap-1.5 shadow-md uppercase tracking-wider">
                  <Volume2 className="w-3.5 h-3.5 text-purple-300" />
                  <span>Listen Audio</span>
                </div>
              </div>
            ) : !video.isFilesApi && isVideo ? (
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 border border-[#D1D1CF]/30 text-[7px] font-mono text-stone-400 whitespace-nowrap uppercase tracking-wider select-none pointer-events-none">
                UNCACHED MP4
              </div>
            ) : null}

            {/* Top-Left Index Identifier */}
            <div className="absolute top-1 left-1 bg-[#1A1A1A] text-white text-[8px] font-mono font-bold px-1.5 py-0.5 select-none flex items-center gap-1 z-10">
              {isAudio ? (
                <Music className="w-2.5 h-2.5 text-purple-400" />
              ) : isDoc ? (
                <FileText className="w-2.5 h-2.5 text-teal-400" />
              ) : (
                <Film className="w-2.5 h-2.5 text-amber-400" />
              )}
              {displayTag}
            </div>

            {/* Top-Right Badge for type */}
            {isAudio ? (
              <div className="absolute top-1 right-8 bg-purple-800 text-purple-100 text-[7px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider select-none z-10" title={video.fileUri || "Gemini Files API Audio"}>
                AUDIO
              </div>
            ) : isDoc ? (
              <div className="absolute top-1 right-8 bg-teal-800 text-teal-100 text-[7px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider select-none z-10" title={video.fileUri || "Gemini Files API Document"}>
                DOC
              </div>
            ) : video.isFilesApi ? (
              <div className="absolute top-1 right-8 bg-emerald-700 text-emerald-100 text-[7px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider select-none z-10" title={video.fileUri || "Gemini Files API"}>
                FILES API
              </div>
            ) : isYt ? (
              <div className="absolute top-1 right-8 bg-red-600 text-white text-[7px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider select-none z-10">
                YT
              </div>
            ) : (
              <div className="absolute top-1 right-8 bg-stone-700 text-stone-200 text-[7px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider select-none z-10">
                MP4
              </div>
            )}

            {/* Delete Asset Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteVideo(video.id);
              }}
              className="absolute top-1 right-1 bg-white border border-[#D1D1CF] hover:border-red-600 hover:text-red-600 text-stone-500 p-1 transition-all cursor-pointer shadow-sm z-10"
              title="Delete reference asset"
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
              placeholder={`Asset reference ${index + 1}`}
              className="text-[11px] font-bold underline bg-transparent outline-none w-full text-[#1A1A1A] focus:text-stone-900 focus:no-underline border-b border-transparent focus:border-[#1A1A1A]"
            />
          </div>
        </div>
      </div>

      {/* Full Video Player Modal (Strictly for Videos) */}
      <VideoPlayerModal
        isOpen={isPlayerOpen}
        videoUrl={video.base64}
        youtubeUrl={video.youtubeUrl}
        title={video.label || `Video ${index + 1}`}
        subLabel={displayTag}
        onClose={() => setIsPlayerOpen(false)}
      />

      {/* Audio Player Modal (Strictly for Audio) */}
      <AudioPlayerModal
        isOpen={isAudioPlayerOpen}
        audioUrl={localVideoSrc || undefined}
        fileUri={video.fileUri}
        mimeType={video.mimeType}
        title={video.label || `Audio ${index + 1}`}
        subLabel={displayTag}
        onClose={() => setIsAudioPlayerOpen(false)}
      />
    </>
  );
}
