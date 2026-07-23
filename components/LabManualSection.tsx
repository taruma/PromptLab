import React from "react";
import { HelpCircle, ChevronDown, BookOpen } from "lucide-react";

interface LabManualSectionProps {
  isLabManualOpen: boolean;
  toggleLabManual: () => void;
}

export default function LabManualSection({
  isLabManualOpen,
  toggleLabManual,
}: LabManualSectionProps) {
  return (
    <section className="flex flex-col shrink-0" id="lab-manual-panel">
      <div 
        onClick={toggleLabManual}
        className="flex justify-between items-center mb-1 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Lab Manual & Quick-Start Guide
          </h2>
          <span className="text-[#888884] group-hover:text-[#1A1A1A] transition-colors">
            {isLabManualOpen ? (
              <ChevronDown className="w-3.5 h-3.5 transform rotate-180 transition-transform" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 transition-transform" />
            )}
          </span>
        </div>
      </div>

      {isLabManualOpen && (
        <div className="bg-white border border-[#D1D1CF] p-4 md:p-5 flex flex-col gap-4 text-xs" id="lab-manual-content">
          {/* 1-4 Step instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-2.5">
              <span className="font-mono text-xs font-bold text-[#888884] bg-[#EAEAE8] border border-[#D1D1CF] w-5 h-5 flex items-center justify-center shrink-0">1</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Configure Template</span>
                <p className="text-[#888884] text-[11px] leading-relaxed">
                  Click <strong className="text-[#1A1A1A]">Configure Prompts</strong> to customize System Instructions, curly-brace variables (e.g. <code className="font-mono bg-[#EAEAE8]/40 px-1 font-bold text-[10px]">{"{{ variable }}"}</code>), or import and compare saved presets.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <span className="font-mono text-xs font-bold text-[#888884] bg-[#EAEAE8] border border-[#D1D1CF] w-5 h-5 flex items-center justify-center shrink-0">2</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Input Active Values</span>
                <p className="text-[#888884] text-[11px] leading-relaxed">
                  Fill in your core concept under <strong className="text-[#1A1A1A]">Main Objective / Idea</strong>. Dynamic form inputs are automatically generated below for all template placeholders.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <span className="font-mono text-xs font-bold text-[#888884] bg-[#EAEAE8] border border-[#D1D1CF] w-5 h-5 flex items-center justify-center shrink-0">3</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Upload References</span>
                <p className="text-[#888884] text-[11px] leading-relaxed">
                  Attach reference images (<code className="font-mono bg-[#EAEAE8]/40 px-1 font-bold text-[10px]">@imageX</code>) and MP4 videos or YouTube links (<code className="font-mono bg-[#EAEAE8]/40 px-1 font-bold text-[10px]">@videoX</code>), or pick saved items from the <strong className="text-[#1A1A1A]">Asset Library</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <span className="font-mono text-xs font-bold text-[#888884] bg-[#EAEAE8] border border-[#D1D1CF] w-5 h-5 flex items-center justify-center shrink-0">4</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">Synthesize Sequence</span>
                <p className="text-[#888884] text-[11px] leading-relaxed">
                  Configure Gemini models, reasoning levels, and key vault in <strong className="text-[#1A1A1A]">Engine Controls</strong>, then hit <strong className="text-[#1A1A1A]">Generate Sequence</strong> to stream real-time thinking traces and script output.
                </p>
              </div>
            </div>
          </div>

          {/* Footer link to Repository */}
          <div className="border-t border-[#D1D1CF] pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F4F4F2]/50 p-2.5 border-dashed">
            <span className="text-[10px] text-[#888884] font-medium leading-relaxed">
              Looking for custom templates, default presets, or raw project files?
            </span>
            <a 
              href="https://github.com/taruma/PromptLab" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded-none self-start sm:self-auto shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Open Docs Repo
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
