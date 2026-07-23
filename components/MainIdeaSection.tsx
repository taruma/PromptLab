import React from "react";

interface MainIdeaSectionProps {
  ideaValue: string;
  onIdeaChange: (value: string) => void;
}

export default function MainIdeaSection({
  ideaValue,
  onIdeaChange,
}: MainIdeaSectionProps) {
  return (
    <section className="flex flex-col gap-3" id="main-idea-section">
      <div className="flex justify-between items-end">
        <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
          Main Objective / Idea
        </h2>
        <span className="text-[9px] font-mono text-[#888884]">
          {"{{ idea }}"}
        </span>
      </div>

      <label htmlFor="variable-idea" className="sr-only">Core Creative Concept</label>
      <textarea
        id="variable-idea"
        rows={4}
        value={ideaValue}
        onChange={(e) => onIdeaChange(e.target.value)}
        placeholder="Describe the core creative scene requirements, conflict, or central idea here..."
        className="w-full bg-white border border-[#D1D1CF] p-4 text-sm leading-relaxed outline-none focus:border-[#1A1A1A] transition-colors resize-y min-h-[120px] rounded-none font-sans text-[#1A1A1A] placeholder-stone-400"
      />
    </section>
  );
}
