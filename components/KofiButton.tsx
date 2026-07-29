"use client";

import React from "react";
import { Coffee, ExternalLink } from "lucide-react";

interface KofiButtonProps {
  className?: string;
  variant?: "header" | "standalone";
  label?: string;
}

export default function KofiButton({
  className = "",
  variant = "header",
  label = "Support me on Ko-fi",
}: KofiButtonProps) {
  // Environment variable control to toggle button visibility (defaults to enabled unless set to "false")
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_KOFI_BUTTON !== "false";

  if (!isEnabled) return null;

  const kofiUrl = "https://ko-fi.com/tarumainfo";

  if (variant === "header") {
    return (
      <a
        href={kofiUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`px-2.5 py-1.5 bg-[#72a4f2] hover:bg-[#5c92e8] border border-[#5084da] text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs rounded-none font-mono ${className}`}
        title="Support or tip PromptLab on Ko-fi"
        id="kofi-header-button"
      >
        <Coffee className="w-3.5 h-3.5 text-white shrink-0 fill-white/20" />
        <span className="hidden lg:inline">{label}</span>
        <span className="lg:hidden">Tip</span>
        <ExternalLink className="w-3 h-3 text-white/80 shrink-0 ml-0.5" />
      </a>
    );
  }

  return (
    <a
      href={kofiUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`px-3.5 py-2 bg-[#72a4f2] hover:bg-[#5c92e8] text-white text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border border-[#5084da] font-mono shadow-2xs rounded-none ${className}`}
      id="kofi-standalone-button"
    >
      <Coffee className="w-4 h-4 text-white shrink-0 fill-white/20" />
      <span>{label}</span>
      <ExternalLink className="w-3.5 h-3.5 text-white/80 shrink-0" />
    </a>
  );
}
