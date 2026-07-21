"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Search, 
  Trash2, 
  Plus, 
  Upload, 
  Check, 
  FolderOpen,
  LayoutGrid,
  List,
  ArrowUpDown
} from "lucide-react";

import {
  getStoredImage,
  saveStoredImage,
  deleteStoredImage
} from "../lib/indexeddb";

interface LibraryImage {
  id: string;
  label: string;
  base64: string;
  mimeType: string;
  createdAt?: number;
}

interface AssetLibrarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddImageToWorkspace: (label: string, base64: string) => void;
}
export default function AssetLibrarySidebar({ isOpen, onClose, onAddImageToWorkspace }: AssetLibrarySidebarProps) {
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [addedFeedbackIds, setAddedFeedbackIds] = useState<Record<string, boolean>>({});
  
  // Persistent view and sorting preference
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("prompt_generator_library_view_mode");
      if (saved === "grid" || saved === "list") return saved;
    }
    return "grid";
  });
  
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az" | "za">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("prompt_generator_library_sort_by");
      if (saved === "newest" || saved === "oldest" || saved === "az" || saved === "za") return saved;
    }
    return "newest";
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load library on mount
  useEffect(() => {
    async function loadLibrary() {
      try {
        const savedMetadata = localStorage.getItem("prompt_generator_library_images");
        if (savedMetadata) {
          const parsed = JSON.parse(savedMetadata) as Omit<LibraryImage, "base64">[];
          const resolved = await Promise.all(
            parsed.map(async (img) => {
              try {
                const base64 = await getStoredImage(img.id);
                return { ...img, base64: base64 || "" };
              } catch (err) {
                console.error(`Failed to load library image ${img.id} from IndexedDB:`, err);
                return { ...img, base64: "" };
              }
            })
          );
          setLibraryImages(resolved.filter(img => img.base64 !== ""));
        }
      } catch (err) {
        console.error("Failed to load asset library", err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadLibrary();
  }, []);

  // Save library metadata to local storage when library state changes
  useEffect(() => {
    if (isLoaded) {
      const stripped = libraryImages.map(({ base64, ...rest }) => rest);
      localStorage.setItem("prompt_generator_library_images", JSON.stringify(stripped));
    }
  }, [libraryImages, isLoaded]);

  // Save viewMode & sortBy preferences on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("prompt_generator_library_view_mode", viewMode);
    }
  }, [viewMode, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("prompt_generator_library_sort_by", sortBy);
    }
  }, [sortBy, isLoaded]);

  // Compress image to JPEG (quality = 0.9) via Canvas - handles transparent PNGs
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const rawBase64 = reader.result as string;
        
        if (file.size < 40960 && (file.type === "image/jpeg" || file.type === "image/png")) {
          resolve(rawBase64);
          return;
        }

        const img = new Image();
        img.src = rawBase64;
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const width = img.naturalWidth || img.width || 800;
            const height = img.naturalHeight || img.height || 600;
            
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(rawBase64);
              return;
            }

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            const compressed = canvas.toDataURL("image/jpeg", 0.9);
            resolve(compressed);
          } catch (err) {
            console.warn("Library image compression failed:", err);
            resolve(rawBase64);
          }
        };
        img.onerror = () => resolve(rawBase64);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleLibraryFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    const newLibraryItems: LibraryImage[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const base64 = await compressImage(file);
        const rawName = file.name.split(".")[0];
        const cleanLabel = rawName
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, c => c.toUpperCase());

        const libraryImgId = `lib-img-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;
        
        await saveStoredImage(libraryImgId, base64);

        newLibraryItems.push({
          id: libraryImgId,
          label: cleanLabel,
          base64: base64,
          mimeType: "image/jpeg",
          createdAt: Date.now(),
        });
      } catch (err) {
        console.error("Failed to add image to library:", file.name, err);
      }
    }

    setLibraryImages(prev => [...newLibraryItems, ...prev]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleLibraryFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleLibraryFiles(e.target.files);
    }
  };

  const handleUpdateLabel = (id: string, newLabel: string) => {
    setLibraryImages(prev =>
      prev.map(img => img.id === id ? { ...img, label: newLabel } : img)
    );
  };

  const handleDeleteLibraryItem = async (id: string) => {
    setLibraryImages(prev => prev.filter(img => img.id !== id));
    try {
      await deleteStoredImage(id);
    } catch (err) {
      console.error("Failed to delete library image from IndexedDB:", err);
    }
  };

  const handleAddToWorkspace = (img: LibraryImage) => {
    onAddImageToWorkspace(img.label, img.base64);
    
    // Trigger localized success feedback animation
    setAddedFeedbackIds(prev => ({ ...prev, [img.id]: true }));
    setTimeout(() => {
      setAddedFeedbackIds(prev => ({ ...prev, [img.id]: false }));
    }, 1500);
  };

  // Filter and sort items dynamically
  const getSortedAndFilteredImages = () => {
    const filtered = libraryImages.filter(img =>
      img.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === "az") {
        return a.label.localeCompare(b.label);
      }
      if (sortBy === "za") {
        return b.label.localeCompare(a.label);
      }

      const getTimestamp = (img: LibraryImage) => {
        if (img.createdAt) return img.createdAt;
        const match = img.id.match(/lib-img-(\d+)/);
        if (match && match[1]) {
          return parseInt(match[1], 10);
        }
        return 0;
      };

      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);

      if (sortBy === "newest") {
        return timeB - timeA;
      }
      if (sortBy === "oldest") {
        return timeA - timeB;
      }
      return 0;
    });
  };

  const sortedAndFilteredImages = getSortedAndFilteredImages();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex" 
      id="asset-library-overlay"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark backdrop clickable */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-xs transition-opacity"
        id="asset-library-backdrop"
      />

      {/* Sidebar Panel */}
      <div 
        className="relative w-full max-w-md bg-[#F4F4F2] border-r border-[#D1D1CF] h-full flex flex-col shadow-2xl z-10 transition-transform duration-300 transform translate-x-0"
        id="asset-library-panel"
      >
        {/* Header */}
        <div className="h-20 border-b border-[#D1D1CF] bg-white px-6 flex items-center justify-between shrink-0" id="asset-library-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#EAEAE8] border border-[#D1D1CF] flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-[#1A1A1A]" />
            </div>
            <div>
              <h2 className="text-xs uppercase font-black tracking-widest text-[#1A1A1A]">Asset Library</h2>
              <p className="text-[9px] text-[#888884] font-mono uppercase tracking-wider">Casting & Reference Bank</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-[#F4F4F2] text-[#888884] hover:text-[#1A1A1A] transition-all cursor-pointer"
            title="Close Library"
            id="close-library-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search and Upload Section */}
        <div className="p-6 bg-white border-b border-[#D1D1CF] flex flex-col gap-4 shrink-0" id="asset-library-actions">
          {/* Brutalist Drag and Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed flex flex-col items-center justify-center p-5 gap-1.5 cursor-pointer transition-all ${
              dragActive 
                ? "border-[#1A1A1A] bg-[#EAEAE8]" 
                : "border-[#D1D1CF] bg-[#F4F4F2]/50 hover:border-[#1A1A1A] hover:bg-[#F4F4F2]"
            }`}
            id="library-upload-dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="library-file-uploader"
            />
            <Upload className="w-4 h-4 text-[#888884]" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]">Upload reference to library</span>
            <span className="text-[8px] text-[#888884] font-mono uppercase tracking-tight">Drag images / Click to select</span>
          </div>

          {/* Search Bar */}
          <div className="relative" id="library-search-wrapper">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-3.5 h-3.5 text-[#888884]" />
            </span>
            <input
              type="text"
              placeholder="Search library assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F4F4F2]/60 border border-[#D1D1CF] pl-9 pr-4 py-2.5 text-xs outline-none focus:border-[#1A1A1A] focus:bg-white transition-all text-[#1A1A1A]"
              id="library-search-input"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#888884] hover:text-[#1A1A1A]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode & Sorter Controls Row */}
          <div className="flex items-center justify-between gap-4 mt-1" id="library-controls-row">
            {/* Left: View Mode Toggles */}
            <div className="flex items-center border border-[#D1D1CF]" id="library-view-toggles">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-all cursor-pointer ${
                  viewMode === "grid" 
                    ? "bg-[#1A1A1A] text-white" 
                    : "bg-[#F4F4F2] text-[#888884] hover:text-[#1A1A1A] hover:bg-[#EAEAE8]"
                }`}
                title="Grid View"
                id="view-grid-btn"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 border-l border-[#D1D1CF] transition-all cursor-pointer ${
                  viewMode === "list" 
                    ? "bg-[#1A1A1A] text-white" 
                    : "bg-[#F4F4F2] text-[#888884] hover:text-[#1A1A1A] hover:bg-[#EAEAE8]"
                }`}
                title="Compact List View"
                id="view-list-btn"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right: Sort By Dropdown */}
            <div className="flex items-center gap-1.5" id="library-sort-wrapper">
              <span className="text-[9px] font-mono text-[#888884] uppercase tracking-wider flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-[#888884]" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#F4F4F2] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[9px] uppercase font-bold tracking-wider py-1.5 px-2 outline-none font-mono cursor-pointer transition-all text-[#1A1A1A]"
                id="library-sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">Name (A-Z)</option>
                <option value="za">Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Assets List */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4" id="asset-library-scroller">
          {sortedAndFilteredImages.length === 0 ? (
            <div className="text-center py-10 px-4 border border-[#D1D1CF] border-dashed bg-white/40" id="library-empty-state">
              <FolderOpen className="w-8 h-8 text-[#888884] mx-auto mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">No assets found</p>
              <p className="text-[10px] text-[#888884] leading-relaxed mt-1">
                {searchQuery 
                  ? "Try searching for a different name or keyword" 
                  : "Upload visual references above to build your private reusable casting bank!"
                }
              </p>
            </div>
          ) : (
            <>
               {viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-4" id="library-assets-grid">
                  {sortedAndFilteredImages.map((img) => {
                    const isAdded = addedFeedbackIds[img.id];
                    return (
                      <div 
                        key={img.id}
                        className="bg-white border border-[#D1D1CF] p-3 flex flex-col gap-2.5 group relative hover:border-[#1A1A1A] transition-all"
                        id={`lib-card-${img.id}`}
                      >
                        {/* Thumbnail box */}
                        <div className="aspect-square bg-[#EAEAE8] relative overflow-hidden flex items-center justify-center">
                          <img 
                            src={img.base64} 
                            alt={img.label}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Delete item */}
                          <button
                            onClick={() => handleDeleteLibraryItem(img.id)}
                            className="absolute top-1 right-1 bg-white border border-[#D1D1CF] hover:border-red-600 hover:text-red-600 text-stone-500 p-1.2 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete from library"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Centered ID Caption */}
                        <div className="text-center font-mono text-[7px] text-[#888884] select-all tracking-tighter leading-tight break-all">
                          ID: {img.id}
                        </div>

                        {/* Inline Label editing */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] font-mono text-[#888884] uppercase tracking-wider">Asset Label:</span>
                          <input
                            type="text"
                            value={img.label}
                            onChange={(e) => handleUpdateLabel(img.id, e.target.value)}
                            placeholder="Name or description"
                            className="text-[11px] font-bold bg-transparent border-b border-transparent hover:border-[#D1D1CF] focus:border-[#1A1A1A] outline-none text-[#1A1A1A] focus:text-stone-900 transition-colors w-full pb-0.5 font-sans"
                            id={`lib-input-${img.id}`}
                          />
                        </div>

                        {/* Trigger Button: Add to Workspace */}
                        <button
                          onClick={() => handleAddToWorkspace(img)}
                          className={`w-full py-1.5 border text-[9px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1 cursor-pointer mt-1 ${
                            isAdded
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-white border-[#D1D1CF] text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#F4F4F2]"
                          }`}
                          id={`lib-add-btn-${img.id}`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" />
                              Added!
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3 text-[#888884]" />
                              Use in Workspace
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5" id="library-assets-list">
                  {sortedAndFilteredImages.map((img) => {
                    const isAdded = addedFeedbackIds[img.id];
                    return (
                      <div 
                        key={img.id}
                        className="bg-white border border-[#D1D1CF] p-2 flex items-center justify-between gap-3 group hover:border-[#1A1A1A] transition-all"
                        id={`lib-row-${img.id}`}
                      >
                        {/* Left: Thumbnail & Input */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {/* Thumbnail */}
                          <div className="w-10 h-10 bg-[#EAEAE8] border border-[#D1D1CF] shrink-0 overflow-hidden flex items-center justify-center relative">
                            <img 
                              src={img.base64} 
                              alt={img.label}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Label input */}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={img.label}
                              onChange={(e) => handleUpdateLabel(img.id, e.target.value)}
                              placeholder="Name or description"
                              className="text-[11px] font-bold bg-transparent border-b border-transparent hover:border-[#D1D1CF] focus:border-[#1A1A1A] outline-none text-[#1A1A1A] focus:text-stone-900 transition-colors w-full py-0.5 px-1 font-sans"
                              id={`lib-row-input-${img.id}`}
                            />
                          </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Use Button */}
                          <button
                            onClick={() => handleAddToWorkspace(img)}
                            className={`px-2.5 py-1.5 border text-[9px] uppercase tracking-wider font-bold transition-all flex items-center gap-1 cursor-pointer h-8 ${
                              isAdded
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "bg-white border-[#D1D1CF] text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#F4F4F2]"
                            }`}
                            title="Add to current workspace"
                            id={`lib-row-add-btn-${img.id}`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3 h-3 shrink-0" />
                                <span className="hidden sm:inline">Added!</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3 text-[#888884] shrink-0" />
                                <span>Use</span>
                              </>
                            )}
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteLibraryItem(img.id)}
                            className="p-1.5 border border-[#D1D1CF] hover:border-red-600 hover:text-red-600 hover:bg-stone-50 text-stone-500 transition-all cursor-pointer h-8 flex items-center justify-center opacity-60 group-hover:opacity-100 focus:opacity-100"
                            title="Delete from library"
                            id={`lib-row-del-btn-${img.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-4 bg-[#EAEAE8] border-t border-[#D1D1CF] text-center text-[9px] font-mono uppercase tracking-wider text-[#888884]" id="library-footer">
          Stored Locally via IndexedDB & localStorage
        </div>
      </div>
    </div>
  );
}
