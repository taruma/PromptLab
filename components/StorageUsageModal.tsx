import React, { useEffect, useState } from "react";
import {
  HardDrive,
  RefreshCw,
  X,
  AlertTriangle,
  Database,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  getStorageEstimate,
  StorageInfo,
  formatBytes,
} from "../lib/storage-utils";

interface StorageUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory?: () => void;
}

export default function StorageUsageModal({
  isOpen,
  onClose,
  onClearHistory,
}: StorageUsageModalProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);

  const fetchStorageInfo = async (showRefreshing = true) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const info = await getStorageEstimate();
      setStorageInfo(info);
    } catch (err) {
      console.error("Failed to fetch storage info", err);
    } finally {
      if (showRefreshing) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (isOpen) {
      getStorageEstimate().then((info) => {
        if (!ignore) {
          setClearedNotice(null);
          setStorageInfo(info);
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const ls = storageInfo?.localStorage;
  const idb = storageInfo?.indexedDb;

  const getPercentageColor = (pct: number) => {
    if (pct >= 90) return "bg-rose-500 text-rose-500 border-rose-600";
    if (pct >= 75) return "bg-amber-500 text-amber-500 border-amber-600";
    return "bg-emerald-500 text-emerald-500 border-emerald-600";
  };

  const getPercentageBadgeClass = (pct: number) => {
    if (pct >= 90) return "bg-rose-100 text-rose-800 border-rose-300";
    if (pct >= 75) return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  };

  return (
    <div
      className="fixed inset-0 bg-[#1A1A1A]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      id="storage-usage-modal"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#D1D1CF] w-full max-w-2xl max-h-[90vh] flex flex-col justify-between shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#D1D1CF] bg-[#F4F4F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1A1A1A] text-white flex items-center justify-center font-bold">
              <HardDrive className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black tracking-tight uppercase text-[#1A1A1A] flex items-center gap-2">
                Storage & Quota Monitor
              </h2>
              <p className="text-[10px] font-mono text-[#888884] uppercase tracking-wider">
                Browser LocalStorage & IndexedDB Diagnostics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStorageInfo()}
              disabled={isRefreshing}
              className="p-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#F4F4F2] transition-all cursor-pointer font-mono text-[10px] flex items-center gap-1"
              title="Refresh Storage Usage"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-600" : "text-[#888884]"}`}
              />
              <span className="hidden sm:inline uppercase font-bold">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 border border-[#D1D1CF] hover:border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#F4F4F2] transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4 text-[#888884]" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 text-xs">
          {clearedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 font-mono text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{clearedNotice}</span>
            </div>
          )}

          {/* Section 1: LocalStorage Usage */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                  LocalStorage (Fast Key-Value Cache)
                </span>
                {ls && (
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 border ${getPercentageBadgeClass(
                      ls.percentage
                    )}`}
                  >
                    {ls.percentage}% USED
                  </span>
                )}
              </div>
              {ls && (
                <span className="font-mono text-[11px] font-bold text-[#888884]">
                  {ls.formattedUsed} / {ls.formattedMax}
                </span>
              )}
            </div>

            {/* LocalStorage Progress Bar */}
            {ls && (
              <div className="w-full bg-[#EAEAE8] border border-[#D1D1CF] h-3 p-0.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    getPercentageColor(ls.percentage).split(" ")[0]
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, ls.percentage))}%` }}
                />
              </div>
            )}

            {/* Warning when LocalStorage is high */}
            {ls && ls.percentage >= 75 && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 font-mono text-[10px] leading-relaxed flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase">
                    LocalStorage High Quota Warning ({ls.percentage}%)
                  </p>
                  <p className="mt-0.5 text-amber-800">
                    Browsers enforce a strict 5 MB limit on LocalStorage. Generating long outputs or accumulating history can trigger a <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">QuotaExceededError</code>.
                  </p>
                </div>
              </div>
            )}

            {/* LocalStorage Keys Breakdown */}
            <div className="border border-[#D1D1CF] bg-[#F4F4F2]">
              <div className="px-3 py-2 border-b border-[#D1D1CF] bg-[#EAEAE8] text-[10px] font-mono font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center justify-between">
                <span>Stored Keys Breakdown</span>
                <span>Size</span>
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar divide-y divide-[#D1D1CF]">
                {ls && ls.items.length > 0 ? (
                  ls.items.map((item) => (
                    <div
                      key={item.key}
                      className="px-3 py-1.5 flex items-center justify-between font-mono text-[11px] hover:bg-white transition-colors"
                    >
                      <span className="truncate max-w-[320px] font-bold text-[#1A1A1A]" title={item.key}>
                        {item.key}
                      </span>
                      <span className="text-[#888884] font-semibold shrink-0 ml-2">
                        {item.formatted}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-[10px] font-mono text-[#888884] italic">
                    LocalStorage is currently empty.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: IndexedDB / Persistent Storage */}
          <div className="flex flex-col gap-3 pt-2 border-t border-[#D1D1CF]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                  IndexedDB (<code className="bg-[#EAEAE8] px-1 py-0.5 border border-[#D1D1CF]">promptlab_db</code>)
                </span>
              </div>
              {idb && (
                <span className="font-mono text-[11px] font-bold text-[#888884]">
                  {idb.formattedUsed} Used {idb.quotaBytes > 0 ? `/ ${idb.formattedQuota} Quota` : ""}
                </span>
              )}
            </div>

            {idb && idb.quotaBytes > 0 && (
              <div className="w-full bg-[#EAEAE8] border border-[#D1D1CF] h-3 p-0.5">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.max(1, Math.min(100, idb.percentage))}%` }}
                />
              </div>
            )}

            <div className="p-3 bg-indigo-50/70 border border-indigo-200 text-indigo-950 font-mono text-[10px] leading-relaxed">
              <p className="font-bold uppercase flex items-center gap-1.5 text-indigo-900">
                <span>High-Capacity Storage Store</span>
              </p>
              <p className="mt-1 text-indigo-800">
                PromptLab stores binary images, asset libraries, and multi-workspace project files inside IndexedDB. IndexedDB provides gigabytes of persistent quota and prevents browser crashes.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#D1D1CF] bg-[#F4F4F2] flex items-center justify-between flex-wrap gap-2">
          {onClearHistory && ls && ls.percentage >= 50 ? (
            <button
              type="button"
              onClick={() => {
                onClearHistory();
                setClearedNotice("History clear action triggered.");
                setTimeout(() => fetchStorageInfo(), 200);
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear Session History</span>
            </button>
          ) : (
            <div className="text-[10px] font-mono text-[#888884] uppercase">
              System Health: OK
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
