"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Info, EyeOff, Eye, RefreshCw, Trash2, KeyRound, ChevronDown, ChevronUp } from "lucide-react";

interface EngineControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  thinkingLevel: string;
  setThinkingLevel: (level: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  maxTokens: string;
  setMaxTokens: (tokens: string) => void;
  customApiKey: string;
  setCustomApiKey: (key: string) => void;
}

export default function EngineControlsModal({
  isOpen,
  onClose,
  selectedModel,
  setSelectedModel,
  thinkingLevel,
  setThinkingLevel,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  customApiKey,
  setCustomApiKey,
}: EngineControlsModalProps) {
  const [tempModel, setTempModel] = useState<string>(selectedModel);
  const [tempThinkingLevel, setTempThinkingLevel] = useState<string>(thinkingLevel);
  const [tempTemperature, setTempTemperature] = useState<number>(temperature);
  const [tempMaxTokens, setTempMaxTokens] = useState<string>(maxTokens);
  const [tempCustomApiKey, setTempCustomApiKey] = useState<string>(customApiKey);

  // API Key Vault states
  const [localKeys, setLocalKeys] = useState<{ id: string; label: string; key: string }[]>([]);
  const [localActiveKeyId, setLocalActiveKeyId] = useState<string>("");
  const [newKeyLabel, setNewKeyLabel] = useState<string>("");
  const [newKeyValue, setNewKeyValue] = useState<string>("");
  const [showNewKey, setShowNewKey] = useState<boolean>(false);
  const [addKeyError, setAddKeyError] = useState<string>("");
  const [isVaultCollapsed, setIsVaultCollapsed] = useState<boolean>(true);

  const [prevIsOpen, setPrevIsOpen] = useState<boolean>(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setTempModel(selectedModel);
      setTempThinkingLevel(thinkingLevel);
      setTempTemperature(temperature);
      setTempMaxTokens(maxTokens);
      setTempCustomApiKey(customApiKey);
      setIsVaultCollapsed(true);

      // Load keys vault from localStorage
      try {
        const savedKeysStr = typeof window !== "undefined" ? localStorage.getItem("prompt_generator_custom_api_keys") : null;
        const savedKeys = savedKeysStr ? JSON.parse(savedKeysStr) : [];
        const savedActiveId = typeof window !== "undefined" ? localStorage.getItem("prompt_generator_active_api_key_id") || "" : "";

        setLocalKeys(savedKeys);
        setLocalActiveKeyId(savedActiveId);
      } catch (e) {
        setLocalKeys([]);
        setLocalActiveKeyId("");
      }

      setNewKeyLabel("");
      setNewKeyValue("");
      setAddKeyError("");
    }
  }

  if (!isOpen) return null;

  const handleApplyEngineConfig = () => {
    setSelectedModel(tempModel);
    setThinkingLevel(tempThinkingLevel);
    setTemperature(tempTemperature);
    setMaxTokens(tempMaxTokens);
    setCustomApiKey(tempCustomApiKey);

    localStorage.setItem("prompt_generator_selected_model", tempModel);
    localStorage.setItem("prompt_generator_thinking_level", tempThinkingLevel);
    localStorage.setItem("prompt_generator_temperature", String(tempTemperature));
    localStorage.setItem("prompt_generator_max_tokens", tempMaxTokens);
    localStorage.setItem("prompt_generator_custom_api_keys", JSON.stringify(localKeys));
    localStorage.setItem("prompt_generator_active_api_key_id", localActiveKeyId);

    onClose();
  };

  const handleResetEngineDefaults = () => {
    setTempModel("gemini-3.5-flash");
    setTempThinkingLevel("MEDIUM");
    setTempTemperature(1.0);
    setTempMaxTokens("");
    setTempCustomApiKey("");
    setLocalActiveKeyId("");
  };

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6" id="engine-config-modal">
      <div className="bg-white border border-[#D1D1CF] w-full max-w-3xl h-auto max-h-[90vh] flex flex-col justify-between shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="h-16 border-b border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#888884]" />
            <h3 className="text-xs font-black uppercase tracking-wider font-sans">
              Engine Settings & Parameters
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-[#1A1A1A] font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
          >
            [ESC] CLOSE
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#F4F4F2]/30">
          
          {/* Alert Warning for Paid Models */}
          {tempModel === "gemini-3.1-pro-preview" && !tempCustomApiKey && (
            <div className="bg-amber-50 border border-amber-200 p-3.5 text-[10px] leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex flex-col gap-1 text-amber-800">
                <span className="font-bold uppercase tracking-wider text-[9px] font-mono">Premium Engine Selected:</span>
                <p>
                  The <code className="font-mono bg-amber-100 px-1 font-bold">gemini-3.1-pro-preview</code> model requires a paid API key. Make sure your key is configured in the <strong>Settings &gt; Secrets</strong> panel or provided below in the custom key field.
                </p>
              </div>
            </div>
          )}

          {/* Custom API Key Override Field */}
          <div className="bg-white border border-[#D1D1CF] p-4 flex flex-col gap-3">
            <div 
              onClick={() => setIsVaultCollapsed(!isVaultCollapsed)}
              className="flex justify-between items-center cursor-pointer select-none group"
            >
              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A] flex items-center gap-1.5">
                <span>API Key Vault (Local Overrides)</span>
                {tempCustomApiKey ? (
                  <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider">
                    Override Active
                  </span>
                ) : (
                  <span className="text-[8px] bg-stone-100 text-stone-500 border border-stone-300 font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider">
                    Default Env Key
                  </span>
                )}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-[#888884] group-hover:text-[#1A1A1A] font-bold uppercase transition-colors">
                  {isVaultCollapsed ? "[EXPAND]" : "[COLLAPSE]"}
                </span>
                {isVaultCollapsed ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#888884] group-hover:text-[#1A1A1A] transition-colors" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5 text-[#888884] group-hover:text-[#1A1A1A] transition-colors" />
                )}
              </div>
            </div>

            {!isVaultCollapsed && (
              <>
                <p className="text-[10px] text-[#888884] leading-normal">
                  Manage and select from multiple developer Gemini API Keys. This is secure, stores keys only in your browser localStorage, and allows you to swap identities or quotas on the fly.
                </p>

                {/* Active Key Selector */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 font-mono">Select Active Key Override</span>
                  <select
                    value={localActiveKeyId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setLocalActiveKeyId(selectedId);
                      const selectedKey = localKeys.find(k => k.id === selectedId);
                      setTempCustomApiKey(selectedKey ? selectedKey.key : "");
                    }}
                    className="w-full bg-[#F4F4F2]/50 border border-[#D1D1CF] p-2.5 text-xs font-mono outline-none focus:border-[#1A1A1A] rounded-none text-[#1A1A1A] cursor-pointer"
                  >
                    <option value="">None (Use Server Default Key)</option>
                    {localKeys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label} ({k.key.length > 8 ? `••••${k.key.slice(-4)}` : "invalid key"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Saved Keys List */}
                {localKeys.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 font-mono">Saved Keys Vault</span>
                    <div className="border border-[#D1D1CF] bg-[#FAF9F6] divide-y divide-[#D1D1CF] max-h-[140px] overflow-y-auto custom-scrollbar">
                      {localKeys.map((k) => {
                        const isActive = localActiveKeyId === k.id;
                        const maskedValue = k.key.length > 8 
                          ? `${k.key.slice(0, 4)}••••${k.key.slice(-4)}` 
                          : "••••••••";
                        
                        return (
                          <div key={k.id} className="flex items-center justify-between p-2.5 hover:bg-white transition-colors">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-[#1A1A1A] font-sans flex items-center gap-2">
                                {k.label}
                                {isActive && (
                                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[8px] font-black uppercase tracking-wider px-1 py-0.5 scale-90">
                                    ACTIVE
                                  </span>
                                )}
                              </span>
                              <span className="text-[9px] font-mono text-stone-500">{maskedValue}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {!isActive && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLocalActiveKeyId(k.id);
                                    setTempCustomApiKey(k.key);
                                  }}
                                  className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white bg-[#FAF9F6] text-[#1A1A1A] cursor-pointer"
                                >
                                  Select
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = localKeys.filter(item => item.id !== k.id);
                                  setLocalKeys(updated);
                                  if (localActiveKeyId === k.id) {
                                    setLocalActiveKeyId("");
                                    setTempCustomApiKey("");
                                  }
                                }}
                                className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 cursor-pointer"
                                title="Delete key"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Form to Add New Key */}
                <div className="border border-[#D1D1CF] p-3 bg-[#FAF9F6]/40 flex flex-col gap-2.5 mt-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#1A1A1A] font-mono flex items-center gap-1.5">
                    <KeyRound size={11} className="text-stone-500" /> Add New Key to Vault
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-stone-500 font-mono">Key Label / Description</span>
                      <input
                        type="text"
                        value={newKeyLabel}
                        onChange={(e) => setNewKeyLabel(e.target.value)}
                        placeholder="e.g. My Sandbox Key"
                        className="w-full bg-white border border-[#D1D1CF] p-2 text-xs font-sans outline-none focus:border-[#1A1A1A] rounded-none text-[#1A1A1A]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-stone-500 font-mono">API Key Value</span>
                      <div className="relative">
                        <input
                          type={showNewKey ? "text" : "password"}
                          value={newKeyValue}
                          onChange={(e) => setNewKeyValue(e.target.value)}
                          placeholder="AIzaSy..."
                          className="w-full bg-white border border-[#D1D1CF] p-2 pr-8 text-xs font-mono outline-none focus:border-[#1A1A1A] rounded-none text-[#1A1A1A]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewKey(!showNewKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#1A1A1A] p-0.5 cursor-pointer"
                        >
                          {showNewKey ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {addKeyError && (
                    <span className="text-[9px] text-red-600 font-mono leading-none">[!] {addKeyError}</span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!newKeyLabel.trim()) {
                        setAddKeyError("Please provide a label for the API key.");
                        return;
                      }
                      if (!newKeyValue.trim()) {
                        setAddKeyError("Please provide an API key value.");
                        return;
                      }
                      
                      const newId = "key-" + Date.now();
                      const newKeyObj = {
                        id: newId,
                        label: newKeyLabel.trim(),
                        key: newKeyValue.trim()
                      };
                      
                      const updatedKeys = [...localKeys, newKeyObj];
                      setLocalKeys(updatedKeys);
                      setLocalActiveKeyId(newId);
                      setTempCustomApiKey(newKeyValue.trim());
                      
                      // Reset form fields
                      setNewKeyLabel("");
                      setNewKeyValue("");
                      setAddKeyError("");
                    }}
                    className="w-full py-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-[9px] font-bold uppercase tracking-wider cursor-pointer border border-[#1A1A1A] text-center"
                  >
                    Save Key to Vault
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Grid: Left column (Model Selector) & Right column (Params Selector) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column 1: Model Selection */}
            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]">
                Select Generation Model
              </h4>
              <div className="flex flex-col gap-3">
                {/* Model Option 1 */}
                <button
                  onClick={() => {
                    setTempModel("gemini-3.5-flash");
                  }}
                  className={`w-full text-left p-4 border text-xs transition-all cursor-pointer flex flex-col gap-1.5 rounded-none ${
                    tempModel === "gemini-3.5-flash"
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                  }`}
                >
                  <div className="flex justify-between items-baseline w-full">
                    <span className="font-black uppercase tracking-wider font-mono">Gemini 3.5 Flash</span>
                    <span className="text-[8px] font-mono opacity-65 font-bold uppercase">Standard / Free</span>
                  </div>
                  <p className={`text-[10px] leading-normal ${tempModel === "gemini-3.5-flash" ? "text-stone-300" : "text-[#888884]"}`}>
                    Best general-purpose model. Fast performance and balanced creativity for standard scriptwriting and copy structuring.
                  </p>
                </button>

                {/* Model Option 2 */}
                <button
                  onClick={() => {
                    setTempModel("gemini-3.1-flash-lite");
                  }}
                  className={`w-full text-left p-4 border text-xs transition-all cursor-pointer flex flex-col gap-1.5 rounded-none ${
                    tempModel === "gemini-3.1-flash-lite"
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                  }`}
                >
                  <div className="flex justify-between items-baseline w-full">
                    <span className="font-black uppercase tracking-wider font-mono">Gemini 3.1 Flash Lite</span>
                    <span className="text-[8px] font-mono opacity-65 font-bold uppercase">Fast / Free</span>
                  </div>
                  <p className={`text-[10px] leading-normal ${tempModel === "gemini-3.1-flash-lite" ? "text-stone-300" : "text-[#888884]"}`}>
                    Low latency engine. Perfect for rapid prototyping, instant synthesis iterations, and low-complexity tasks.
                  </p>
                </button>

                {/* Model Option 3 */}
                <button
                  onClick={() => {
                    setTempModel("gemini-3.1-pro-preview");
                    // Pro model does not support MINIMAL thinking level
                    if (tempThinkingLevel === "MINIMAL") {
                      setTempThinkingLevel("HIGH");
                    }
                  }}
                  className={`w-full text-left p-4 border text-xs transition-all cursor-pointer flex flex-col gap-1.5 rounded-none ${
                    tempModel === "gemini-3.1-pro-preview"
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A]"
                  }`}
                >
                  <div className="flex justify-between items-baseline w-full">
                    <span className="font-black uppercase tracking-wider font-mono">Gemini 3.1 Pro</span>
                    <span className="text-[8px] font-mono opacity-65 font-bold uppercase text-amber-500">Advanced / Paid</span>
                  </div>
                  <p className={`text-[10px] leading-normal ${tempModel === "gemini-3.1-pro-preview" ? "text-stone-300" : "text-[#888884]"}`}>
                    Complex text tasks and deep reasoning. Exceptional at intricate code specifications, deep creative plots, and detailed scripts.
                  </p>
                </button>
              </div>
            </div>

            {/* Column 2: Parameters */}
            <div className="flex flex-col gap-5">
              
              {/* Reasoning Level Selector */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]">
                  Reasoning Effort (Thinking Level)
                </h4>
                <p className="text-[10px] text-[#888884] leading-normal">
                  Controls the model&apos;s internal reasoning depth before outputting results. High reasoning enhances logic but may add latency.
                </p>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {["HIGH", "MEDIUM", "LOW", "MINIMAL"].map((lvl) => {
                    const isSelected = tempThinkingLevel === lvl;
                    const isDisabled = lvl === "MINIMAL" && tempModel === "gemini-3.1-pro-preview";
                    return (
                      <button
                        key={lvl}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => !isDisabled && setTempThinkingLevel(lvl)}
                        className={`py-2 text-[9px] font-bold tracking-wider uppercase border text-center transition-all ${
                          isDisabled
                            ? "bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed"
                            : isSelected
                              ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                              : "bg-white text-[#1A1A1A] border-[#D1D1CF] hover:border-[#1A1A1A] cursor-pointer"
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              <hr className="border-[#D1D1CF]" />

              {/* Temperature Slider */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]">
                    Temperature (Creativity)
                  </h4>
                  <span className="text-xs font-mono font-bold bg-[#EAEAE8] border border-[#D1D1CF] px-2 py-0.5">
                    {tempTemperature.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-[#888884] leading-normal">
                  Higher values mean more random, highly creative results. Lower values restrict the output to be deterministic and literal.
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[9px] font-mono uppercase text-[#888884]">Stark</span>
                  <input
                    type="range"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={tempTemperature}
                    onChange={(e) => setTempTemperature(Number(e.target.value))}
                    className="flex-1 accent-[#1A1A1A] cursor-pointer h-1.5 bg-[#D1D1CF] rounded-none outline-none"
                  />
                  <span className="text-[9px] font-mono uppercase text-[#888884]">Wild</span>
                </div>
              </div>

              <hr className="border-[#D1D1CF]" />

              {/* Max Tokens input */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1A1A1A]">
                  Max Output Tokens Limit
                </h4>
                <p className="text-[10px] text-[#888884] leading-normal">
                  Specifies the absolute threshold for total tokens. Set blank to utilize natural auto-truncation guidelines.
                </p>
                <label htmlFor="temp-max-tokens" className="sr-only">Max Output Tokens</label>
                <input
                  id="temp-max-tokens"
                  type="text"
                  pattern="[0-9]*"
                  value={tempMaxTokens}
                  onChange={(e) => setTempMaxTokens(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 2048 (leave blank for default auto)"
                  className="bg-white border border-[#D1D1CF] p-3 text-xs font-mono outline-none focus:border-[#1A1A1A] transition-all rounded-none text-[#1A1A1A] mt-1"
                />
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="h-16 border-t border-[#D1D1CF] px-6 flex items-center justify-between bg-[#F4F4F2] shrink-0">
          <button
            type="button"
            onClick={handleResetEngineDefaults}
            className="px-3 py-2 border border-[#D1D1CF] hover:border-red-500 hover:text-red-500 hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 bg-white"
            title="Reset settings to standard system defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#D1D1CF] hover:border-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyEngineConfig}
              className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border border-[#1A1A1A]"
            >
              Apply Engine Overrides
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
