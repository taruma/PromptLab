import React from "react";

interface FooterStatusBarProps {
  selectedModel: string;
  thinkingLevel: string;
  temperature: number;
  activeApiKeyLabel: string;
}

export default function FooterStatusBar({
  selectedModel,
  thinkingLevel,
  temperature,
  activeApiKeyLabel,
}: FooterStatusBarProps) {
  return (
    <footer className="h-10 px-4 md:px-10 bg-[#1A1A1A] text-white flex items-center justify-between text-[9px] font-mono shrink-0">
      <div className="flex flex-wrap gap-x-6 gap-y-1 uppercase">
        <span>Engine: {selectedModel.toUpperCase()}</span>
        <span>Reasoning: {thinkingLevel}</span>
        <span>Temp: {temperature.toFixed(1)}</span>
        <span>Key: {activeApiKeyLabel.toUpperCase()}</span>
      </div>
      <div className="uppercase opacity-50 tracking-wider">PromptLab by Taruma Sakti</div>
    </footer>
  );
}
