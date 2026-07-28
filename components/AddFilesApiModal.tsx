"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  CloudUpload,
  Film,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Info,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Search,
  FileText,
  Plus,
  Clock,
  ExternalLink
} from "lucide-react";

export interface FilesApiListItem {
  name: string;
  displayName: string;
  mimeType: string;
  sizeBytes: number;
  fileUri: string;
  state: string;
  expirationTime?: string;
  createTime?: string;
  updateTime?: string;
}

interface AddFilesApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (mediaData: {
    label: string;
    fileUri: string;
    mimeType: string;
    sizeBytes: number;
    expirationTime?: string;
    isImage: boolean;
    fileObj?: File;
  }) => void;
  customApiKey?: string;
}

export default function AddFilesApiModal({
  isOpen,
  onClose,
  onUploadSuccess,
  customApiKey,
}: AddFilesApiModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "existing">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressStatus, setUploadProgressStatus] = useState<string>("");
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing files list states
  const [existingFiles, setExistingFiles] = useState<FilesApiListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExistingFile, setSelectedExistingFile] = useState<FilesApiListItem | null>(null);
  const [existingLabel, setExistingLabel] = useState("");
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [fileToDeleteConfirm, setFileToDeleteConfirm] = useState<FilesApiListItem | null>(null);
  const [copiedUri, setCopiedUri] = useState<string | null>(null);

  const fetchFilesList = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await fetch("/api/upload-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "list",
          customApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to list files from Gemini Files API.");
      }

      setExistingFiles(data.files || []);
    } catch (err: any) {
      console.error("Error listing Files API files:", err);
      setListError(err.message || "Failed to fetch files list.");
    } finally {
      setIsLoadingList(false);
    }
  }, [customApiKey]);

  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      fetchFilesList();
    } else if (!isOpen && prevIsOpenRef.current) {
      setSelectedFile(null);
      setLabel("");
      setError(null);
      setSelectedExistingFile(null);
      setExistingLabel("");
      setSearchQuery("");
      setListError(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, fetchFilesList]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isUploading && !deletingFile) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isUploading, deletingFile, onClose]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setError(null);
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Please select a valid image (JPEG, PNG, WebP) or video (MP4, WebM, MOV) file.");
      return;
    }

    // 2 GB limit check for Gemini Files API
    const MAX_FILES_API_SIZE = 2 * 1024 * 1024 * 1024;
    if (file.size > MAX_FILES_API_SIZE) {
      setError("File exceeds the 2 GB limit supported by Gemini Files API.");
      return;
    }

    setSelectedFile(file);
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setLabel(baseName || "Reference File");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgressPercent(0);
    setUploadProgressStatus("Initializing upload session...");

    let uploadId: string | null = null;

    try {
      const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB per chunk
      const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);

      const startRes = await fetch("/api/upload-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          totalSize: selectedFile.size,
        }),
      });

      if (!startRes.ok) {
        const errData = await startRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to start file upload session.");
      }

      const { uploadId: initUploadId } = await startRes.json();
      uploadId = initUploadId;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
        const chunkBlob = selectedFile.slice(start, end);

        const chunkFormData = new FormData();
        chunkFormData.append("action", "chunk");
        chunkFormData.append("uploadId", uploadId!);
        chunkFormData.append("chunk", chunkBlob, `chunk_${i}`);

        const pct = Math.round(((i + 1) / totalChunks) * 85);
        setUploadProgressPercent(pct);
        setUploadProgressStatus(
          `Uploading chunk ${i + 1} of ${totalChunks} (${pct}%)...`
        );

        const chunkRes = await fetch("/api/upload-file", {
          method: "POST",
          body: chunkFormData,
        });

        if (!chunkRes.ok) {
          const errData = await chunkRes.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to upload chunk ${i + 1} of ${totalChunks}.`);
        }
      }

      setUploadProgressPercent(90);
      setUploadProgressStatus("Processing file on Gemini Files API...");

      const finishRes = await fetch("/api/upload-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finish",
          uploadId: uploadId!,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          customApiKey,
        }),
      });

      let data: any = {};
      const contentType = finishRes.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await finishRes.json();
      } else {
        const text = await finishRes.text();
        throw new Error(`Server returned error status ${finishRes.status}: ${text || finishRes.statusText}`);
      }

      if (!finishRes.ok) {
        throw new Error(data.error || "Failed to complete file upload on Gemini Files API.");
      }

      setUploadProgressPercent(100);
      setUploadProgressStatus("Upload complete! File is ACTIVE.");

      const isImage = selectedFile.type.startsWith("image/");

      onUploadSuccess({
        label: label.trim() || selectedFile.name,
        fileUri: data.fileUri,
        mimeType: data.mimeType || selectedFile.type,
        sizeBytes: data.sizeBytes || selectedFile.size,
        expirationTime: data.expirationTime,
        isImage,
        fileObj: selectedFile,
      });

      setSelectedFile(null);
      setLabel("");
      setIsUploading(false);
      onClose();
    } catch (err: any) {
      console.error("Upload error:", err);
      if (uploadId) {
        fetch("/api/upload-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", uploadId }),
        }).catch(() => {});
      }
      setError(err.message || "An error occurred during file upload.");
      setIsUploading(false);
    }
  };

  const handleSelectExistingFile = (file: FilesApiListItem) => {
    setSelectedExistingFile(file);
    const baseName = (file.displayName || file.name || "Reference File").replace(/\.[^/.]+$/, "");
    setExistingLabel(baseName);
  };

  const handleAttachExistingFile = () => {
    if (!selectedExistingFile) return;

    const isImage = (selectedExistingFile.mimeType || "").startsWith("image/");

    onUploadSuccess({
      label: existingLabel.trim() || selectedExistingFile.displayName || selectedExistingFile.name,
      fileUri: selectedExistingFile.fileUri,
      mimeType: selectedExistingFile.mimeType,
      sizeBytes: selectedExistingFile.sizeBytes,
      expirationTime: selectedExistingFile.expirationTime,
      isImage,
    });

    onClose();
  };

  const performDeleteFile = async (file: FilesApiListItem) => {
    setDeletingFile(file.name);
    setListError(null);
    try {
      const res = await fetch("/api/upload-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          name: file.name,
          customApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete file from Gemini Files API.");
      }

      setExistingFiles((prev) => prev.filter((f) => f.name !== file.name));
      if (selectedExistingFile?.name === file.name) {
        setSelectedExistingFile(null);
        setExistingLabel("");
      }
      setFileToDeleteConfirm(null);
    } catch (err: any) {
      console.error("Error deleting file:", err);
      setListError(err.message || "Failed to delete file from Gemini Files API.");
    } finally {
      setDeletingFile(null);
    }
  };

  const handleCopyUri = (uri: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uri);
    setCopiedUri(uri);
    setTimeout(() => setCopiedUri(null), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatExpiration = (expirationTime?: string): string => {
    if (!expirationTime) return "Unknown";
    const expDate = new Date(expirationTime);
    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();

    if (diffMs <= 0) return "EXPIRED";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Expires in ${hours}h ${mins}m`;
    }
    return `Expires in ${mins}m`;
  };

  const filteredFiles = existingFiles.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (f.displayName || "").toLowerCase().includes(q) ||
      (f.name || "").toLowerCase().includes(q) ||
      (f.mimeType || "").toLowerCase().includes(q) ||
      (f.fileUri || "").toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs animate-fade-in"
      onClick={() => {
        if (!isUploading && !deletingFile) onClose();
      }}
      role="dialog"
      aria-modal="true"
      id="files-api-modal-backdrop"
    >
      <div
        className="relative bg-white border border-[#1A1A1A] p-5 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] max-w-xl w-full flex flex-col gap-4 max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="files-api-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D1D1CF] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-5 h-5 text-[#1A1A1A]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] font-sans">
              Gemini Files API
            </span>
            <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold px-1.5 py-0.5 uppercase">
              Up to 2 GB
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading || Boolean(deletingFile)}
            className="p-1 border border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F4F4F2] transition-all cursor-pointer disabled:opacity-50"
            title="Close modal"
            id="close-files-api-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-2 border-b border-[#D1D1CF] pb-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider border cursor-pointer transition-all ${
              activeTab === "upload"
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-[#F4F4F2] text-[#888884] border-[#D1D1CF] hover:text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Upload New File
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("existing");
              fetchFilesList();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono uppercase tracking-wider border cursor-pointer transition-all ${
              activeTab === "existing"
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-[#F4F4F2] text-[#888884] border-[#D1D1CF] hover:text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Select Existing ({existingFiles.length})
          </button>
        </div>

        {/* Informational Banner */}
        <div className="bg-[#EAEAE8] border border-[#D1D1CF] p-2.5 flex items-start gap-2 text-[10px] text-[#1A1A1A] font-mono leading-relaxed shrink-0">
          <Info className="w-4 h-4 text-[#888884] shrink-0 mt-0.5" />
          <div>
            Upload or select existing files stored on Google&apos;s Gemini Files API.
            Files are active for <strong>48 hours</strong> and linked to your API key.
          </div>
        </div>

        {/* TAB 1: UPLOAD NEW FILE */}
        {activeTab === "upload" && (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            {error && (
              <div className="bg-red-50 border border-red-300 p-3 flex items-start gap-2 text-[10px] text-red-700 font-mono leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`min-h-[160px] border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  dragActive
                    ? "border-[#1A1A1A] bg-[#EAEAE8]"
                    : "border-[#D1D1CF] bg-white hover:border-[#1A1A1A]"
                }`}
                id="files-api-dropzone"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.mp4,.webm,.mov,.avi,.mkv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="files-api-input"
                />
                <CloudUpload className="w-8 h-8 text-[#888884]" />
                <span className="text-[11px] uppercase font-bold tracking-widest text-[#1A1A1A]">
                  Drop Video or Image Here
                </span>
                <span className="text-[9px] text-[#888884] font-mono uppercase tracking-tight text-center">
                  Supports MP4, WebM, MOV, JPEG, PNG, WebP (Max 2 GB)
                </span>
              </div>
            ) : (
              <div className="border border-[#D1D1CF] bg-[#F4F4F2] p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-9 h-9 bg-white border border-[#D1D1CF] flex items-center justify-center shrink-0">
                      {selectedFile.type.startsWith("video/") ? (
                        <Film className="w-5 h-5 text-amber-600" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold font-mono text-[#1A1A1A] truncate">
                        {selectedFile.name}
                      </span>
                      <span className="text-[9px] font-mono text-[#888884]">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || "Unknown Type"}
                      </span>
                    </div>
                  </div>
                  {!isUploading && (
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-[9px] font-mono text-red-600 hover:underline px-2 py-1 border border-red-200 bg-white"
                    >
                      Change File
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="files-api-label" className="text-[9px] font-mono uppercase text-[#888884] font-bold">
                    Reference Label (Map To Name):
                  </label>
                  <input
                    id="files-api-label"
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    disabled={isUploading}
                    placeholder="e.g. Main Character Clip"
                    className="text-xs font-bold bg-white border border-[#D1D1CF] px-2.5 py-1.5 outline-none focus:border-[#1A1A1A] text-[#1A1A1A]"
                  />
                </div>
              </div>
            )}

            {isUploading && (
              <div className="bg-amber-50 border border-amber-300 p-3 flex flex-col gap-2 text-xs font-mono text-amber-900">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-700" />
                    <span className="font-bold truncate">{uploadProgressStatus}</span>
                  </div>
                  <span className="font-bold shrink-0">{uploadProgressPercent}%</span>
                </div>
                <div className="w-full bg-amber-200 h-2 border border-amber-400 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D1D1CF]">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-xs font-bold uppercase tracking-wider text-[#1A1A1A] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="px-4 py-1.5 border border-[#1A1A1A] bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer hover:bg-black disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-3.5 h-3.5" />
                    Upload to Files API
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SELECT EXISTING FILES */}
        {activeTab === "existing" && (
          <div className="flex flex-col gap-3 overflow-hidden flex-1">
            {/* Toolbar: Search + Refresh */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#888884] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter existing uploaded files..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[#F4F4F2] border border-[#D1D1CF] outline-none focus:border-[#1A1A1A] text-[#1A1A1A]"
                />
              </div>
              <button
                type="button"
                onClick={fetchFilesList}
                disabled={isLoadingList}
                className="p-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[#1A1A1A] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 text-[10px] font-mono font-bold uppercase"
                title="Refresh files list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {listError && (
              <div className="bg-red-50 border border-red-300 p-2.5 flex items-start gap-2 text-[10px] text-red-700 font-mono shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{listError}</div>
              </div>
            )}

            {/* List Body */}
            <div className="overflow-y-auto flex-1 border border-[#D1D1CF] bg-[#F4F4F2] p-2 flex flex-col gap-2 min-h-[180px]">
              {isLoadingList ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-stone-500 font-mono text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]" />
                  <span>Fetching uploaded files from Gemini Files API...</span>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-stone-500 font-mono text-xs text-center">
                  <FileText className="w-8 h-8 text-stone-400" />
                  <span className="font-bold uppercase text-[#1A1A1A]">
                    {searchQuery ? "No matching files found" : "No active files on Gemini Files API"}
                  </span>
                  <span className="text-[10px] text-[#888884] max-w-xs">
                    {searchQuery
                      ? "Try adjusting your search filter keyword."
                      : "Files uploaded to the Gemini Files API expire after 48 hours. Switch to 'Upload New File' tab to upload media."}
                  </span>
                </div>
              ) : (
                filteredFiles.map((file) => {
                  const isSelected = selectedExistingFile?.name === file.name;
                  const isVid = (file.mimeType || "").startsWith("video/");
                  const isImg = (file.mimeType || "").startsWith("image/");
                  const isDeleting = deletingFile === file.name;

                  return (
                    <div
                      key={file.name}
                      onClick={() => handleSelectExistingFile(file)}
                      className={`p-2.5 border transition-all cursor-pointer flex flex-col gap-2 bg-white ${
                        isSelected
                          ? "border-[#1A1A1A] ring-1 ring-[#1A1A1A] shadow-xs"
                          : "border-[#D1D1CF] hover:border-[#1A1A1A]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-8 h-8 bg-[#EAEAE8] border border-[#D1D1CF] flex items-center justify-center shrink-0 mt-0.5">
                            {isVid ? (
                              <Film className="w-4 h-4 text-amber-600" />
                            ) : isImg ? (
                              <ImageIcon className="w-4 h-4 text-blue-600" />
                            ) : (
                              <FileText className="w-4 h-4 text-stone-600" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold font-mono text-[#1A1A1A] truncate">
                              {file.displayName || file.name}
                            </span>
                            <div className="flex items-center gap-2 text-[9px] font-mono text-[#888884] flex-wrap">
                              <span>{formatFileSize(file.sizeBytes)}</span>
                              <span>•</span>
                              <span>{file.mimeType || "media"}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-stone-600">
                                <Clock className="w-2.5 h-2.5" />
                                {formatExpiration(file.expirationTime)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge & Action Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[8px] font-mono font-bold px-1.5 py-0.5 border uppercase ${
                              file.state === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : file.state === "PROCESSING"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-red-100 text-red-800 border-red-300"
                            }`}
                          >
                            {file.state || "ACTIVE"}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFileToDeleteConfirm(fileToDeleteConfirm?.name === file.name ? null : file);
                            }}
                            disabled={isDeleting}
                            className={`p-1 border transition-all cursor-pointer disabled:opacity-50 ${
                              fileToDeleteConfirm?.name === file.name
                                ? "bg-red-600 text-white border-red-700"
                                : "border-red-200 hover:border-red-600 text-red-600 hover:bg-red-50"
                            }`}
                            title="Delete file from Gemini Files API"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3 h-3 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* In-Modal Delete Confirmation Banner */}
                      {fileToDeleteConfirm?.name === file.name && (
                        <div
                          className="bg-red-50 border border-red-300 p-2.5 flex flex-col gap-2 text-xs font-mono text-red-900 animate-fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>Delete &quot;{file.displayName || file.name}&quot; from Gemini Files API?</span>
                          </div>
                          <div className="text-[10px] text-red-700">
                            This permanently removes the file resource from Google Gemini API storage.
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-200">
                            <button
                              type="button"
                              onClick={() => setFileToDeleteConfirm(null)}
                              disabled={isDeleting}
                              className="px-2.5 py-1 bg-white border border-stone-300 hover:border-stone-800 text-[10px] font-bold uppercase text-stone-800 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => performDeleteFile(file)}
                              disabled={isDeleting}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase flex items-center gap-1 transition-all cursor-pointer"
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-3 h-3" />
                                  Confirm Delete
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* File URI & Quick Copy */}
                      <div className="flex items-center justify-between gap-2 bg-[#F4F4F2] border border-[#D1D1CF] px-2 py-1 text-[9px] font-mono text-[#888884]">
                        <span className="truncate max-w-[340px] text-stone-700" title={file.fileUri}>
                          {file.fileUri}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyUri(file.fileUri, e)}
                          className="flex items-center gap-1 text-[8px] font-bold uppercase text-[#1A1A1A] hover:underline shrink-0"
                          title="Copy File URI"
                        >
                          {copiedUri === file.fileUri ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              Copy URI
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Existing File Configuration */}
            {selectedExistingFile && (
              <div className="border border-[#1A1A1A] bg-amber-50/60 p-3 flex flex-col gap-2 shrink-0 animate-fade-in">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-amber-900">
                  <span>Selected File: {selectedExistingFile.displayName || selectedExistingFile.name}</span>
                  <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 border border-emerald-300">
                    READY TO ATTACH
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="files-api-existing-label" className="text-[9px] font-mono uppercase text-[#888884] font-bold">
                    Reference Label (Map To Name):
                  </label>
                  <input
                    id="files-api-existing-label"
                    type="text"
                    value={existingLabel}
                    onChange={(e) => setExistingLabel(e.target.value)}
                    placeholder="e.g. Existing Character Clip"
                    className="text-xs font-bold bg-white border border-[#D1D1CF] px-2.5 py-1.5 outline-none focus:border-[#1A1A1A] text-[#1A1A1A]"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#D1D1CF] shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-xs font-bold uppercase tracking-wider text-[#1A1A1A] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAttachExistingFile}
                disabled={!selectedExistingFile}
                className="px-4 py-1.5 border border-[#1A1A1A] bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer hover:bg-black disabled:opacity-50 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Attach File to Workspace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
