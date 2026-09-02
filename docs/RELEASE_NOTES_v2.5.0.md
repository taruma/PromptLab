## v2.5.0: Explore. Structure. Deduplicate.

**PromptLab v2.5.0** transforms the playground into a full-fledged multimodal lab. This release introduces Google's **Agentic Video Understanding** with autonomous timeline exploration, sets **Gemini 3.7 Flash** as the default system baseline, and expands casting references beyond images and video to include **Audio (`@audioN`)** with a dedicated player modal and **Documents (`@docN`)** up to 2 GB via Files API. On the output side, PromptLab introduces **Guaranteed Structured JSON Output** with live schema validation and a syntax-highlighted 3-mode viewer, alongside an **Itemized Cost Breakdown Popover** detailing uncached prompt, context cache savings, output, and thought tokens. Under the hood, an **IndexedDB v3** architecture with SHA-256 content-hash deduplication and an automatic legacy LocalStorage purge eliminates browser storage quota crashes, supported by an interactive **Storage & Quota Monitor Modal** and **Asset Library power tools** (pinning, favoriting, select mode, and shared project tracking).

---

### ✨ Highlights

#### 🎥 Agentic Video Understanding (`MediaProcessing.AGENTIC`)

PromptLab natively supports Google's **Agentic Video Understanding** for Gemini 3.7 Flash models, enabling autonomous timeline exploration (`Think → Act → Observe`) with dynamic frame extraction and significantly lower token/API costs for longer video assets compared to brute-force sampling.

- 🎚️ **Segmented Mode Toggle** — each `VideoAssetCard` features an Analog Brutalist segmented toggle between **`STATIC`** (standard 1 FPS fixed-rate frame sampling, default) and **`AGENTIC`** (model-driven dynamic timeline navigation).
- 🛡️ **Option A Non-Destructive Fallback** — switching to a model that does not yet support agentic video (such as Gemini 3.1 Pro Preview / Gemini Pro Latest) preserves your `AGENTIC` preference in workspace memory, renders a dashed amber `Paused` status tag on the video card, and automatically executes a safe `STATIC` fallback on the backend without discarding user intent.
- 📺 **YouTube Video MIME Typing** — YouTube references passed via `fileData` now include explicit `mimeType: "video/mp4"` transmission in `app/api/generate/route.ts`.
- 💾 **Cross-Surface Persistence** — `processingMode` persists across workspace session state, generation history archives, and JSON backup export/import schemas (`lib/history-export.ts`).

#### ⚡ Gemini 3.7 Flash & Quick Header Switchers

Gemini 3.7 Flash (`gemini-3.7-flash`) is now the default model across PromptLab, paired with streamlined quick-switching controls in the top navigation bar.

- 🚀 **Default System Baseline** — updated workspace defaults to Gemini 3.7 Flash with `MEDIUM` reasoning effort and 1.0 temperature.
- 🎛️ **Quick Model & Thinking Switcher (`QuickModelSelector`)** — an icon button in `AppHeader.tsx` opens a compact 4-row control panel:
  - **Row 1 (Status)**: Active model and thinking level indicator (`Flash Latest • MEDIUM`).
  - **Row 2 (Model)**: Rapid alias switching (`Flash`, `Flash Lite`, `Pro`) with automatic version badges.
  - **Row 3 (Thinking)**: Reasoning effort levels (`HIGH`, `MEDIUM`, `LOW`, `MIN`), automatically disabling `MIN` for Pro models.
  - **Row 4 (Structured Output)**: One-click toggle for Structured JSON generation.
- 🔑 **Quick API Key Switcher (`QuickApiKeySelector`)** — instant switching between the Default System Key and custom Vault keys, featuring a `BYOK` (Bring Your Own Key) status badge, key count badge, masked string preview, and multi-tab synchronization.

#### 📑 Multimodal Casting: Audio (`@audioN`) & Documents (`@docN`)

Multi-modal reference handling now extends beyond visual media. The generation pipeline parses MIME types and emits dedicated casting tags across prompts and history:

- 🎵 **Audio Reference Tags (`@audioN`)** — Files API audio assets (`audio/*` formats: MP3, WAV, OGG, M4A, FLAC) map to `@audio1`, `@audio2`, etc., in `{{ visual_references }}`.
- 🎧 **Dedicated Audio Player Modal (`AudioPlayerModal`)** — custom audio preview dialog with HTML5 controls, volume slider, playback scrubber, and MIME type metadata.
- 📄 **Document Reference Tags (`@docN`)** — PDFs, text files, CSV, JSON, Markdown, and source code files map to `@doc1`, `@doc2`, etc., in `{{ visual_references }}`.
- 🏷️ **Workspace File Picker & Badges** — file picker accepts `image/*,video/*,audio/*,application/pdf,text/*` up to 2 GB. `VideoAssetCard` renders purple theme + music icons for audio and teal theme + document icons for text/PDF documents. History cards display separate `AUD` (purple) and `DOC` (teal) badges.

#### 💰 Itemized Cost Breakdown Popover & Streaming Cost Finalization

A complete overhaul of generation cost accounting provides granular transparency for complex multimodal and high-reasoning workloads:

- ⏱️ **Streaming Cost Finalization** — the emerald cost badge remains hidden during active generation (`isLoading === true`), rendering verified final costs immediately upon completion to avoid misleading intermediate numbers.
- 🧾 **Interactive Breakdown Popover** — hovering or tapping the cost badge in `GenerationResultView` opens a Retro Lab brutalist popover displaying line-by-line itemized calculations:
  - **Prompt Input (Uncached)**: Token count $\times$ input rate per 1M $\rightarrow$ subtotal.
  - **Context Cache**: Cached token count $\times$ discounted base rate per 1M $\rightarrow$ subtotal, with a highlighted `Saved $X.XXXXXX` badge.
  - **Output Response**: Candidate text tokens $\times$ output rate per 1M $\rightarrow$ subtotal.
  - **Reasoning Thoughts**: Thought tokens $\times$ output rate per 1M $\rightarrow$ subtotal.
  - **Total Estimated**: Aggregate token count and final USD cost.
- 🧠 **Server-Side Thought Tokens Capture** — `thoughtsTokenCount` is captured directly from Gemini API `usageMetadata` and streamed to the client, visibly balancing total tokens: `TOKENS: {total} ({prompt} IN [{cached} CACHED] / {candidates} OUT + {thoughts} THOUGHTS)`.
- 🔄 **Backward-Compatible Thought Token Fallback** — `lib/pricing.ts` derives thought tokens via $\max(0, \text{total} - \text{prompt} - \text{candidates})$ for legacy history records.

#### 🧩 Structured JSON Output & Syntax-Highlighted JSON Viewer

Enforce deterministic, machine-parseable JSON generation with integrated schema validation and dedicated rendering:

- 🔒 **Server-Side JSON Schema Enforcement** — `/api/generate` accepts `responseMimeType: "application/json"` and an optional `responseSchema`, attaching them directly to the Gemini API generation config.
- 📝 **Live JSON Schema Editor** — `EngineControlsModal` provides an expandable JSON Schema textarea with real-time syntax validation (emerald `Valid Schema` vs. red `Syntax Error` badge with error tooltips) and starter schema templates.
- 🎨 **3-Mode Output Renderer with Syntax-Highlighted JSON View** — `GenerationResultView` adds a dedicated JSON View featuring:
  - Markdown code-fence stripping and parse fallback with an amber `Raw / Unparsed JSON` badge.
  - Per-token syntax highlighting: keys (bold charcoal), strings (teal), booleans (indigo), null (stone italic), numbers (amber), and delimiters (warm gray).
  - Line numbers, row hover highlights, and auto-lock state (`STRUCTURED JSON (LOCKED)`).
- 🟢 **Pulsing Footer Status** — emerald `JSON OUTPUT` badge (`bg-emerald-950/70 border border-emerald-500/50 text-emerald-400`) illuminates in the status bar whenever structured output is active.

#### 🗄️ IndexedDB v3 Schema, Content-Hash Deduplication & Quota Guard

Solves browser storage quota limits (`QuotaExceededError`) by decoupling image payloads, purging legacy LocalStorage bloat, and monitoring storage health:

- 🗃️ **IndexedDB v3 Schema & SHA-256 Content Hashing** — `promptlab_db` v3 indexes images by `contentHash`. Identical images store lightweight reference pointers (`dedupRefId`), eliminating duplicate base64 payloads across workspaces, asset libraries, and history.
- 🔗 **Reference-Safe Deletion & Promotion** — deleting a master image record automatically promotes the first dependent record to master and repoints references, preventing broken images.
- 🛡️ **Cross-Project Reference Protection** — `deleteStoredImage()` verifies whether an image is referenced by any other project's library or history before deleting binary data.
- 🧹 **Legacy LocalStorage Purge** — migrates history records from `localStorage` into IndexedDB on launch, immediately freeing up **~4.1 MB** of origin quota (dropping usage from 90%+ down to safe levels).
- 📊 **Storage & Quota Monitor Modal (`StorageUsageModal`)** — real-time diagnostic modal displaying LocalStorage usage percentage, standard 5 MB quota bar, key-by-key breakdown table, and IndexedDB origin quota via `navigator.storage.estimate()`.
- 📈 **Interactive Footer Usage Badge** — auto-refreshing storage indicator in `FooterStatusBar` pulses red when usage reaches 80% and opens the storage modal on click.

#### 📌 Asset Library Power Tools — Pinning, Favoriting & Select Mode

The persistent Asset Library received major workflow and safety upgrades:

- 📌 **Pinning & Favoriting** — pin important reference images to the top (📌) or mark them as favorites (★) with amber highlights and dedicated filter tabs (`All`, `Pinned`, `Favs`).
- ☑️ **Select Mode & Bulk Operations** — toggleable selection mode with `Select All` / `Deselect All` for batch export and deletion.
- 🛡️ **Two-Step Deletion Safety** — clicking delete transforms the button into an inline 4-second auto-cancel confirmation state, eliminating accidental image deletions.
- 📥 **Drag-and-Drop JSON Restore** — drop `.json` asset library backup files directly into the library dropzone to preview, detect duplicates, and restore assets.
- 👥 **Shared Project Badges** — asset cards display badges showing the count of other projects sharing the asset, complete with project list tooltips.
- 📐 **Streamlined 2-Row Toolbar** — unified layout combining search, view toggles (`Grid` / `List`), select mode, filter tabs, and sorting without layout overflow.

---

### ✨ What's New

- 🎥 **Agentic Video Understanding** — `MediaProcessing.AGENTIC` support for Gemini 3.7 Flash with dynamic timeline exploration
- 🎚️ **Segmented Video Mode Toggle** — switch between `STATIC` (1 FPS) and `AGENTIC` modes directly on `VideoAssetCard`
- 🛡️ **Non-Destructive Model Fallback** — preserves `AGENTIC` mode preference with a `Paused` badge on unsupported models
- 📺 **YouTube Video MIME Typing** — transmits explicit `mimeType: "video/mp4"` for YouTube `fileData`
- ⚡ **Gemini 3.7 Flash Default** — default workspace model updated to `gemini-3.7-flash` with full pricing table integration
- 🎛️ **Quick Model & Thinking Switcher** — compact 4-row dropdown in header for instant model, thinking, and JSON control
- 🔑 **Quick API Key Switcher** — header dropdown for rapid switching between Default System Key and Vault keys with `BYOK` badge
- 🎵 **Audio Reference Tags (`@audioN`)** — Files API audio files map to `@audio1`, `@audio2`, etc., in prompt templates
- 🎧 **AudioPlayerModal** — dedicated audio preview dialog with custom HTML5 controls and metadata display
- 📄 **Document Reference Tags (`@docN`)** — PDF, text, CSV, JSON, and code files map to `@doc1`, `@doc2`, etc.
- 🏷️ **History Media Badges** — distinct `AUD` (purple) and `DOC` (teal) badges in history cards and viewers
- 💰 **Itemized Cost Breakdown Popover** — Retro Lab popover with subtotals for prompt, context cache savings, output, and thought tokens
- ⏱️ **Streaming Cost Finalization** — cost badge hidden during generation to guarantee calculation accuracy
- 🧠 **Thought Tokens Tracking** — server-side capture from `usageMetadata.thoughtsTokenCount` balancing total token counts
- 🧩 **Structured JSON Output** — guaranteed JSON generation via `responseMimeType: "application/json"` and `responseSchema`
- 📝 **Live JSON Schema Editor** — interactive schema textarea with real-time syntax validation badges and starter templates
- 🎨 **Syntax-Highlighted JSON Viewer** — per-token color coding (keys, strings, numbers, booleans, null) with line numbers
- 🔒 **JSON View Auto-Lock** — output panel auto-locks to JSON view when structured output is enabled
- 🟢 **Pulsing JSON Output Indicator** — emerald status badge in footer status bar
- 🗄️ **IndexedDB v3 Schema** — `contentHash` indexing on `images` store with SHA-256 and FNV-1a fallback
- 🔗 **Smart Pointer Chains** — `dedupRefId` transparent resolution and master record auto-promotion
- 🛡️ **Cross-Project Reference Protection** — prevents deleting image blobs actively used in other workspaces
- 🧹 **Legacy LocalStorage Purge** — migrates history to IndexedDB, freeing ~4.1 MB of browser quota
- 📊 **Storage & Quota Monitor Modal** — origin storage metrics, key-by-key breakdown, and quota warning alerts
- 📈 **Footer Storage Usage Indicator** — real-time storage percentage with high-capacity warning states
- 📌 **Asset Pinning & Favoriting** — pin and favorite library assets with dedicated filter tabs
- ☑️ **Select Mode Toolbar** — batch selection checkboxes with select all and bulk operations
- 🛡️ **Two-Step Inline Deletion** — 4-second auto-cancel confirmation on asset cards
- 📥 **Drag-and-Drop JSON Restore** — drop library backup `.json` files directly into the asset library
- 👥 **Shared Project Badges** — visual indicator of cross-project asset usage with project list tooltips
- 🏷️ **Dynamic Version Badge** — footer displays real-time version from `package.json` (`PromptLab v2.5.0 by Taruma Sakti`)
- ⏱️ **Extended API Timeout** — serverless generation route `maxDuration` increased from 60s to 300s
- 📦 **SDK Upgrade** — `@google/genai` upgraded to `^2.20.0`
- 🧩 **PromptConfigModal Component Extraction** — modularized ~860 lines from `app/page.tsx` into a dedicated component

### 🐛 Fixed

- 💾 **LocalStorage QuotaExceededError Crashes** — removed duplicate `prompt_generator_history_v1` LocalStorage writes in `syncActiveProjectToLocalStorage()`, freeing ~2.6 MB of duplicate space, and wrapped history syncing in `try/catch` to ensure safe persistence in IndexedDB
- 🏷️ **Audio/Document Files API Error Messages** — generalized Gemini Files API error messages from hardcoded `@videoN` phrasing to neutral reference media wording using the asset's own label
- 📐 **Asset Library Header Z-Index Layering** — added `relative z-30` styling to `#asset-library-header`, fixing dropdown clipping over the upload dropzone and asset list

### 🔄 Changed

- 🗑️ **Project Deletion Garbage Collection** — deleting a project iterates its `assetLibrary` and cleans up orphaned IndexedDB image blobs no longer referenced by any remaining project
- 📋 **Project "Copy from Current" Clone Scope** — updated checkbox label in `ProjectManagerModal` to explicitly state that custom presets & asset library are cloned
- 🎬 **History Video (VID) Badge Restyled** — restyled VID badge to a charcoal/amber theme with `VideoIcon`, visually separating video references from audio (purple) and document (teal) badges
- 🏷️ **API Key Badge Renamed** — relabeled the override badge in `QuickApiKeySelector` to `BYOK` (Bring Your Own Key)
- 📐 **Streamlined 2-Row Asset Library Toolbar** — consolidated search, view modes, select mode, filter tabs, and sorting into a unified 2-row layout without horizontal dividers
- 🏷️ **Asset Library Backup & Restore Dropdown Labeling** — renamed "Port Assets" to "Backup / Restore" with subtext "ASSET BACKUP & RESTORE (JSON)"
- 🌐 **Content-Hash Integration Across Image Lifecycle** — threaded `contentHash` across uploader, library importer, history save/restore, and JSON export/import with automatic legacy backfill on load
- ⏱️ **API Route Execution Timeout** — increased `maxDuration` from 60s to 300s on `/api/generate` to accommodate agentic video timeline exploration and high-thinking reasoning
- 📦 **Upgraded `@google/genai` to `^2.20.0`** — exports official `MediaProcessing.AGENTIC` enum and resolves production build errors on Vercel
- 🙈 **Build Artifacts Git Ignore** — added `*.tsbuildinfo` to `.gitignore`
- 🌐 **Dev Server Network Binding** — `npm run dev` runs `next dev -p 3000 -H 0.0.0.0` for containerized and remote development

### 🏗 Architecture & Refactoring

- 📦 **Extracted `PromptConfigModal` Component** — extracted the entire System Prompt & Prompt Template configuration editor, preset management dashboard, search filters, and diff comparator (~860 lines) from `app/page.tsx` into a dedicated, reusable component (`components/PromptConfigModal.tsx`), reducing `app/page.tsx` line count by ~650 lines and establishing cleaner modular boundaries.
- 🗄️ **IndexedDB v3 Schema Migration** — upgraded IndexedDB database schema to v3 with a `contentHash` index, automated startup deduplication (`deduplicateStoredImages()`), pointer resolution, and master promotion on deletion in `lib/indexeddb.ts`.
- 💰 **Pricing & Token Breakdown Engine** — centralized token cost calculations, context cache savings math, thought token derivation, and itemized breakdown structure in `lib/pricing.ts`.
- 🪝 **Centralized API Key Resolution & `ALLOW_SERVER_ENV_KEY`** — dynamic per-request client instantiation in `app/api/generate/route.ts` and shared `getActiveApiKey()` helper across all upload, list, and delete actions in `app/api/upload-file/route.ts`.
