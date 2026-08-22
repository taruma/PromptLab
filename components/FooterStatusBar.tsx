import React, { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";
import { getStorageEstimate, StorageInfo } from "../lib/storage-utils";
import pkg from "../package.json";

interface FooterStatusBarProps {
  selectedModel: string;
  thinkingLevel: string;
  temperature: number;
  activeApiKeyLabel: string;
  isStructuredOutput?: boolean;
  onOpenStorageModal?: () => void;
}

export default function FooterStatusBar({
  selectedModel,
  thinkingLevel,
  temperature,
  activeApiKeyLabel,
  isStructuredOutput,
  onOpenStorageModal,
}: FooterStatusBarProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkStorage = async () => {
      try {
        const info = await getStorageEstimate();
        if (isMounted) {
          setStorageInfo(info);
        }
      } catch (err) {
        console.warn("Error estimating storage", err);
      }
    };

    checkStorage();
    const interval = setInterval(checkStorage, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const ls = storageInfo?.localStorage;
  const idb = storageInfo?.indexedDb;

  const isStorageHigh = ls && ls.percentage >= 80;

  return (
    <footer className="h-10 px-4 md:px-10 bg-[#1A1A1A] text-white flex items-center justify-between text-[9px] font-mono shrink-0">
      <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-1 uppercase">
        <span>Engine: {selectedModel.toUpperCase()}</span>
        <span>Reasoning: {thinkingLevel}</span>
        <span>Temp: {temperature.toFixed(1)}</span>
        <span>Key: {activeApiKeyLabel.toUpperCase()}</span>
        {isStructuredOutput && (
          <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-500/50 px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            JSON OUTPUT
          </span>
        )}

        {/* Interactive Storage Usage Indicator */}
        {onOpenStorageModal && (
          <button
            type="button"
            onClick={onOpenStorageModal}
            className={`flex items-center gap-1.5 px-2 py-0.5 border transition-all cursor-pointer font-bold ${
              isStorageHigh
                ? "bg-rose-950 text-rose-300 border-rose-600 animate-pulse"
                : "bg-[#2A2A2A] hover:bg-[#3A3A3A] text-emerald-400 border-[#444] hover:border-emerald-500"
            }`}
            title="Click to view LocalStorage & IndexedDB usage details"
            id="footer-storage-indicator-btn"
          >
            <HardDrive className={`w-3 h-3 ${isStorageHigh ? "text-rose-400" : "text-emerald-400"}`} />
            <span>
              Storage: {ls ? `${ls.formattedUsed} (${ls.percentage}%)` : "Checking..."}
            </span>
          </button>
        )}
      </div>
      <div className="uppercase opacity-50 tracking-wider hidden sm:block">
        PromptLab v{pkg.version} by Taruma Sakti
      </div>
    </footer>
  );
}

