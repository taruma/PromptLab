import React from "react";

interface FooterStatusBarProps {
  selectedModel: string;
  thinkingLevel: string;
  temperature: number;
  activeApiKeyLabel: string;
  engineMode?: "standard" | "interaction_beta";
}

export default function FooterStatusBar({
  selectedModel,
  thinkingLevel,
  temperature,
  activeApiKeyLabel,
  engineMode = "standard",
}: FooterStatusBarProps) {
  return (
    <footer className="h-10 px-4 md:px-10 bg-[#1A1A1A] text-white flex items-center justify-between text-[9px] font-mono shrink-0">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 uppercase">
        <span className="flex items-center gap-1.5">
          <span>Engine: {selectedModel.toUpperCase()}</span>
          {engineMode === "interaction_beta" && (
            <span className="px-1 py-0.2 bg-emerald-500 text-white font-bold text-[8px] tracking-wider leading-tight">
              INTERACTION BETA
            </span>
          )}
        </span>
        <span>Reasoning: {thinkingLevel}</span>
        <span>Temp: {temperature.toFixed(1)}</span>
        <span>Key: {activeApiKeyLabel.toUpperCase()}</span>
      </div>
      <div className="uppercase opacity-50 tracking-wider">PromptLab by Taruma Sakti</div>
    </footer>
  );
}
