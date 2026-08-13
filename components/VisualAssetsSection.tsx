"use client";

import React from "react";
import { FolderOpen, ChevronDown, ChevronRight, CloudUpload } from "lucide-react";
import YouTubeIcon from "./YouTubeIcon";
import VisualAssetCard from "./VisualAssetCard";
import VideoAssetCard from "./VideoAssetCard";
import { type UploadedVideo } from "../lib/video-utils";

export interface UploadedImage {
  id: string;
  label: string;
  base64: string;
  mimeType: string;
  isFilesApi?: boolean;
  fileUri?: string;
  blobUrl?: string;
  sizeBytes?: number;
  expirationTime?: string;
  contentHash?: string;
}

interface VisualAssetsSectionProps {
  isVisualAssetsOpen: boolean;
  onToggleVisualAssets: () => void;
  onOpenFilesApiModal: () => void;
  onOpenYouTubeModal: () => void;
  onOpenLibrary: () => void;
  videoError: string | null;
  onClearVideoError: () => void;
  storageWarningMessage: string | null;
  onClearStorageWarning: () => void;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  dragActive: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedImages: UploadedImage[];
  handleUpdateLabel: (id: string, label: string) => void;
  handleDeleteImage: (id: string) => void;
  uploadedVideos: UploadedVideo[];
  handleUpdateVideoLabel: (id: string, label: string) => void;
  handleDeleteVideo: (id: string) => void;
}

export default function VisualAssetsSection({
  isVisualAssetsOpen,
  onToggleVisualAssets,
  onOpenFilesApiModal,
  onOpenYouTubeModal,
  onOpenLibrary,
  videoError,
  onClearVideoError,
  storageWarningMessage,
  onClearStorageWarning,
  handleDrag,
  handleDrop,
  dragActive,
  fileInputRef,
  handleFileChange,
  uploadedImages,
  handleUpdateLabel,
  handleDeleteImage,
  uploadedVideos,
  handleUpdateVideoLabel,
  handleDeleteVideo,
}: VisualAssetsSectionProps) {
  return (
    <section className="flex flex-col gap-3" id="images-reference-section">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        {/* Left: Section Title & Toggle Chevron */}
        <div 
          onClick={onToggleVisualAssets}
          className="flex items-center gap-2 cursor-pointer select-none group shrink-0"
        >
          <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
            Visual Assets
          </h2>
          <span className="text-[#888884] group-hover:text-[#1A1A1A] transition-colors">
            {isVisualAssetsOpen ? (
              <ChevronDown className="w-3.5 h-3.5 transition-transform" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 transition-transform" />
            )}
          </span>
        </div>

        {/* Right: Action Buttons + {{ visual_references }} tag */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenFilesApiModal}
            className="px-2 py-1 sm:px-2.5 sm:py-1 border border-[#D1D1CF] hover:border-emerald-600 bg-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 text-[#1A1A1A] hover:text-emerald-700 shadow-2xs"
            id="open-files-api-modal-btn"
          >
            <CloudUpload className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Files API Upload</span>
            <span className="sm:hidden">Files API</span>
          </button>
          <button
            type="button"
            onClick={onOpenYouTubeModal}
            className="px-2 py-1 sm:px-2.5 sm:py-1 border border-[#D1D1CF] hover:border-red-600 bg-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 text-[#1A1A1A] hover:text-red-600 shadow-2xs"
            id="add-youtube-url-btn"
          >
            <YouTubeIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Add YouTube URL</span>
            <span className="sm:hidden">YouTube</span>
          </button>
          <button
            type="button"
            onClick={onOpenLibrary}
            className="px-2 py-1 sm:px-2.5 sm:py-1 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 text-[#1A1A1A] shadow-2xs"
            id="browse-library-btn"
          >
            <FolderOpen className="w-3 h-3 text-[#1a1a1a] shrink-0" />
            <span className="hidden sm:inline">Browse Library</span>
            <span className="sm:hidden">Library</span>
          </button>

          <span className="text-[9px] font-mono text-[#888884] shrink-0 ml-auto sm:ml-1">
            {"{{ visual_references }}"}
          </span>
        </div>
      </div>

      {isVisualAssetsOpen && (
        <>
          <p className="text-[11px] text-[#888884] font-medium tracking-tight leading-normal">
            Upload images, MP4 reference videos (&le;30s, &le;35MB), or attach Gemini Files API media (video, audio, PDF, text documents) up to 2GB. Local images are compressed for browser storage; use <strong className="text-[#1A1A1A] font-semibold">Files API Upload</strong> to retain full original quality or attach non-image formats. Assets are auto-mapped (e.g., <code className="font-mono text-[10px] bg-[#EAEAE8] px-1 py-0.5 text-[#1A1A1A]">@image1</code>, <code className="font-mono text-[10px] bg-[#EAEAE8] px-1 py-0.5 text-[#1A1A1A]">@video1</code>, <code className="font-mono text-[10px] bg-[#EAEAE8] px-1 py-0.5 text-[#1A1A1A]">@audio1</code>, <code className="font-mono text-[10px] bg-[#EAEAE8] px-1 py-0.5 text-[#1A1A1A]">@doc1</code>) and injected into your template.
          </p>

          {videoError && (
            <div className="bg-red-50 border border-red-300 p-3 flex justify-between items-start text-[10px] text-red-700 font-mono leading-relaxed rounded-none" id="video-validation-error">
              <div className="flex gap-2">
                <span className="font-bold">⚠️ VIDEO ERROR:</span>
                <span>{videoError}</span>
              </div>
              <button 
                onClick={onClearVideoError}
                className="font-bold hover:text-red-900 px-1 ml-2 shrink-0 cursor-pointer"
              >
                [X]
              </button>
            </div>
          )}

          {storageWarningMessage && (
            <div className="bg-[#FFFBEB] border border-[#F59E0B] p-3 flex justify-between items-start text-[10px] text-[#B45309] font-mono leading-relaxed rounded-none" id="storage-quota-warning">
              <div className="flex gap-2">
                <span className="font-bold">⚠️ NOTE:</span>
                <span>{storageWarningMessage}</span>
              </div>
              <button 
                onClick={onClearStorageWarning}
                className="font-bold hover:text-[#78350F] px-1 ml-2 shrink-0 cursor-pointer"
              >
                [X]
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-1">
            {/* Drag and Drop Uploader */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`min-h-[120px] border-2 border-dashed flex flex-col items-center justify-center p-2.5 gap-1.5 cursor-pointer transition-all ${
                dragActive 
                  ? "border-[#1A1A1A] bg-[#EAEAE8]" 
                  : "border-[#D1D1CF] bg-white hover:border-[#1A1A1A]"
              }`}
              id="upload-dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,application/pdf,text/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-file-uploader"
              />
              <span className="text-xl text-[#888884] font-bold">+</span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A]">Upload Asset</span>
              <span className="text-[8px] text-[#888884] font-mono uppercase tracking-tight">Image or MP4 Video</span>
            </div>

            {/* Active Image Cards */}
            {uploadedImages.map((img, index) => (
              <VisualAssetCard
                key={img.id}
                img={img}
                index={index}
                onUpdateLabel={handleUpdateLabel}
                onDeleteImage={handleDeleteImage}
              />
            ))}

            {/* Active Video/Audio/Doc Cards */}
            {(() => {
              let vCount = 0;
              let aCount = 0;
              let dCount = 0;
              return uploadedVideos.map((vid) => {
                const isAudio = Boolean(vid.mimeType?.startsWith("audio/"));
                const isDoc = Boolean(
                  vid.mimeType?.startsWith("text/") ||
                  vid.mimeType === "application/pdf" ||
                  (vid.mimeType && !vid.mimeType.startsWith("video/") && !vid.mimeType.startsWith("image/") && !vid.mimeType.startsWith("audio/"))
                );
                let tag = "";
                let indexForCard = 0;
                if (isAudio) {
                  aCount++;
                  tag = `@audio${aCount}`;
                  indexForCard = aCount - 1;
                } else if (isDoc) {
                  dCount++;
                  tag = `@doc${dCount}`;
                  indexForCard = dCount - 1;
                } else {
                  vCount++;
                  tag = `@video${vCount}`;
                  indexForCard = vCount - 1;
                }
                return (
                  <VideoAssetCard
                    key={vid.id}
                    video={vid}
                    tag={tag}
                    index={indexForCard}
                    onUpdateLabel={handleUpdateVideoLabel}
                    onDeleteVideo={handleDeleteVideo}
                  />
                );
              });
            })()}
          </div>
        </>
      )}
    </section>
  );
}
