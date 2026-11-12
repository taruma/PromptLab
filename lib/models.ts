/**
 * PromptLab Central Model Registry, Alias Resolution & Capability Governance
 *
 * Single source of truth for model capabilities across client UI controls
 * and server-side Gemini API request construction.
 */

export type ThinkingEffortLevel = "XHIGH" | "HIGH" | "MEDIUM" | "LOW" | "MINIMAL";

export const ALL_THINKING_LEVELS: ThinkingEffortLevel[] = [
  "XHIGH",
  "HIGH",
  "MEDIUM",
  "LOW",
  "MINIMAL",
];

export const DEFAULT_MODEL_ID = "gemini-4-hydrogen";
export const DEFAULT_THINKING_LEVEL: ThinkingEffortLevel = "HIGH";

/**
 * Model Alias mapping table (maps alias ID to canonical model ID)
 */
export const MODEL_ALIASES: Record<string, string> = {
  "gemini-flash-latest": "gemini-3.8-flash",
  "gemini-flash-lite-latest": "gemini-3.5-flash-lite",
  "gemini-pro-latest": "gemini-4-argon",
};

export interface ModelCapabilities {
  id: string;
  name: string;
  briefLabel: string;
  isPaid: boolean;
  supportsTemperature: boolean;
  supportsAgenticVideo: boolean;
  supportedThinkingLevels: ThinkingEffortLevel[];
  defaultThinkingLevel: ThinkingEffortLevel;
}

const MODEL_CAPABILITY_REGISTRY: Record<string, ModelCapabilities> = {
  "gemini-4-hydrogen": {
    id: "gemini-4-hydrogen",
    name: "Gemini 4 Hydrogen",
    briefLabel: "4 Hydrogen",
    isPaid: false,
    supportsTemperature: false,
    supportsAgenticVideo: true,
    supportedThinkingLevels: ["XHIGH", "HIGH", "MEDIUM", "LOW"],
    defaultThinkingLevel: "HIGH",
  },
  "gemini-4-carbon": {
    id: "gemini-4-carbon",
    name: "Gemini 4 Carbon",
    briefLabel: "4 Carbon",
    isPaid: true,
    supportsTemperature: false,
    supportsAgenticVideo: true,
    supportedThinkingLevels: ["HIGH", "MEDIUM", "LOW"],
    defaultThinkingLevel: "MEDIUM",
  },
  "gemini-4-argon": {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    briefLabel: "4 Argon",
    isPaid: true,
    supportsTemperature: false,
    supportsAgenticVideo: true,
    supportedThinkingLevels: ["HIGH", "MEDIUM", "LOW"],
    defaultThinkingLevel: "MEDIUM",
  },
  "gemini-3.8-flash": {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    briefLabel: "3.8 Flash",
    isPaid: false,
    supportsTemperature: true,
    supportsAgenticVideo: true,
    supportedThinkingLevels: ["HIGH", "MEDIUM", "LOW", "MINIMAL"],
    defaultThinkingLevel: "MEDIUM",
  },
  "gemini-3.6-flash": {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    briefLabel: "3.6 Flash",
    isPaid: false,
    supportsTemperature: true,
    supportsAgenticVideo: true,
    supportedThinkingLevels: ["HIGH", "MEDIUM", "LOW", "MINIMAL"],
    defaultThinkingLevel: "MEDIUM",
  },
  "gemini-3.5-flash-lite": {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    briefLabel: "3.5 Flash Lite",
    isPaid: false,
    supportsTemperature: true,
    supportsAgenticVideo: true,
    supportedThinkingLevels: ["HIGH", "MEDIUM", "LOW", "MINIMAL"],
    defaultThinkingLevel: "MEDIUM",
  },
  "gemini-3.1-flash-lite": {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    briefLabel: "3.1 Flash Lite",
    isPaid: false,
    supportsTemperature: true,
    supportsAgenticVideo: false,
    supportedThinkingLevels: ["HIGH", "MEDIUM", "LOW", "MINIMAL"],
    defaultThinkingLevel: "MEDIUM",
  },
  "gemini-3.1-pro-preview": {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro Preview",
    briefLabel: "3.1 Pro",
    isPaid: true,
    supportsTemperature: true,
    supportsAgenticVideo: false,
    supportedThinkingLevels: ["HIGH", "MEDIUM", "LOW"],
    defaultThinkingLevel: "HIGH",
  },
};

/**
 * Resolves a model ID or alias to its canonical model ID
 */
export function getCanonicalModelId(modelId: string): string {
  const cleanId = modelId.replace(/^models\//, "");
  return MODEL_ALIASES[cleanId] || cleanId;
}

/**
 * Returns the capability profile for any model ID or alias
 */
export function getModelCapabilities(modelId?: string): ModelCapabilities {
  const rawId = modelId || DEFAULT_MODEL_ID;
  const canonicalId = getCanonicalModelId(rawId);

  if (MODEL_CAPABILITY_REGISTRY[canonicalId]) {
    return MODEL_CAPABILITY_REGISTRY[canonicalId];
  }

  const lower = canonicalId.toLowerCase();
  const isGemini4 = lower.startsWith("gemini-4");
  const isPro = lower.includes("pro") || lower.includes("argon") || lower.includes("carbon");

  if (isGemini4) {
    const isHydrogen = lower.includes("hydrogen");
    return {
      id: canonicalId,
      name: canonicalId,
      briefLabel: canonicalId.replace(/^gemini-/i, ""),
      isPaid: !isHydrogen,
      supportsTemperature: false,
      supportsAgenticVideo: true,
      supportedThinkingLevels: isHydrogen
        ? ["XHIGH", "HIGH", "MEDIUM", "LOW"]
        : ["HIGH", "MEDIUM", "LOW"],
      defaultThinkingLevel: isHydrogen ? "HIGH" : "MEDIUM",
    };
  }

  return {
    id: canonicalId,
    name: canonicalId,
    briefLabel: canonicalId.replace(/^gemini-/i, ""),
    isPaid: isPro,
    supportsTemperature: true,
    supportsAgenticVideo: false,
    supportedThinkingLevels: isPro
      ? ["HIGH", "MEDIUM", "LOW"]
      : ["HIGH", "MEDIUM", "LOW", "MINIMAL"],
    defaultThinkingLevel: isPro ? "HIGH" : "MEDIUM",
  };
}

export function isPaidModel(modelId?: string): boolean {
  return getModelCapabilities(modelId).isPaid;
}

export function supportsTemperature(modelId?: string): boolean {
  return getModelCapabilities(modelId).supportsTemperature;
}

export function isThinkingLevelSupported(modelId: string | undefined, level: string): boolean {
  const caps = getModelCapabilities(modelId);
  return caps.supportedThinkingLevels.includes(level as ThinkingEffortLevel);
}

/**
 * Clamps or normalizes a thinking level to a value supported by the target model.
 * If the current level is unsupported (e.g., MINIMAL on Gemini 4 or XHIGH on non-Hydrogen),
 * returns the model's safe default thinking level.
 */
export function normalizeThinkingLevel(
  modelId: string | undefined,
  currentLevel?: string
): ThinkingEffortLevel {
  const caps = getModelCapabilities(modelId);
  if (currentLevel && caps.supportedThinkingLevels.includes(currentLevel as ThinkingEffortLevel)) {
    return currentLevel as ThinkingEffortLevel;
  }
  return caps.defaultThinkingLevel;
}

/**
 * Returns a concise UI label for headers, tooltips, and status indicators
 */
export function getBriefModelLabel(modelId: string): string {
  switch (modelId) {
    case "gemini-flash-latest":
      return "Flash Latest";
    case "gemini-flash-lite-latest":
      return "Flash Lite Latest";
    case "gemini-pro-latest":
      return "Pro Latest";
    default: {
      const cleanId = modelId.replace(/^models\//, "");
      if (MODEL_CAPABILITY_REGISTRY[cleanId]) {
        return MODEL_CAPABILITY_REGISTRY[cleanId].briefLabel;
      }
      return cleanId.replace(/^gemini-/i, "");
    }
  }
}
