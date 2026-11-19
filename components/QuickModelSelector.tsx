"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Settings, Braces } from "lucide-react";
import {
  ALL_THINKING_LEVELS,
  getBriefModelLabel,
  getCanonicalModelId,
  isThinkingLevelSupported,
  normalizeThinkingLevel,
} from "@/lib/models";

interface QuickModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  thinkingLevel: string;
  setThinkingLevel: (level: string) => void;
  isStructuredOutput?: boolean;
  setIsStructuredOutput?: (enabled: boolean) => void;
  onOpenEngineConfig: () => void;
}

export default function QuickModelSelector({
  selectedModel,
  setSelectedModel,
  thinkingLevel,
  setThinkingLevel,
  isStructuredOutput = false,
  setIsStructuredOutput,
  onOpenEngineConfig,
}: QuickModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Model selection handler with automatic thinking-level capability normalization
  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem("prompt_generator_selected_model", modelId);
    }

    const normalized = normalizeThinkingLevel(modelId, thinkingLevel);
    if (normalized !== thinkingLevel) {
      setThinkingLevel(normalized);
      if (typeof window !== "undefined") {
        localStorage.setItem("prompt_generator_thinking_level", normalized);
      }
    }
  };

  // Thinking level selection handler
  const handleSelectThinkingLevel = (level: string) => {
    if (!isThinkingLevelSupported(selectedModel, level)) return;
    setThinkingLevel(level);
    if (typeof window !== "undefined") {
      localStorage.setItem("prompt_generator_thinking_level", level);
    }
  };

  // Structured output toggle handler
  const handleToggleStructuredOutput = () => {
    if (setIsStructuredOutput) {
      const nextVal = !isStructuredOutput;
      setIsStructuredOutput(nextVal);
      if (typeof window !== "undefined") {
        localStorage.setItem("prompt_generator_structured_output", String(nextVal));
      }
    }
  };

  // Resolve canonical ID so legacy -latest sessions still match cleanly
  const canonicalSelectedModel = getCanonicalModelId(selectedModel);

  // Check if current selected model is one of the featured quick-switch options
  const isFeaturedSelected =
    canonicalSelectedModel === "gemini-4-hydrogen" ||
    canonicalSelectedModel === "gemini-4-neon" ||
    canonicalSelectedModel === "gemini-4-carbon" ||
    canonicalSelectedModel === "gemini-3.5-flash-lite";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="quick-model-selector">
      {/* Trigger Button - Icon only on the side of vault key */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative h-8.5 w-8.5 bg-white hover:bg-[#F4F4F2] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A] transition-all cursor-pointer flex items-center justify-center rounded-none font-mono shadow-2xs"
        title={`Quick Model & Engine Switcher (${getBriefModelLabel(selectedModel)} • ${thinkingLevel}${isStructuredOutput ? " • JSON" : ""})`}
        id="quick-model-btn"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        {isStructuredOutput && (
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-1 ring-white"
            title="Structured JSON output enabled"
          />
        )}
      </button>

      {/* Quick Switch Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white border border-[#D1D1CF] shadow-2xl z-50 flex flex-col rounded-none animate-in fade-in slide-in-from-top-1 duration-150"
          id="quick-model-dropdown"
        >
          {/* Panel Header Section with Settings Button */}
          <div className="px-3 py-2 bg-[#F4F4F2] border-b border-[#D1D1CF] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-wider font-sans text-[#1A1A1A]">
                Model & Engine
              </span>
            </div>

            {/* Button to open full Engine Controls modal */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenEngineConfig();
              }}
              className="px-2 py-0.5 bg-white hover:bg-[#EAEAE8] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A] text-[9px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer flex items-center gap-1"
              title="Open Full Engine Settings Modal"
            >
              <Settings className="w-3 h-3 text-[#1A1A1A]" />
              <span>Engine</span>
            </button>
          </div>

          <div className="p-3 flex flex-col gap-3">
            {/* ROW 1: Brief Status Indicator */}
            <div className="px-2.5 py-1.5 bg-[#FAF9F6] border border-[#D1D1CF] flex items-center justify-between text-[9px] font-mono">
              <span className="text-[#888884] uppercase font-bold text-[8px]">Active Status:</span>
              <div className="flex items-center gap-1.5 font-bold text-[#1A1A1A]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>{getBriefModelLabel(selectedModel)}</span>
                <span className="text-[#888884]">•</span>
                <span className="text-indigo-700">{thinkingLevel}</span>
                {isStructuredOutput && (
                  <>
                    <span className="text-[#888884]">•</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <Braces className="w-2.5 h-2.5 inline" />
                      JSON
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ROW 2: Model Selection (Gemini 4 Trio + compact Flash Lite bar) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#888884] font-mono">
                  Model (Featured)
                </span>
                {!isFeaturedSelected && (
                  <span className="text-[8px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1 font-semibold">
                    Specific Version Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "gemini-4-hydrogen", label: "Hydrogen", badge: "4 Free" },
                  { id: "gemini-4-neon", label: "Neon", badge: "4 Paid" },
                  { id: "gemini-4-carbon", label: "Carbon", badge: "4 Paid" },
                ].map((item) => {
                  const isSelected = canonicalSelectedModel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectModel(item.id)}
                      className={`p-2 border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 rounded-none ${
                        isSelected
                          ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs"
                          : "bg-white hover:bg-[#F4F4F2] text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider font-sans leading-tight">
                        {item.label}
                      </span>
                      <span
                        className={`text-[8px] font-mono ${
                          isSelected ? "text-stone-300" : "text-[#888884]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {(() => {
                const isFlashLiteSelected = canonicalSelectedModel === "gemini-3.5-flash-lite";
                return (
                  <button
                    type="button"
                    onClick={() => handleSelectModel("gemini-3.5-flash-lite")}
                    className={`w-full px-2.5 py-1.5 border transition-all cursor-pointer flex items-center justify-between rounded-none ${
                      isFlashLiteSelected
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs"
                        : "bg-white hover:bg-[#F4F4F2] text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider font-sans leading-tight">
                      Flash Lite
                    </span>
                    <span
                      className={`text-[8px] font-mono ${
                        isFlashLiteSelected ? "text-stone-300" : "text-[#888884]"
                      }`}
                    >
                      3.5 Lite
                    </span>
                  </button>
                );
              })()}
            </div>

            {/* ROW 3: Thinking Level Selection (XHIGH, HIGH, MEDIUM, LOW, MINIMAL) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#888884] font-mono">
                Thinking Level
              </span>

              <div className="grid grid-cols-5 gap-1">
                {ALL_THINKING_LEVELS.map((lvl) => {
                  const isSelected = thinkingLevel === lvl;
                  const isDisabled = !isThinkingLevelSupported(selectedModel, lvl);
                  const disabledTitle =
                    lvl === "XHIGH"
                      ? "XHIGH reasoning is supported on Gemini 4 Hydrogen and Gemini 4 Neon"
                      : "MINIMAL thinking level is not supported on Gemini 4 / Pro models";

                  return (
                    <button
                      key={lvl}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handleSelectThinkingLevel(lvl)}
                      title={isDisabled ? disabledTitle : `Set thinking level to ${lvl}`}
                      className={`py-1.5 text-[8.5px] font-bold tracking-wider uppercase border text-center transition-all rounded-none ${
                        isDisabled
                          ? "bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed"
                          : isSelected
                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs"
                            : "bg-white hover:bg-[#F4F4F2] text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A] cursor-pointer"
                      }`}
                    >
                      {lvl === "MINIMAL" ? "MIN" : lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ROW 4: Structured Output (JSON) Toggle */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#D1D1CF]/60">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#888884] font-mono flex items-center gap-1">
                  <Braces className="w-2.5 h-2.5 text-[#1A1A1A]" />
                  <span>Structured Output (JSON)</span>
                </span>
                {isStructuredOutput && (
                  <span className="text-[8px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 font-semibold">
                    ACTIVE
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleToggleStructuredOutput}
                className={`w-full py-1.5 px-2.5 border text-center transition-all cursor-pointer flex items-center justify-between rounded-none font-mono text-[9px] font-bold uppercase tracking-wider ${
                  isStructuredOutput
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs"
                    : "bg-white hover:bg-[#F4F4F2] text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                }`}
                title={isStructuredOutput ? "Click to disable structured JSON output" : "Click to enable structured JSON output"}
                id="quick-structured-output-toggle"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isStructuredOutput ? "bg-white animate-pulse" : "bg-stone-300"
                    }`}
                  />
                  <span>{isStructuredOutput ? "JSON Output: Enabled" : "JSON Output: Disabled"}</span>
                </div>
                <span className="text-[8px] opacity-80 underline hover:opacity-100">
                  {isStructuredOutput ? "[DISABLE]" : "[ENABLE]"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
