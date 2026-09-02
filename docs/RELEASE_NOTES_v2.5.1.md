## v2.5.1: Next-Gen Flash & Promotional Rates

**PromptLab v2.5.1** introduces native support for Google's newly unveiled **Gemini 3.8 Flash** (`gemini-3.8-flash`), establishing it as the new default model across the entire workspace. In addition, this release integrates Google's **introductory promotional pricing** across the Gemini Flash series (3.8, 3.7, and 3.6 Flash) through December 31, 2026, cutting input and output token costs in half across all real-time cost estimations, itemized breakdown popovers, and model selector cards.

---

### ✨ Highlights

#### ⚡ Gemini 3.8 Flash Default Baseline

Gemini 3.8 Flash is Google's most intelligent Flash model to date, engineered for long-horizon software engineering, autonomous agents, and complex enterprise workflows with a 1,048,576 token context window and March 2026 knowledge cutoff. PromptLab adopts Gemini 3.8 Flash as the primary default engine across the application:

- 🚀 **Default Workspace Engine** — `gemini-3.8-flash` is now the initial selected model in the workspace state (`app/page.tsx`), the server-side proxy fallback (`app/api/generate/route.ts`), and the Engine Controls reset-to-defaults baseline (`components/EngineControlsModal.tsx`).
- 🔗 **Latest Alias Resolution** — `MODEL_ALIASES["gemini-flash-latest"]` in `lib/pricing.ts` now resolves directly to `gemini-3.8-flash`.
- 🎛️ **Quick Model Selector** — the Flash Latest option in `components/QuickModelSelector.tsx` now displays a **`3.8`** badge, and the active status indicator maps `gemini-3.8-flash` to `"3.8 Flash"`.
- 🏷️ **Specific Models Catalog** — added `gemini-3.8-flash` to the top of `SPECIFIC_MODELS` with a green `NEW` badge, `Mar 2026` cutoff, and `Sep 2, 2026` release date.
- 🎥 **Agentic Video Understanding** — `lib/video-utils.ts` (`isAgenticVideoSupported`) now supports `gemini-3.8-flash`, enabling autonomous timeline exploration (`Think → Act → Observe`) with dynamic frame extraction on the new model.

---

#### 🏷️ Introductory Promotional Pricing (Flash Series)

Google is offering promotional introductory rates for **Gemini 3.8 Flash**, **Gemini 3.7 Flash**, and **Gemini 3.6 Flash** effective through **December 31, 2026**:

| Metric | Introductory Promotional Rate (Through Dec 31, 2026) | Standard Rate (Starting Jan 1, 2027) |
|---|---|---|
| **Input Tokens** | **$0.75** / 1,000,000 tokens | $1.50 / 1,000,000 tokens |
| **Output Tokens** (incl. thoughts) | **$3.75** / 1,000,000 tokens | $7.50 / 1,000,000 tokens |
| **Context Cache Base** | **$0.075** / 1,000,000 tokens | $0.15 / 1,000,000 tokens |
| **Context Cache Storage** | **$0.50** / 1,000,000 tokens / hour | $1.00 / 1,000,000 tokens / hour |

PromptLab's central pricing engine in `lib/pricing.ts` automatically reflects these rates:
- **UI Rate Badges**: Model cards in `EngineControlsModal` display `IN: $0.75 / 1M` and `OUT: $3.75 / 1M`.
- **Itemized Cost Breakdown**: The Retro Lab brutalist cost popover in `GenerationResultView` computes exact line-by-line costs for uncached prompt tokens, cached prompt tokens, candidate tokens, and thought tokens using the promotional rates.
- **Historical Stability**: Generations saved during this period store their calculated cost string at generation time, keeping archival cost records stable.

---

### ✨ What's New

- ⚡ **Gemini 3.8 Flash Model Integration** — added `gemini-3.8-flash` to `MODEL_PRICING_TABLE`, `MODEL_ALIASES`, `SPECIFIC_MODELS`, and `LATEST_MODELS`.
- 🏷️ **Introductory Pricing for Flash Models** — updated pricing configurations for Gemini 3.8 Flash, 3.7 Flash, and 3.6 Flash to $0.75 / 1M in and $3.75 / 1M out.
- 🎥 **Agentic Video Understanding on 3.8 Flash** — updated `isAgenticVideoSupported` in `lib/video-utils.ts` and tooltips in `VideoAssetCard.tsx`.
- 🎛️ **Quick Model Selector 3.8 Badge** — updated top navigation dropdown badge for Flash to `3.8` with `3.8 Flash` label mapping.
- 🏷️ **Dynamic Version Display** — footer status bar displays `PromptLab v2.5.1 by Taruma Sakti` automatically from `package.json`.

---

### 🔄 Changed

- **Default Model**: Swapped default workspace model from `gemini-3.7-flash` to `gemini-3.8-flash` across `app/page.tsx`, `app/api/generate/route.ts`, and `EngineControlsModal.tsx`.
- **Cost Estimation Fallbacks**: Updated fallback model parameter in `HistoryCardSummary.tsx` and `HistoryViewerModal.tsx` from `gemini-3.7-flash` to `gemini-3.8-flash`.
- **Model Badges**: Marked `gemini-3.8-flash` as `isNew: true` and updated `gemini-3.7-flash` to `isNew: false` in `SPECIFIC_MODELS`.
- **Documentation**: Synchronized baseline references in `AGENTS.md` and engine feature lists in `README.md`.

---

### 📁 Files Affected

- `package.json` & `package-lock.json` — version bump to `2.5.1`
- `lib/pricing.ts` — added `gemini-3.8-flash`, updated `gemini-flash-latest` alias, and applied promotional rates to 3.8, 3.7, and 3.6 Flash
- `lib/video-utils.ts` — added `gemini-3.8-flash` to `isAgenticVideoSupported`
- `app/page.tsx` — updated `selectedModel` initial state to `gemini-3.8-flash`
- `app/api/generate/route.ts` — updated fallback model to `gemini-3.8-flash`
- `components/EngineControlsModal.tsx` — added 3.8 Flash to specific models, updated latest model subtitle, and reset defaults handler
- `components/QuickModelSelector.tsx` — updated Flash badge to 3.8 and added label mapping
- `components/VideoAssetCard.tsx` — updated agentic mode tooltips
- `components/HistoryCardSummary.tsx` & `components/HistoryViewerModal.tsx` — updated cost calculation fallback model
- `CHANGELOG.md` — added `[v2.5.1]` release entry
- `AGENTS.md` & `README.md` — synchronized model baseline and documentation
