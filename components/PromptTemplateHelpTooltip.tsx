"use client";

import React from "react";
import { HelpCircle } from "lucide-react";

export default function PromptTemplateHelpTooltip() {
  return (
    <div className="relative group inline-flex items-center">
      <HelpCircle className="w-3.5 h-3.5 text-[#888884] hover:text-[#1A1A1A] cursor-pointer transition-colors" />
      <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1 z-50 w-72 p-3 bg-white border border-[#D1D1CF] shadow-xl text-[10px] text-[#555] leading-relaxed hidden group-hover:block transition-all pointer-events-none">
        <div className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[9px] font-mono mb-1.5 flex items-center justify-between border-b border-[#D1D1CF]/60 pb-1">
          <span>Prompt Template Guide</span>
          <span className="text-[#888884] font-normal text-[8px]">HELP</span>
        </div>
        <p className="mb-2 text-[#444]">
          Templates construct the final compiled text sent to Gemini. Wrap placeholders in double curly-braces <code className="font-mono bg-[#F4F4F2] px-1 font-bold text-[#1A1A1A]">{"{{ name }}"}</code>.
        </p>
        <div className="flex flex-col gap-1.5 text-[9.5px]">
          <div className="flex items-start gap-1.5">
            <code className="font-mono font-bold text-[#1A1A1A] bg-[#F4F4F2] px-1 border border-[#D1D1CF] shrink-0">{"{{ idea }}"}</code>
            <span className="text-[#666]">Connects to <strong>Main Objective / Idea</strong> workspace text area.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <code className="font-mono font-bold text-[#1A1A1A] bg-[#F4F4F2] px-1 border border-[#D1D1CF] shrink-0">{"{{ visual_references }}"}</code>
            <span className="text-[#666]">Injects media casting tags (<code className="font-mono text-[8.5px]">@image1</code>, <code className="font-mono text-[8.5px]">@video1</code>). <code className="font-mono text-[8.5px]">{"{{ cast }}"}</code> also works.</span>
          </div>
          <div className="flex items-start gap-1.5 pt-1 border-t border-[#D1D1CF]/40">
            <code className="font-mono text-[#888884] bg-[#F4F4F2] px-1 shrink-0">{"{{ custom_var }}"}</code>
            <span className="text-[#666]">Auto-generates dynamic input forms in the workspace sidebar.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
