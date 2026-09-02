/**
 * PromptLab Model Pricing Configuration & Cost Estimation Utility
 * 
 * Rates are specified in USD per 1 Million (1,000,000) tokens.
 * This file is designed for easy maintenance when pricing structures or model rates change.
 */

export interface PricingTierRate {
  /** Maximum token count threshold for this tier (Infinity for top tier) */
  maxTokens: number;
  /** Price in USD per 1,000,000 input tokens */
  inputPricePer1M: number;
  /** Price in USD per 1,000,000 output tokens (includes reasoning/thoughts) */
  outputPricePer1M: number;
  /** Price in USD per 1,000,000 base context cached tokens */
  contextCacheBasePricePer1M: number;
}

export interface ModelPricingConfig {
  /** Display name of the model */
  name: string;
  /** Standard non-tiered rate, or null if using tiered pricing */
  rate?: {
    /** Input price per 1M tokens (text/default) */
    inputPricePer1M: number;
    /** Output price per 1M tokens (includes reasoning/thoughts) */
    outputPricePer1M: number;
    /** Base context caching price per 1M tokens */
    contextCacheBasePricePer1M: number;
    /** Storage price per 1M cached tokens per hour in USD */
    contextCacheStoragePricePerHourPer1M: number;
    /** Audio input price per 1M tokens if applicable */
    audioInputPricePer1M?: number;
    /** Audio context cache base price per 1M tokens if applicable */
    audioContextCacheBasePricePer1M?: number;
  };
  /** Tiered rates if model has volume-based pricing steps (e.g. <= 200k vs > 200k) */
  tiers?: PricingTierRate[];
  /** Storage price per 1M cached tokens per hour in USD (for tiered models) */
  contextCacheStoragePricePerHourPer1M?: number;
}

/**
 * Model Alias mapping table (maps alias ID to canonical model ID)
 */
export const MODEL_ALIASES: Record<string, string> = {
  "gemini-flash-latest": "gemini-3.8-flash",
  "gemini-flash-lite-latest": "gemini-3.5-flash-lite",
  "gemini-pro-latest": "gemini-3.1-pro-preview",
};

/**
 * Central Model Pricing Table
 * Rates in USD per 1,000,000 tokens
 */
export const MODEL_PRICING_TABLE: Record<string, ModelPricingConfig> = {
  "gemini-3.8-flash": {
    name: "Gemini 3.8 Flash",
    rate: {
      // Introductory promotional pricing through Dec 31, 2026 (standard rates $1.50 in / $7.50 out starting Jan 1, 2027)
      inputPricePer1M: 0.75,
      outputPricePer1M: 3.75,
      contextCacheBasePricePer1M: 0.075,
      contextCacheStoragePricePerHourPer1M: 0.50,
    },
  },
  "gemini-3.7-flash": {
    name: "Gemini 3.7 Flash",
    rate: {
      // Introductory promotional pricing through Dec 31, 2026 (standard rates $1.50 in / $7.50 out starting Jan 1, 2027)
      inputPricePer1M: 0.75,
      outputPricePer1M: 3.75,
      contextCacheBasePricePer1M: 0.075,
      contextCacheStoragePricePerHourPer1M: 0.50,
    },
  },
  "gemini-3.6-flash": {
    name: "Gemini 3.6 Flash",
    rate: {
      // Introductory promotional pricing through Dec 31, 2026 (standard rates $1.50 in / $7.50 out starting Jan 1, 2027)
      inputPricePer1M: 0.75,
      outputPricePer1M: 3.75,
      contextCacheBasePricePer1M: 0.075,
      contextCacheStoragePricePerHourPer1M: 0.50,
    },
  },
  "gemini-3.5-flash": {
    name: "Gemini 3.5 Flash",
    rate: {
      inputPricePer1M: 1.50,
      outputPricePer1M: 9.00,
      contextCacheBasePricePer1M: 0.15,
      contextCacheStoragePricePerHourPer1M: 1.00,
    },
  },
  "gemini-3.5-flash-lite": {
    name: "Gemini 3.5 Flash-Lite",
    rate: {
      inputPricePer1M: 0.30,
      outputPricePer1M: 2.50,
      contextCacheBasePricePer1M: 0.03,
      contextCacheStoragePricePerHourPer1M: 1.00,
    },
  },
  "gemini-3.1-pro-preview": {
    name: "Gemini 3.1 Pro Preview",
    contextCacheStoragePricePerHourPer1M: 4.50,
    tiers: [
      {
        maxTokens: 200_000,
        inputPricePer1M: 2.00,
        outputPricePer1M: 12.00,
        contextCacheBasePricePer1M: 0.20,
      },
      {
        maxTokens: Infinity,
        inputPricePer1M: 4.00,
        outputPricePer1M: 18.00,
        contextCacheBasePricePer1M: 0.40,
      },
    ],
  },
  "gemini-3.1-flash-lite": {
    name: "Gemini 3.1 Flash-Lite",
    rate: {
      inputPricePer1M: 0.25,
      outputPricePer1M: 1.50,
      contextCacheBasePricePer1M: 0.025,
      contextCacheStoragePricePerHourPer1M: 1.00,
      audioInputPricePer1M: 0.50,
      audioContextCacheBasePricePer1M: 0.05,
    },
  },
  "gemini-3-flash-preview": {
    name: "Gemini 3 Flash Preview",
    rate: {
      inputPricePer1M: 0.50,
      outputPricePer1M: 3.00,
      contextCacheBasePricePer1M: 0.050,
      contextCacheStoragePricePerHourPer1M: 1.00,
      audioInputPricePer1M: 1.00,
      audioContextCacheBasePricePer1M: 0.100,
    },
  },
};

export interface TokenUsageStats {
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
  cachedTokens?: number;
  thoughtTokens?: number;
}

export interface CostTokenBreakdown {
  uncachedPromptTokens: number;
  cachedTokens: number;
  candidateTokens: number;
  thoughtTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  inputPricePer1M: number;
  cachedBasePricePer1M: number;
  outputPricePer1M: number;
  uncachedInputCostUSD: number;
  cachedInputCostUSD: number;
  candidateCostUSD: number;
  thoughtCostUSD: number;
  totalOutputCostUSD: number;
  totalCostUSD: number;
  formattedUncachedInputCost: string;
  formattedCachedInputCost: string;
  formattedCandidateCost: string;
  formattedThoughtCost: string;
  formattedTotalOutputCost: string;
  formattedTotalCost: string;
  cacheSavingsUSD: number;
  formattedCacheSavings: string;
}

export interface EstimatedCostResult {
  modelId: string;
  canonicalModelId: string;
  modelName: string;
  inputCostUSD: number;
  outputCostUSD: number;
  cachedInputCostUSD: number;
  totalCostUSD: number;
  formattedTotalCost: string;
  isAudio?: boolean;
  breakdown?: CostTokenBreakdown;
}

/**
 * Format USD amounts to 6 decimals, with sub-micro and zero safeguards
 */
export function formatCostUSD(cost: number): string {
  if (cost < 0.000001 && cost > 0) {
    return "< $0.000001";
  } else if (cost <= 0) {
    return "$0.000000";
  }
  return `$${cost.toFixed(6)}`;
}

/**
 * Resolves a model ID or alias to its canonical model pricing ID
 */
export function getCanonicalModelId(modelId: string): string {
  const cleanId = modelId.replace(/^models\//, "");
  return MODEL_ALIASES[cleanId] || cleanId;
}

/**
 * Calculates estimated cost for a given token usage breakdown and model ID
 *
 * Formula:
 * - Uncached Input Cost = (Prompt Tokens - Cached Tokens) / 1,000,000 * Input Rate
 * - Cached Input Base Cost = Cached Tokens / 1,000,000 * Cached Rate
 * - Output Cost = Output Tokens (Candidates Tokens + Thought Tokens) / 1,000,000 * Output Rate
 * - Total Cost = Uncached Input Cost + Cached Input Base Cost + Output Cost
 */
export function calculateEstimatedCost(
  modelId: string,
  usage: TokenUsageStats,
  options?: { isAudio?: boolean }
): EstimatedCostResult | null {
  const canonicalId = getCanonicalModelId(modelId);
  const config = MODEL_PRICING_TABLE[canonicalId];

  if (!config) {
    return null;
  }

  const promptTokens = usage.promptTokens ?? 0;
  const reportedCandidateTokens = usage.candidatesTokens ?? 0;
  
  // Explicit or derived thought tokens
  const derivedThoughtTokens = usage.thoughtTokens !== undefined
    ? usage.thoughtTokens
    : (usage.totalTokens && usage.promptTokens !== undefined
      ? Math.max(0, usage.totalTokens - usage.promptTokens - reportedCandidateTokens)
      : 0);

  // Total Output Tokens includes both candidate text tokens and internal thinking/reasoning tokens
  const computedTotalOutputTokens = usage.totalTokens && usage.promptTokens !== undefined
    ? Math.max(reportedCandidateTokens, usage.totalTokens - usage.promptTokens)
    : (reportedCandidateTokens + derivedThoughtTokens);
    
  const outputTokens = computedTotalOutputTokens;
  const cachedTokens = usage.cachedTokens ?? 0;
  const uncachedPromptTokens = Math.max(0, promptTokens - cachedTokens);
  const totalTokens = usage.totalTokens ?? (promptTokens + outputTokens);

  let inputPricePer1M = 0;
  let outputPricePer1M = 0;
  let cachedBasePricePer1M = 0;

  if (config.tiers && config.tiers.length > 0) {
    // Select tier based on total input prompt tokens length
    const totalInput = promptTokens > 0 ? promptTokens : totalTokens;
    const applicableTier = config.tiers.find((tier) => totalInput <= tier.maxTokens) || config.tiers[config.tiers.length - 1];
    inputPricePer1M = applicableTier.inputPricePer1M;
    outputPricePer1M = applicableTier.outputPricePer1M;
    cachedBasePricePer1M = applicableTier.contextCacheBasePricePer1M;
  } else if (config.rate) {
    const isAudio = options?.isAudio ?? false;
    inputPricePer1M = isAudio && config.rate.audioInputPricePer1M !== undefined
      ? config.rate.audioInputPricePer1M
      : config.rate.inputPricePer1M;
    outputPricePer1M = config.rate.outputPricePer1M;
    cachedBasePricePer1M = isAudio && config.rate.audioContextCacheBasePricePer1M !== undefined
      ? config.rate.audioContextCacheBasePricePer1M
      : config.rate.contextCacheBasePricePer1M;
  }

  const uncachedInputCostUSD = (uncachedPromptTokens / 1_000_000) * inputPricePer1M;
  const cachedInputCostUSD = (cachedTokens / 1_000_000) * cachedBasePricePer1M;
  const candidateCostUSD = (reportedCandidateTokens / 1_000_000) * outputPricePer1M;
  const thoughtCostUSD = (derivedThoughtTokens / 1_000_000) * outputPricePer1M;
  const outputCostUSD = (outputTokens / 1_000_000) * outputPricePer1M;

  const totalCostUSD = uncachedInputCostUSD + cachedInputCostUSD + outputCostUSD;

  // Cache savings: cost at standard input rate minus actual cached cost
  const standardCacheCost = (cachedTokens / 1_000_000) * inputPricePer1M;
  const cacheSavingsUSD = Math.max(0, standardCacheCost - cachedInputCostUSD);

  const formattedTotalCost = formatCostUSD(totalCostUSD);

  const breakdown: CostTokenBreakdown = {
    uncachedPromptTokens,
    cachedTokens,
    candidateTokens: reportedCandidateTokens,
    thoughtTokens: derivedThoughtTokens,
    totalOutputTokens: outputTokens,
    totalTokens,
    inputPricePer1M,
    cachedBasePricePer1M,
    outputPricePer1M,
    uncachedInputCostUSD,
    cachedInputCostUSD,
    candidateCostUSD,
    thoughtCostUSD,
    totalOutputCostUSD: outputCostUSD,
    totalCostUSD,
    formattedUncachedInputCost: formatCostUSD(uncachedInputCostUSD),
    formattedCachedInputCost: formatCostUSD(cachedInputCostUSD),
    formattedCandidateCost: formatCostUSD(candidateCostUSD),
    formattedThoughtCost: formatCostUSD(thoughtCostUSD),
    formattedTotalOutputCost: formatCostUSD(outputCostUSD),
    formattedTotalCost,
    cacheSavingsUSD,
    formattedCacheSavings: formatCostUSD(cacheSavingsUSD),
  };

  return {
    modelId,
    canonicalModelId: canonicalId,
    modelName: config.name,
    inputCostUSD: uncachedInputCostUSD,
    outputCostUSD,
    cachedInputCostUSD,
    totalCostUSD,
    formattedTotalCost,
    isAudio: options?.isAudio,
    breakdown,
  };
}

export interface PricingSummary {
  inputRate: string;
  outputRate: string;
}

/**
 * Returns formatted input/output pricing rate summary for display in UI model cards
 */
export function getModelPricingSummary(modelId: string): PricingSummary | null {
  const canonicalId = getCanonicalModelId(modelId);
  const config = MODEL_PRICING_TABLE[canonicalId];
  if (!config) return null;

  if (config.tiers && config.tiers.length > 0) {
    const minTier = config.tiers[0];
    const maxTier = config.tiers[config.tiers.length - 1];
    if (minTier === maxTier) {
      return {
        inputRate: `$${minTier.inputPricePer1M.toFixed(2)} / 1M`,
        outputRate: `$${minTier.outputPricePer1M.toFixed(2)} / 1M`,
      };
    } else {
      return {
        inputRate: `$${minTier.inputPricePer1M.toFixed(2)}–$${maxTier.inputPricePer1M.toFixed(2)} / 1M`,
        outputRate: `$${minTier.outputPricePer1M.toFixed(2)}–$${maxTier.outputPricePer1M.toFixed(2)} / 1M`,
      };
    }
  }

  if (config.rate) {
    return {
      inputRate: `$${config.rate.inputPricePer1M.toFixed(2)} / 1M`,
      outputRate: `$${config.rate.outputPricePer1M.toFixed(2)} / 1M`,
    };
  }

  return null;
}
