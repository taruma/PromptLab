import React from "react";
import { HelpCircle } from "lucide-react";

interface ParameterInputsSectionProps {
  displayVariables: string[];
  inputs: Record<string, string>;
  onInputChange: (variable: string, value: string) => void;
}

export default function ParameterInputsSection({
  displayVariables,
  inputs,
  onInputChange,
}: ParameterInputsSectionProps) {
  return (
    <section className="flex flex-col gap-3" id="parameter-inputs-card">
      <div className="flex justify-between items-end">
        <h2 className="text-[10px] uppercase tracking-[0.20em] text-[#888884] font-bold">
          Template Specifications
        </h2>
        <span className="text-[9px] font-mono text-[#888884]">
          Parameters Form
        </span>
      </div>

      {displayVariables.length === 0 ? (
        <div className="bg-white border border-[#D1D1CF] p-6 text-center">
          <HelpCircle className="w-6 h-6 text-[#888884] mx-auto mb-1.5" />
          <p className="text-xs text-[#888884] uppercase tracking-wider font-bold">Mapping dynamic variables...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-[#D1D1CF] p-6" id="parameter-inputs-container">
          {displayVariables.map((v) => {
            const label = v.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            return (
              <div key={v} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-baseline">
                  <label htmlFor={`input-${v}`} className="text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]">
                    {label}
                  </label>
                  <span className="text-[8px] font-mono text-[#888884]">{"{{"} {v} {"}}"}</span>
                </div>
                <input
                  id={`input-${v}`}
                  type="text"
                  value={inputs[v] || ""}
                  onChange={(e) => onInputChange(v, e.target.value)}
                  placeholder={`Provide ${label.toLowerCase()}...`}
                  className="bg-white border border-[#D1D1CF] p-3 text-xs outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A]"
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
