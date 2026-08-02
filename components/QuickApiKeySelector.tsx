"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  KeyRound,
  ChevronDown,
  Check,
  Settings,
  Search,
  X,
} from "lucide-react";

export interface KeyVaultItem {
  id: string;
  label: string;
  key: string;
}

interface QuickApiKeySelectorProps {
  customApiKey?: string;
  setCustomApiKey?: (key: string) => void;
  onOpenEngineConfig: () => void;
}

export default function QuickApiKeySelector({
  customApiKey = "",
  setCustomApiKey,
  onOpenEngineConfig,
}: QuickApiKeySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keysList, setKeysList] = useState<KeyVaultItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const savedKeysStr = localStorage.getItem("prompt_generator_custom_api_keys");
      return savedKeysStr ? JSON.parse(savedKeysStr) : [];
    } catch {
      return [];
    }
  });

  const [activeKeyId, setActiveKeyId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("prompt_generator_active_api_key_id") || "";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync keys from localStorage
  const refreshKeysFromStorage = React.useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const savedKeysStr = localStorage.getItem("prompt_generator_custom_api_keys");
      const savedActiveId = localStorage.getItem("prompt_generator_active_api_key_id") || "";
      const savedKeys: KeyVaultItem[] = savedKeysStr ? JSON.parse(savedKeysStr) : [];

      setKeysList(savedKeys);
      setActiveKeyId(savedActiveId);
    } catch (e) {
      console.error("Failed to load keys from localStorage in QuickApiKeySelector:", e);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshKeysFromStorage();
    }, 0);
    return () => clearTimeout(timer);
  }, [customApiKey, refreshKeysFromStorage]);

  useEffect(() => {
    const handleStorage = () => {
      refreshKeysFromStorage();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshKeysFromStorage]);

  const handleToggleOpen = () => {
    if (!isOpen) {
      refreshKeysFromStorage();
    }
    setIsOpen((prev) => !prev);
  };

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
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
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Mask key string for secure display
  const maskKey = (key: string) => {
    if (!key) return "";
    const clean = key.trim();
    if (clean.length <= 8) return "••••" + clean.slice(-4);
    return clean.slice(0, 4) + "..." + clean.slice(-4);
  };

  // Get active key label for selector trigger button
  const getActiveKeyLabel = () => {
    if (!customApiKey) {
      return "Default Env Key";
    }
    const match = keysList.find((k) => k.id === activeKeyId || k.key === customApiKey);
    if (match) {
      return match.label;
    }
    return "Custom Key";
  };

  // Select Default Env Key
  const handleSelectDefaultEnvKey = () => {
    setActiveKeyId("");
    if (typeof window !== "undefined") {
      localStorage.setItem("prompt_generator_active_api_key_id", "");
    }
    if (setCustomApiKey) {
      setCustomApiKey("");
    }
    setIsOpen(false);
  };

  // Select a specific custom key
  const handleSelectCustomKey = (item: KeyVaultItem) => {
    setActiveKeyId(item.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("prompt_generator_active_api_key_id", item.id);
    }
    if (setCustomApiKey) {
      setCustomApiKey(item.key);
    }
    setIsOpen(false);
  };

  const filteredKeys = keysList.filter(
    (k) =>
      k.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="quick-api-key-selector">
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={handleToggleOpen}
        className={`h-8.5 px-2.5 sm:px-3 border transition-all cursor-pointer flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider rounded-none font-mono shadow-2xs ${
          customApiKey
            ? "bg-emerald-50 hover:bg-emerald-100/90 border-emerald-300 hover:border-emerald-500 text-emerald-950"
            : "bg-white hover:bg-[#F4F4F2] border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A]"
        }`}
        title="Quick API Key Switcher"
        id="quick-api-key-btn"
      >
        <KeyRound
          className={`w-3.5 h-3.5 shrink-0 ${
            customApiKey ? "text-emerald-600" : "text-[#888884]"
          }`}
        />
        <div className="flex items-center gap-1.5 max-w-[130px] sm:max-w-[170px] truncate">
          <span className="truncate font-black">{getActiveKeyLabel()}</span>
          {customApiKey ? (
            <span className="text-[8px] bg-emerald-200/80 text-emerald-900 border border-emerald-400 font-mono font-bold px-1 py-0.2 shrink-0">
              BYOK
            </span>
          ) : (
            <span className="text-[8px] bg-stone-100 text-stone-500 border border-stone-300 font-mono font-bold px-1 py-0.2 shrink-0">
              ENV
            </span>
          )}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#888884] shrink-0 ml-0.5" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 md:left-0 md:right-auto mt-1.5 w-72 sm:w-80 bg-white border border-[#D1D1CF] shadow-2xl z-50 flex flex-col rounded-none animate-in fade-in slide-in-from-top-1 duration-150"
          id="quick-api-key-dropdown"
        >
          {/* Dropdown Header */}
          <div className="px-3 py-2 bg-[#F4F4F2] border-b border-[#D1D1CF] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span className="text-[10px] font-black uppercase tracking-wider font-sans text-[#1A1A1A]">
                API Key Vault
              </span>
              <span className="text-[9px] font-mono font-bold text-[#888884] ml-0.5">
                ({keysList.length})
              </span>
            </div>

            {/* Top Right Manage Button */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenEngineConfig();
              }}
              className="px-2 py-0.5 bg-white hover:bg-[#EAEAE8] border border-[#D1D1CF] hover:border-[#1A1A1A] text-[#1A1A1A] text-[9px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer flex items-center gap-1"
              title="Manage Vault Keys in Engine Settings"
            >
              <Settings className="w-3 h-3 text-[#1A1A1A]" />
              <span>Manage</span>
            </button>
          </div>

          {/* Active Key Status Banner */}
          <div className="px-3 py-1.5 bg-stone-50 border-b border-[#D1D1CF]/60 flex items-center justify-between text-[9px] font-mono">
            <span className="text-[#888884] uppercase font-bold text-[8px]">Active:</span>
            <div className="flex items-center gap-1 truncate max-w-[200px]">
              {customApiKey ? (
                <span className="text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 truncate text-[8.5px]">
                  ● {getActiveKeyLabel()} ({maskKey(customApiKey)})
                </span>
              ) : (
                <span className="text-stone-600 font-bold bg-stone-200/80 border border-stone-300 px-1.5 py-0.2 text-[8.5px]">
                  ● Default Env Key (GEMINI_API_KEY)
                </span>
              )}
            </div>
          </div>

          {/* Search Bar if keys list > 3 */}
          {keysList.length > 3 && (
            <div className="p-1.5 border-b border-[#D1D1CF]/60 bg-white">
              <div className="relative">
                <Search className="w-3 h-3 text-[#888884] absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter keys..."
                  className="w-full pl-6 pr-6 py-1 text-[10px] font-mono bg-[#F4F4F2] border border-[#D1D1CF] outline-none focus:border-[#1A1A1A] rounded-none text-[#1A1A1A]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888884] hover:text-[#1A1A1A]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Keys List Container */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1">
            {/* Option 1: Default Environment Key */}
            <button
              type="button"
              onClick={handleSelectDefaultEnvKey}
              className={`w-full p-2 border text-left transition-all cursor-pointer flex items-center justify-between group ${
                !customApiKey
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "bg-white hover:bg-[#F4F4F2] text-[#1A1A1A] border-[#D1D1CF]"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-sans">
                    Default System Key
                  </span>
                  <span
                    className={`text-[8px] font-mono font-bold px-1 py-0.2 border ${
                      !customApiKey
                        ? "bg-stone-800 text-stone-200 border-stone-600"
                        : "bg-stone-100 text-stone-500 border-stone-300"
                    }`}
                  >
                    ENV
                  </span>
                </div>
                <span
                  className={`text-[8.5px] font-mono ${
                    !customApiKey ? "text-stone-300" : "text-[#888884]"
                  }`}
                >
                  process.env.GEMINI_API_KEY
                </span>
              </div>
              {!customApiKey && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
            </button>

            {/* Custom Vault Keys List */}
            {filteredKeys.length > 0 && (
              <div className="mt-1 flex flex-col gap-1">
                <div className="px-1 text-[8px] font-mono font-bold uppercase text-[#888884] tracking-wider">
                  Vault Keys ({filteredKeys.length})
                </div>
                {filteredKeys.map((item) => {
                  const isActive = customApiKey === item.key || activeKeyId === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleSelectCustomKey(item)}
                      className={`w-full p-2 border text-left transition-all cursor-pointer flex items-center justify-between group ${
                        isActive
                          ? "bg-emerald-950 text-white border-emerald-900"
                          : "bg-white hover:bg-emerald-50/60 text-[#1A1A1A] border-[#D1D1CF]"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[10px] font-bold uppercase tracking-wider font-sans truncate">
                            {item.label}
                          </span>
                          {isActive && (
                            <span className="text-[8px] bg-emerald-500 text-white font-mono font-black px-1 py-0.2 shrink-0">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[8.5px] font-mono tracking-widest ${
                            isActive ? "text-emerald-200" : "text-[#888884]"
                          }`}
                        >
                          {maskKey(item.key)}
                        </span>
                      </div>

                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
