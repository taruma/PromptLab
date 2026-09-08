"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Upload,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  Check,
  Copy,
  Layers,
  Sparkles
} from "lucide-react";
import {
  AssetExportItem,
  readAndValidateAssetLibraryJSON,
} from "../lib/asset-library-export";
import { computeContentHash } from "../lib/content-hash";
import { useModalEscape } from "../hooks/use-modal-stack";

interface AssetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  existingAssets?: AssetExportItem[];
  existingCount?: number;
  onConfirmImport: (
    mode: "merge" | "overwrite",
    assets: AssetExportItem[]
  ) => Promise<void>;
}

export default function AssetImportModal({
  isOpen,
  onClose,
  file,
  existingAssets = [],
  existingCount = 0,
  onConfirmImport,
}: AssetImportModalProps) {
  // Register with global LIFO modal escape stack
  useModalEscape(isOpen, onClose);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedAssets, setParsedAssets] = useState<AssetExportItem[]>([]);
  const [exportDate, setExportDate] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "overwrite">("merge");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Pre-resolve existing hashes asynchronously if any existing assets are missing contentHash
  const [existingHashSet, setExistingHashSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    async function resolveExistingHashes() {
      if (!existingAssets || existingAssets.length === 0) {
        setExistingHashSet(new Set());
        return;
      }

      const hashes = new Set<string>();
      for (const a of existingAssets) {
        if (a.contentHash) {
          hashes.add(a.contentHash);
        } else if (a.base64) {
          try {
            const h = await computeContentHash(a.base64);
            if (h) hashes.add(h);
          } catch (err) {
            console.warn("Failed to hash existing asset:", err);
          }
        }
      }
      if (active) {
        setExistingHashSet(hashes);
      }
    }

    resolveExistingHashes();
    return () => {
      active = false;
    };
  }, [existingAssets]);

  useEffect(() => {
    let active = true;

    if (!isOpen || !file) {
      return;
    }

    const parseFile = async () => {
      setLoading(true);
      setError(null);
      setParsedAssets([]);
      setExportDate(null);

      try {
        const result = await readAndValidateAssetLibraryJSON(file);
        if (!active) return;
        if (result.success && result.data) {
          setParsedAssets(result.data.assets);
          setExportDate(result.data.exportDate);
        } else {
          setError(result.error || "Failed to parse asset library file.");
        }
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "An unexpected error occurred while reading the file.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    parseFile();

    return () => {
      active = false;
    };
  }, [isOpen, file]);

  // Compute duplicate assets in real time based on contentHash OR matching ID
  const duplicateIndices = useMemo(() => {
    if (!existingAssets || existingAssets.length === 0 || parsedAssets.length === 0) {
      return new Set<number>();
    }

    const existingIdSet = new Set(existingAssets.map((a) => a.id).filter(Boolean));

    const duplicates = new Set<number>();
    parsedAssets.forEach((asset, idx) => {
      const matchesHash = Boolean(asset.contentHash && existingHashSet.has(asset.contentHash));
      const matchesId = Boolean(asset.id && existingIdSet.has(asset.id));
      if (matchesHash || matchesId) {
        duplicates.add(idx);
      }
    });

    return duplicates;
  }, [existingAssets, parsedAssets, existingHashSet]);

  const duplicateCount = duplicateIndices.size;
  const newCount = parsedAssets.length - duplicateCount;
  const effectiveCount = existingCount || existingAssets.length;

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (parsedAssets.length === 0) return;
    setIsSubmitting(true);
    try {
      await onConfirmImport(importMode, parsedAssets);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to complete asset import.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/50 backdrop-blur-xs animate-fade-in"
      id="asset-import-modal-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#F4F4F2] border border-[#D1D1CF] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-none"
        id="asset-import-modal-panel"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#D1D1CF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black uppercase tracking-widest font-sans text-[#1A1A1A] truncate">
                Import Asset Library
              </h3>
              <p className="text-[9px] font-mono text-[#888884] uppercase tracking-wider truncate">
                {file ? file.name : "JSON Backup Package"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-[#F4F4F2] text-[#888884] hover:text-[#1A1A1A] transition-all cursor-pointer rounded-none shrink-0"
            title="Close (Escape)"
            id="close-import-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {loading && (
            <div className="py-14 flex flex-col items-center justify-center gap-3 text-[#888884]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#1A1A1A]" />
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
                Validating & Resolving Asset Package...
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 rounded-none animate-fade-in">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-mono font-bold uppercase tracking-wider text-[10px]">Import Error</p>
                <p className="text-[11px] mt-1 leading-relaxed font-sans">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && parsedAssets.length > 0 && (
            <>
              {/* Summary Breakdown Metrics */}
              <div className="grid grid-cols-3 gap-2 bg-white p-3 border border-[#D1D1CF] font-mono text-center">
                <div className="flex flex-col items-center justify-center border-r border-[#D1D1CF]/50 pr-2">
                  <span className="text-[8px] text-[#888884] uppercase tracking-wider">Total In File</span>
                  <span className="text-sm font-bold text-[#1A1A1A] mt-0.5">{parsedAssets.length}</span>
                </div>
                <div className="flex flex-col items-center justify-center border-r border-[#D1D1CF]/50 px-2">
                  <span className="text-[8px] text-emerald-700 uppercase tracking-wider font-bold">New Unique</span>
                  <span className="text-sm font-bold text-emerald-600 mt-0.5">+{newCount}</span>
                </div>
                <div className="flex flex-col items-center justify-center pl-2">
                  <span className="text-[8px] text-[#888884] uppercase tracking-wider">Already Exists</span>
                  <span className={`text-sm font-bold mt-0.5 ${duplicateCount > 0 ? "text-amber-600" : "text-[#888884]"}`}>
                    {duplicateCount}
                  </span>
                </div>
              </div>

              {/* Asset Package Preview Grid */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[#888884]">
                  <span>Package Thumbnails ({parsedAssets.length})</span>
                  {exportDate && (
                    <span>Exported: {new Date(exportDate).toLocaleDateString()}</span>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 bg-white p-2.5 border border-[#D1D1CF] max-h-52 overflow-y-auto">
                  {parsedAssets.map((asset, idx) => {
                    const isDuplicate = duplicateIndices.has(idx);
                    return (
                      <div
                        key={asset.id || idx}
                        className="aspect-square bg-[#EAEAE8] border border-[#D1D1CF] relative overflow-hidden group shadow-2xs"
                        title={`${asset.label}${isDuplicate ? " (Already in library)" : " (New asset)"}`}
                      >
                        {asset.base64 && asset.base64.trim().length > 0 ? (
                          <img
                            src={asset.base64}
                            alt={asset.label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#EAEAE8]">
                            <ImageIcon className="w-5 h-5 text-stone-400" />
                          </div>
                        )}

                        {/* Status badge: NEW vs EXISTS */}
                        <div className="absolute top-1 right-1">
                          {isDuplicate ? (
                            <span className="px-1 py-0.2 bg-[#1A1A1A]/85 text-amber-300 border border-amber-500/50 text-[6.5px] font-mono uppercase font-bold tracking-tight">
                              EXISTS
                            </span>
                          ) : (
                            <span className="px-1 py-0.2 bg-emerald-700/90 text-white border border-emerald-500 text-[6.5px] font-mono uppercase font-bold tracking-tight">
                              NEW
                            </span>
                          )}
                        </div>

                        {/* Hover label overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-[#1A1A1A]/90 text-white text-[7px] font-mono px-1 py-0.5 truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {asset.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Import Strategy Selection */}
              <div className="flex flex-col gap-2 mt-0.5">
                <span className="text-[9px] font-mono text-[#888884] uppercase tracking-wider font-bold">
                  Select Import Strategy
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Merge Option */}
                  <button
                    type="button"
                    onClick={() => setImportMode("merge")}
                    className={`p-3 border text-left flex flex-col gap-1.5 transition-all cursor-pointer rounded-none ${
                      importMode === "merge"
                        ? "bg-white border-[#1A1A1A] ring-1 ring-[#1A1A1A] shadow-xs"
                        : "bg-[#F4F4F2] border-[#D1D1CF] hover:border-[#888884]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-[#1A1A1A]">
                          Merge
                        </span>
                        <span className="text-[8px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2">
                          +{newCount}
                        </span>
                      </div>
                      {importMode === "merge" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[9px] text-[#888884] leading-relaxed font-sans">
                      Append <strong className="text-[#1A1A1A]">{newCount} new</strong> assets.{" "}
                      {duplicateCount > 0 ? `${duplicateCount} duplicates will be skipped.` : "Retains all existing items."}
                    </p>
                  </button>

                  {/* Overwrite Option */}
                  <button
                    type="button"
                    onClick={() => setImportMode("overwrite")}
                    className={`p-3 border text-left flex flex-col gap-1.5 transition-all cursor-pointer rounded-none ${
                      importMode === "overwrite"
                        ? "bg-amber-50/60 border-amber-600 ring-1 ring-amber-600 shadow-xs"
                        : "bg-[#F4F4F2] border-[#D1D1CF] hover:border-[#888884]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-amber-900">
                          Overwrite
                        </span>
                        <span className="text-[8px] font-mono text-amber-700 bg-amber-100 border border-amber-300 px-1 py-0.2">
                          {parsedAssets.length}
                        </span>
                      </div>
                      {importMode === "overwrite" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[9px] text-amber-800 leading-relaxed font-sans">
                      Replace all current library assets ({effectiveCount} existing) with the {parsedAssets.length} imported assets.
                    </p>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-[#D1D1CF] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[9px] font-mono text-[#888884] truncate">
            {importMode === "merge" && newCount === 0 && !loading && !error && parsedAssets.length > 0 ? (
              <span className="text-amber-600 font-bold uppercase">All assets already in library</span>
            ) : (
              <span>ESC to cancel</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-[#F4F4F2] text-[9px] font-mono uppercase font-bold tracking-wider text-[#1A1A1A] transition-all cursor-pointer disabled:opacity-50 rounded-none"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={
                loading ||
                !!error ||
                parsedAssets.length === 0 ||
                isSubmitting ||
                (importMode === "merge" && newCount === 0)
              }
              className="px-3.5 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white border border-[#1A1A1A] text-[9px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 rounded-none shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-white" />
                  <span>Importing Assets...</span>
                </>
              ) : (
                <span>
                  {importMode === "merge"
                    ? `Confirm Import (${newCount} New)`
                    : `Overwrite All (${parsedAssets.length})`}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
