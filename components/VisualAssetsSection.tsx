"use client";

import React from "react";
import { FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import YouTubeIcon from "./YouTubeIcon";
import VisualAssetCard from "./VisualAssetCard";
import VideoAssetCard from "./VideoAssetCard";
import { type UploadedVideo } from "../lib/video-utils";

export interface UploadedImage {
  id: string;
  label: string;
  base64: string;
  mimeType: string;
}

interface VisualAssetsSectionProps {
  isVisualAssetsOpen: boolean;
  onToggleVisualAssets: () => void;
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
      <div className="flex justify-between items-center">
        <div 
          onClick={onToggleVisualAssets}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
            Visual Assets & Casting Maps
          </h2>
          <span className="text-[#888884] group-hover:text-[#1A1A1A] transition-colors">
            {isVisualAssetsOpen ? (
              <ChevronDown className="w-3.5 h-3.5 transition-transform" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 transition-transform" />
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenYouTubeModal}
            className="px-2 py-0.5 border border-[#D1D1CF] hover:border-red-600 bg-white text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 text-[#1A1A1A] hover:text-red-600"
            id="add-youtube-url-btn"
          >
            <YouTubeIcon className="w-3.5 h-3.5" />
            Add YouTube URL
          </button>
          <button
            type="button"
            onClick={onOpenLibrary}
            className="px-2 py-0.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 text-[#1A1A1A]"
            id="browse-library-btn"
          >
            <FolderOpen className="w-3 h-3 text-[#1a1a1a]" />
            Browse Library
          </button>
          <span className="text-[9px] font-mono text-[#888884]">
            {"{{ visual_references }}"}
          </span>
        </div>
      </div>

      {isVisualAssetsOpen && (
        <>
          <p className="text-[11px] text-[#888884] font-medium tracking-tight -mt-1 leading-normal">
            Upload images or MP4 reference videos (&le;30s, &le;35MB). The system will name-map each asset (e.g. @image1, @video1) and inject references cleanly into your prompt templates.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mt-1">
            {/* Drag and Drop Uploader */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`min-h-[140px] border-2 border-dashed flex flex-col items-center justify-center p-4 gap-2 cursor-pointer transition-all ${
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
                accept="image/*,video/mp4,video/*"
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

            {/* Active Video Cards */}
            {uploadedVideos.map((vid, index) => (
              <VideoAssetCard
                key={vid.id}
                video={vid}
                index={index}
                onUpdateLabel={handleUpdateVideoLabel}
                onDeleteVideo={handleDeleteVideo}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
