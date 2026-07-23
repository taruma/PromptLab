"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, AlertTriangle, Layers, RefreshCw, CheckCircle2 } from "lucide-react";
import {
  AssetExportItem,
  readAndValidateAssetLibraryJSON,
} from "../lib/asset-library-export";

interface AssetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  existingCount: number;
  onConfirmImport: (
    mode: "merge" | "overwrite",
    assets: AssetExportItem[]
  ) => Promise<void>;
}

export default function AssetImportModal({
  isOpen,
  onClose,
  file,
  existingCount,
  onConfirmImport,
}: AssetImportModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedAssets, setParsedAssets] = useState<AssetExportItem[]>([]);
  const [exportDate, setExportDate] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "overwrite">("merge");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/50 backdrop-blur-xs"
      id="asset-import-modal-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#F4F4F2] border border-[#D1D1CF] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        id="asset-import-modal-panel"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#D1D1CF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#EAEAE8] border border-[#D1D1CF] flex items-center justify-center">
              <Upload className="w-4 h-4 text-[#1A1A1A]" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1A1A]">
                Import Asset Library
              </h3>
              <p className="text-[9px] font-mono text-[#888884] uppercase tracking-wider">
                {file ? file.name : "JSON File"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-[#F4F4F2] text-[#888884] hover:text-[#1A1A1A] transition-all cursor-pointer"
            id="close-import-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#888884]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#1A1A1A]" />
              <span className="font-mono text-[10px] uppercase tracking-wider">
                Reading & Validating JSON Package...
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px]">Import Error</p>
                <p className="text-[11px] mt-1 leading-relaxed font-sans">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && parsedAssets.length > 0 && (
            <>
              {/* Summary Banner */}
              <div className="p-3 bg-white border border-[#D1D1CF] flex items-center justify-between font-mono text-[10px]">
                <div>
                  <span className="text-[#888884] uppercase tracking-wider">Assets Found: </span>
                  <span className="font-bold text-[#1A1A1A]">{parsedAssets.length} Visual Assets</span>
                </div>
                {exportDate && (
                  <span className="text-[8px] text-[#888884]">
                    Exported: {new Date(exportDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Asset Preview Thumbnails Grid */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-mono text-[#888884] uppercase tracking-wider">
                  Asset Package Preview ({Math.min(8, parsedAssets.length)} of {parsedAssets.length})
                </span>
                <div className="grid grid-cols-4 gap-2 bg-white p-2 border border-[#D1D1CF]">
                  {parsedAssets.slice(0, 8).map((asset, idx) => (
                    <div
                      key={asset.id || idx}
                      className="aspect-square bg-[#EAEAE8] border border-[#D1D1CF] relative overflow-hidden group"
                      title={asset.label}
                    >
                      <img
                        src={asset.base64}
                        alt={asset.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-[#1A1A1A]/80 text-white text-[7px] font-mono px-1 py-0.5 truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {asset.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Mode Options */}
              <div className="flex flex-col gap-2 mt-1">
                <span className="text-[9px] font-mono text-[#888884] uppercase tracking-wider">
                  Select Import Strategy
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode("merge")}
                    className={`p-3 border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      importMode === "merge"
                        ? "bg-white border-[#1A1A1A] ring-1 ring-[#1A1A1A]"
                        : "bg-[#F4F4F2] border-[#D1D1CF] hover:border-[#888884]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-[#1A1A1A]">
                        Merge
                      </span>
                      {importMode === "merge" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[9px] text-[#888884] leading-tight">
                      Append assets to current library ({existingCount} existing items retained).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode("overwrite")}
                    className={`p-3 border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      importMode === "overwrite"
                        ? "bg-amber-50 border-amber-600 ring-1 ring-amber-600"
                        : "bg-[#F4F4F2] border-[#D1D1CF] hover:border-[#888884]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-amber-800">
                        Overwrite
                      </span>
                      {importMode === "overwrite" && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      )}
                    </div>
                    <p className="text-[9px] text-amber-700 leading-tight">
                      Replace all current library assets with the imported assets.
                    </p>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-[#D1D1CF] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-[#F4F4F2] text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !!error || parsedAssets.length === 0 || isSubmitting}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white border border-[#1A1A1A] text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-white" />
                <span>Importing...</span>
              </>
            ) : (
              <span>Confirm Import ({parsedAssets.length})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
