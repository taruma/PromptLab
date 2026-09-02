"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Settings, Braces } from "lucide-react";

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

  // Get brief model label for status bar and button title
  const getBriefModelLabel = (model: string) => {
    switch (model) {
      case "gemini-flash-latest":
        return "Flash Latest";
      case "gemini-flash-lite-latest":
        return "Flash Lite Latest";
      case "gemini-pro-latest":
        return "Pro Latest";
      case "gemini-3.8-flash":
        return "3.8 Flash";
      case "gemini-3.7-flash":
        return "3.7 Flash";
      case "gemini-3.6-flash":
        return "3.6 Flash";
      case "gemini-3.5-flash-lite":
        return "3.5 Flash Lite";
      case "gemini-3.5-flash":
        return "3.5 Flash";
      case "gemini-3.1-pro-preview":
        return "3.1 Pro";
      case "gemini-3.1-flash-lite":
        return "3.1 Flash Lite";
      case "gemini-3-flash-preview":
        return "3 Flash";
      default:
        return model.replace("gemini-", "");
    }
  };

  // Model selection handler (points to latest)
  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    if (typeof window !== "undefined") {
      localStorage.setItem("prompt_generator_selected_model", modelId);
    }

    // Pro models do not support MINIMAL thinking level
    if (modelId.includes("pro") && thinkingLevel === "MINIMAL") {
      setThinkingLevel("HIGH");
      if (typeof window !== "undefined") {
        localStorage.setItem("prompt_generator_thinking_level", "HIGH");
      }
    }
  };

  // Thinking level selection handler
  const handleSelectThinkingLevel = (level: string) => {
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

  // Check if current selected model is one of the 3 latest options
  const isLatestSelected =
    selectedModel === "gemini-flash-latest" ||
    selectedModel === "gemini-flash-lite-latest" ||
    selectedModel === "gemini-pro-latest";

  const isProModel = selectedModel.includes("pro");

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

            {/* ROW 2: Model Selection (Points to latest only - Flash, Flash Lite, Pro) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#888884] font-mono">
                  Model (Latest)
                </span>
                {!isLatestSelected && (
                  <span className="text-[8px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1 font-semibold">
                    Specific Version Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "gemini-flash-latest", label: "Flash", badge: "3.8" },
                  { id: "gemini-flash-lite-latest", label: "Flash Lite", badge: "3.5" },
                  { id: "gemini-pro-latest", label: "Pro", badge: "3.1" },
                ].map((item) => {
                  const isSelected = selectedModel === item.id;
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
                        {item.badge} Latest
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ROW 3: Thinking Level Selection (HIGH, MEDIUM, LOW, MINIMAL) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#888884] font-mono">
                Thinking Level
              </span>

              <div className="grid grid-cols-4 gap-1.5">
                {["HIGH", "MEDIUM", "LOW", "MINIMAL"].map((lvl) => {
                  const isSelected = thinkingLevel === lvl;
                  const isDisabled = lvl === "MINIMAL" && isProModel;

                  return (
                    <button
                      key={lvl}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handleSelectThinkingLevel(lvl)}
                      title={isDisabled ? "MINIMAL thinking level is not supported for Pro models" : `Set thinking level to ${lvl}`}
                      className={`py-1.5 text-[9px] font-bold tracking-wider uppercase border text-center transition-all rounded-none ${
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
