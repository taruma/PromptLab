# Changelog

All notable changes to PromptLab, a playground for drafting and iterating on AI prompt templates.

---

## [v2.5.1] — September 3, 2026

### Added

- **Gemini 3.8 Flash Support & Default Model Baseline.**
  - Added full support for **Gemini 3.8 Flash** (`gemini-3.8-flash`), setting it as the new default model across the active workspace state (`app/page.tsx`), server-side generation handler fallback (`app/api/generate/route.ts`), Engine Controls modal reset defaults action (`components/EngineControlsModal.tsx`), and history cost estimation fallbacks (`HistoryCardSummary.tsx` & `HistoryViewerModal.tsx`).
  - Added `gemini-3.8-flash` to the Specific Models list (`SPECIFIC_MODELS`) with release date `Sep 2, 2026`, knowledge cutoff `Mar 2026`, and `NEW` indicator badge in `components/EngineControlsModal.tsx`.
  - Updated `MODEL_ALIASES["gemini-flash-latest"]` in `lib/pricing.ts` to resolve directly to `gemini-3.8-flash`, and updated the `LATEST_MODELS` Flash entry in `EngineControlsModal` with subtitle `✦ gemini-3.8-flash` and release date `Sep 2, 2026`.
  - Updated the Quick Model Selector (`components/QuickModelSelector.tsx`) dropdown badge for Flash to `3.8` and added concise label mapping for `gemini-3.8-flash` (`3.8 Flash`).
  - Integrated **Agentic Video Understanding** support for `gemini-3.8-flash` in `lib/video-utils.ts` (`isAgenticVideoSupported`), enabling autonomous video timeline exploration (`Think → Act → Observe`) with dynamic frame extraction on Gemini 3.8 Flash.
  - Updated video reference tooltips in `components/VideoAssetCard.tsx` to reflect support for Gemini 3.8 / 3.7 Flash models.

### Changed

- **Introductory Promotional Pricing for Gemini 3.8 Flash, 3.7 Flash, and 3.6 Flash.**
  - Updated the model pricing configuration table (`MODEL_PRICING_TABLE` in `lib/pricing.ts`) with Google's official introductory promotional rates effective through December 31, 2026 across **Gemini 3.8 Flash**, **Gemini 3.7 Flash**, and **Gemini 3.6 Flash**:
    - **Input Tokens**: **$0.75** per 1M tokens ($0.00000075 / token; standard rate $1.50).
    - **Output Tokens** (including reasoning thoughts): **$3.75** per 1M tokens ($0.00000375 / token; standard rate $7.50).
    - **Context Cache Base**: **$0.075** per 1M tokens ($0.000000075 / token; standard rate $0.15).
    - **Context Cache Storage**: **$0.50** per 1M tokens / hour (standard rate $1.00).
  - Ensured real-time cost estimation in `GenerationResultView.tsx`, itemized breakdown popover, history items, and UI model selector rate badges (`IN: $0.75 / 1M` / `OUT: $3.75 / 1M`) automatically compute using the promotional rates.

---

## [v2.5.0] — September 2, 2026

### Added

- **Itemized Cost Breakdown Popover & Streaming Cost Finalization.**
  - Resolved intermediate streaming calculation discrepancies by keeping the emerald cost badge hidden while generation is in progress (`isLoading === true`) and rendering the finalized, verified cost badge immediately upon completion.
  - Added an interactive Retro Lab brutalist hover/tap popover on the cost badge in `components/GenerationResultView.tsx` displaying the complete line-by-line itemized calculation:
    - **Prompt Input (Uncached)**: Token count $\times$ input rate per 1M $\rightarrow$ subtotal.
    - **Context Cache**: Cached token count $\times$ discounted base rate per 1M $\rightarrow$ subtotal, along with a highlighted `Saved $X.XXXXXX` badge.
    - **Output Response**: Candidate text tokens $\times$ output rate per 1M $\rightarrow$ subtotal.
    - **Reasoning Thoughts**: Thought tokens $\times$ output rate per 1M $\rightarrow$ subtotal.
    - **Total Estimated**: Aggregate token count and final cost in USD.
  - Server-side generation handler (`app/api/generate/route.ts`) now directly captures `thoughtsTokenCount` from Gemini API `usageMetadata` and streams it to the client.
  - Updated the output panel footer token counter to explicitly display thought tokens (`TOKENS: {total} ({prompt} IN [{cached} CACHED] / {candidates} OUT + {thoughts} THOUGHTS)`), ensuring token counts visibly balance with `totalTokens`.
  - Added full backward-compatibility fallback in `lib/pricing.ts` that derives thought tokens via $\max(0, \text{total} - \text{prompt} - \text{candidates})$ for legacy history records. Synchronized `thoughtTokens` across `HistoryItem` interfaces and `lib/history-export.ts`.
  - Enhanced tooltips on `HistoryCardSummary` and `HistoryViewerModal` cost badges to display the detailed token breakdown and updated the fallback model reference to `gemini-3.7-flash`.

- **Agentic Video Understanding & YouTube mimeType Support.**
  - Integrated Google's **Agentic Video Understanding** (`MediaProcessing.AGENTIC`) for Gemini 3.7 Flash (`gemini-3.7-flash`, 3.6 Flash, 3.5 Flash-Lite, and aliases), enabling autonomous timeline exploration (`Think → Act → Observe`) with dynamic frame extraction and lower analysis costs.
  - Added a segmented **`MODE: [STATIC] [AGENTIC]`** toggle on `VideoAssetCard` with Analog Brutalist styling and default `STATIC` mode for fast, uniform short-clip processing.
  - Implemented **Option A Non-Destructive Fallback**: When an unsupported model (e.g. Gemini 3.1 Pro Preview / Gemini Pro Latest) is active while `AGENTIC` is selected, the preference is preserved in workspace state, a dashed amber `Paused` tag is rendered, and `app/api/generate/route.ts` automatically executes as `STATIC` fallback until switching back to Gemini 3.7 Flash.
  - Added explicit `mimeType` transmission (`vid.mimeType || "video/mp4"`) for YouTube URLs passed as `fileData` in `app/api/generate/route.ts`.
  - Added `processingMode` support across session persistence, history items, and history import/export (`lib/history-export.ts`).

- **Gemini 3.7 Flash Support & Default Model Update.**
  - Added full support for **Gemini 3.7 Flash** (`gemini-3.7-flash`), setting it as the new default model across the entire workspace and server-side generation handler fallback.
  - Added `gemini-3.7-flash` pricing configuration in `lib/pricing.ts` ($1.50 / 1M input, $7.50 / 1M output, $0.15 / 1M context cache base rate, $1.00 / 1M / hour context cache storage).
  - Updated `MODEL_ALIASES["gemini-flash-latest"]` to resolve to `gemini-3.7-flash`.
  - Added Gemini 3.7 Flash with release metadata and `NEW` indicator badges to the Engine Controls modal (`components/EngineControlsModal.tsx`).
  - Updated the Quick Model Selector (`components/QuickModelSelector.tsx`) dropdown badge for Flash to `3.7` and added concise label mapping for `gemini-3.7-flash`.

- **Audio & Document Reference Tags in Generation Pipeline & History Media Badges.**
  - The generation pipeline (`app/api/generate/route.ts`) now parses each media asset's MIME type and emits separate casting tags — `@videoN`, `@audioN` (for `audio/*` files), and `@docN` (for `text/*`, PDF, and other non-video/image/audio formats) — so audio and document references injected into `{{ visual_references }}` are tagged correctly instead of being labeled as videos.
  - Generalized Gemini Files API error messages from hardcoded `@videoN` wording to neutral "reference media" phrasing that uses each asset's own label.
  - Expanded the workspace file picker `accept` attribute in `VisualAssetsSection.tsx` to `image/*,video/*,audio/*,application/pdf,text/*` and added per-type counter logic that assigns the correct `@audioN` / `@docN` / `@videoN` tag to each asset card.
  - Added a `tag` prop to `VideoAssetCard.tsx` so the top-left identifier badge and player sub-labels display the correct per-type casting tag.
  - History surfaces now render separate `AUD` (purple, music icon) and `DOC` (teal, file icon) badges — with restyled `VID` badges — in `HistoryCardSummary.tsx`, `HistorySection.tsx`, and `HistoryViewerModal.tsx`, with counts derived from MIME types.
  - Updated helper copy in `PromptTemplateHelpTooltip.tsx` and `LabManualSection.tsx` to document the `@audio1` / `@doc1` tags, and adjusted the YouTube modal next-index in `app/page.tsx` to count only video-type references.

- **Multi-Modal Gemini Files API Support (Audio, PDF & Documents).**
  - Expanded Files API upload picker and drag-and-drop dropzone in `components/AddFilesApiModal.tsx` to support audio files (MP3, WAV, OGG, M4A, FLAC) and document formats (PDF, TXT, CSV, JSON, Markdown, Code snippets) up to 2 GB.
  - Created **`AudioPlayerModal.tsx`** for dedicated audio previewing and playback with custom HTML5 audio controls, volume indicators, and MIME type metadata display.
  - Updated `VideoAssetCard.tsx` to render distinct visual placeholders for audio assets (purple theme + music icon) and text/PDF documents (teal theme + document icon).
  - Reserved video Play overlays and `VideoPlayerModal` strictly for video files, introducing a "Listen Audio" action button for audio assets.
  - Updated section helper copy in `VisualAssetsSection.tsx` to guide users on attaching non-video/non-image multi-modal media up to 2 GB via Files API.

- **Quick Model & Thinking Switcher (`QuickModelSelector`).**
  - Added a compact icon-only trigger button in `components/AppHeader.tsx` beside the Quick API Key Switcher for rapid model and thinking level switching.
  - Features a clean 3-row dropdown panel:
    - **Row 1 (Status)**: Brief active model status indicator (e.g. `Flash Latest • MEDIUM`).
    - **Row 2 (Model)**: Quick model selection pointing to latest model aliases (`Flash`, `Flash Lite`, `Pro`). Automatically unselects all 3 options and shows a "Specific Version Active" badge if a pinned specific model version is active.
    - **Row 3 (Thinking)**: Thinking level selection (`HIGH`, `MEDIUM`, `LOW`, `MIN`). Automatically disables `MIN` for Pro models.
    - **Header Action**: Includes a top-right **Engine** settings button to open the full Engine Controls modal on demand.

- **Quick API Key Switcher (`QuickApiKeySelector`).**
  - Added a streamlined, compact quick API key switcher dropdown in the header navigation bar (`components/AppHeader.tsx`) beside the Quick Preset Selector for instant key switching.
  - Displays the active key label and status badge (`BYOK` or `ENV`) directly on the trigger button.
  - Features a simplified, un-cluttered dropdown menu:
    - Header with "API KEY VAULT" title, total key count badge `(N)` positioned directly adjacent to the title, and a compact top-right **Manage** button with `Settings` icon to open key management in Engine Controls.
    - Active configuration status banner showing the currently active key name and masked string.
    - Filter search bar for quickly searching saved vault keys when multiple keys exist.
    - Dedicated list items for selecting the Default System Key (`process.env.GEMINI_API_KEY`) or any custom vault key override with active checkmarks.
    - Live synchronization with `localStorage` (`prompt_generator_custom_api_keys` and `prompt_generator_active_api_key_id`) across workspace reloads and browser tabs.

- **Asset Pinning & Favoriting in Asset Library.**
  - Added `isPinned` and `isFavorite` properties to library assets (`StoredImage`), enabling users to pin important reference images to the top of the asset list or mark them as favorites.
  - Supported across `components/AssetLibrarySidebar.tsx`, project models (`lib/projects.ts`), and library backup schemas (`lib/asset-library-export.ts`).
  - Added interactive Pin (📌) and Favorite (★) toggle controls to both grid thumbnails and list row items with high-contrast dark button backgrounds and golden amber highlights when active.
  - Added filter tabs (`All`, `Pinned`, `Favs`) with dynamic item count badges to filter library assets seamlessly.

- **Select Mode & Bulk Operations Toolbar in Asset Library.**
  - Introduced a dedicated `Select` button in `components/AssetLibrarySidebar.tsx` that toggles bulk selection checkboxes on demand.
  - Keeps the browsing view clean by hiding checkboxes by default, showing them only when `Select` mode is active or assets are checked.
  - Added a `Select All` / `Deselect All` toggle button when in select mode for fast batch export and deletion workflows.

- **IndexedDB Generation History Storage & Legacy LocalStorage Cleanup.**
  - Created `lib/history-storage.ts` to manage loading and saving generation history via a non-breaking wrapper (`loadHistoryFromStorage()` and `saveHistoryToLocalStorage()`).
  - Moved primary history persistence into IndexedDB (`promptlab_db` → `projects` store), storing history directly within the active workspace project record to avoid browser `LocalStorage` quota limits (`QuotaExceededError`).
  - Implemented automatic migration: on app launch, `loadHistoryFromStorage()` retrieves legacy items from `localStorage` (`prompt_generator_history` / `prompt_generator_history_v1`), migrates them into the active IndexedDB project, and purges the heavy payload from `localStorage`.
  - Instantly freed up ~4.1 MB of `localStorage` origin quota (reducing origin usage from 91%+ down to safe levels) while maintaining full backward compatibility for all history operations, search, filters, and JSON export/import workflows.

- **Drag-and-Drop JSON Library Restore in Asset Library.**
  - Expanded the upload dropzone in `components/AssetLibrarySidebar.tsx` to support dropping `.json` asset library backup export files alongside reference images.
  - Dropping or selecting a `.json` file automatically triggers `AssetImportModal` for preview, duplicate detection, and import strategy resolution.
  - Updated file input `accept` attribute to `image/*,.json,application/json` and updated dropzone label text ("Upload reference or JSON library").

- **Two-Step Asset Deletion Safety in Asset Library.**
  - Replaced single-click instant asset deletion in `components/AssetLibrarySidebar.tsx` with an inline 2-step confirmation mechanism across both grid hover view and list row views.
  - Clicking the delete button transforms it into a highlighted red confirmation state ("Confirm" / Check icon) with a 4-second auto-cancel timer, preventing accidental asset removal without disruptive modal dialogs.

- **IndexedDB v3 Schema & Content-Hash Image Payload Deduplication.**
  - Upgraded IndexedDB schema version from v2 to v3 in `lib/indexeddb.ts`, adding a `contentHash` index on the `images` object store.
  - Implemented automatic SHA-256 content-hash deduplication in `saveStoredImage(id, base64, contentHash)` via `lib/content-hash.ts`. When saving an image whose binary payload matches an existing record in IndexedDB, the store saves a light reference pointer (`dedupRefId`) to the master image record instead of storing duplicate base64 strings, drastically reducing storage usage when reusing images across projects, asset libraries, or history items.
  - Enhanced `getStoredImage(id)` to transparently resolve `dedupRefId` pointer chains, retrieving original image data seamlessly for all components without altering existing application logic.
  - Built reference-aware deletion in `deleteStoredImage(id)`: if a master image record holding base64 data is deleted, the system automatically promotes the first dependent record to master and re-points remaining dependents before deleting, guaranteeing zero broken image links.

- **Automatic Startup Image Deduplication & Migration Engine.**
  - Integrated a background migration and deduplication task (`deduplicateStoredImages()` in `lib/indexeddb.ts`) triggered automatically when opening the application in `app/page.tsx`.
  - Scans stored IndexedDB images on launch, backfills missing `contentHash` identifiers, and consolidates pre-existing duplicate base64 payloads into `dedupRefId` references without requiring user intervention.

- **Storage & Quota Monitor Modal (`StorageUsageModal`).** Integrated a real-time browser storage diagnostic modal (`components/StorageUsageModal.tsx`, `lib/storage-utils.ts`) displaying LocalStorage usage percentage, standard 5 MB quota bar, high quota alerts (>=75%), key-by-key size breakdown table, and IndexedDB (`promptlab_db`) origin storage usage metrics (`navigator.storage.estimate()`).

- **Interactive Storage Usage Indicator in Footer.** Added a live storage usage badge in the application footer (`components/FooterStatusBar.tsx`) showing real-time LocalStorage usage (e.g., `Storage: 2.6 MB (52%)`) with auto-refresh every 8 seconds, pulsing red in high-capacity states (>=80%), and opening the Storage Usage modal on click.

- **History Viewer Image Hover Preview with Content-Hash Badge.** Extracted a new `HistoryImageCardWithHover` component in `components/HistoryViewerModal.tsx` using `createPortal` to render large, edge-aware image previews when hovering over history detail image cards. The preview positions itself relative to the card element with smart boundary detection (preventing overflow on viewport edges) and displays a SHA-256 content-hash identifier badge in emerald-green at the top of the preview for asset traceability.

- **Content-Hash Display in Visual Asset Card Hover Preview.** Added a SHA-256 content-hash badge (`HASH: {contentHash}`) to image hover previews in `components/VisualAssetCard.tsx`, displayed in emerald-green with a monospace font, enabling users to visually identify and verify asset content integrity without opening external tools.

- **Cross-Project Image Reference Protection.** Added a new `isImageReferencedInAnyProject()` utility in `lib/indexeddb.ts` that scans all project workspaces (IndexedDB `projects` store) and active session state (localStorage) to check whether an image ID is still referenced by any project's asset library or history items before deletion. `deleteStoredImage(id)` now performs this protection check by default (unless `forceDelete` is passed), logging an informational message and preserving binary data when the asset is actively referenced elsewhere. When the check fails, it conservatively assumes the asset is still in use to prevent premature data loss.

- **Cross-Project Shared Asset Tracking & Badges in Asset Library.** Integrated `getSharedProjectsForImages()` in `lib/indexeddb.ts` to scan all project workspaces in IndexedDB and identify assets referenced across multiple workspaces. In `components/AssetLibrarySidebar.tsx`, shared assets render an interactive badge indicator displaying the count of sharing projects and a tooltip listing the other project names, providing immediate visual transparency before modifying or removing shared assets.

- **Dynamic Version Number Display in Footer.** The footer status bar (`components/FooterStatusBar.tsx`) now dynamically displays the current application version from `package.json` (e.g., `PromptLab v2.5.0 by Taruma Sakti`), providing immediate version context without requiring the user to inspect the app binary.

- **Structured JSON Output & Syntax-Highlighted JSON Viewer.**
  - Added a server-side structured output pipeline: the `/api/generate` handler now accepts `responseMimeType: "application/json"` and an optional `responseSchema` (string or pre-parsed object). Invalid JSON schemas are rejected with a 400 error (`"Invalid JSON Schema provided"`). When valid, the schema and MIME type are attached to the Gemini API generation config (`config.responseMimeType` / `config.responseSchema`), forcing the model to return guaranteed, parseable JSON.
  - Added a **Structured Output toggle** in `components/EngineControlsModal.tsx` with a green/white enable/disable button, a pulsing status indicator dot, and a collapsible optional **JSON Schema editor**. The schema textarea includes live syntax validation (emerald `Valid Schema` badge vs. red `Syntax Error` badge with error tooltip), a pre-filled placeholder schema example, and helper guidance text.
  - Added a 4th row "Structured Output (JSON)" toggle in the `QuickModelSelector` dropdown with a `Braces` icon, `ACTIVE` status badge, and `[ENABLE]` / `[DISABLE]` action link for rapid one-click control without opening the full Engine Controls modal. The trigger button displays a green indicator dot when structured output is enabled.
  - Created a new **JSON View** mode in `components/GenerationResultView.tsx` — a third output render option alongside Formatted Markdown and Raw Monospace. The JSON view includes:
    - `extractCleanJson()` parser that strips Markdown code fences (` ```json `) and attempts `JSON.parse()`, falling back to raw text display with an amber `Raw / Unparsed JSON` badge.
    - `highlightJsonLine()` syntax highlighter with per-token color coding: property keys (dark charcoal, bold), string literals (teal), booleans (indigo), `null` (stone italic), numbers (amber), and structural delimiters `{ } [ ] , :` (warm gray).
    - Line numbers, hover-highlighted rows, a `Valid JSON` (emerald) / `Streaming JSON...` (amber) status header, and a `Structured Mode` lock badge.
  - The `GenerationResultView` auto-locks to JSON view when `isStructuredOutput` is active, and the view mode footer label displays `"STRUCTURED JSON (LOCKED)"` in that state.
  - The `FooterStatusBar` now displays a pulsing emerald `JSON OUTPUT` badge with an emerald-bordered dark container (`bg-emerald-950/70 border border-emerald-500/50 text-emerald-400`) whenever structured output is enabled.
  - The `app/page.tsx` workspace threads `isStructuredOutput` and `responseSchema` state through to the generation POST payload, `GenerationResultView`, `AppHeader` → `QuickModelSelector`, `EngineControlsModal`, and `FooterStatusBar`.

### Changed

- **Project Deletion Garbage Collection of Unreferenced Images.** In `lib/projects.ts`, deleting a project now iterates its `assetLibrary` and calls `deleteStoredImage()` for each asset, cleaning up orphaned IndexedDB image blobs that are no longer referenced by any remaining project.
- **Project "Copy from Current" Now Includes Asset Library.** In `components/ProjectManagerModal.tsx`, the checkbox label when creating a new project from current workspace was updated to explicitly list "…custom presets & **asset library** from current project," reflecting the full clone scope.
- **History Video (VID) Badge Restyled to Amber/Dark Theme.** In `components/HistoryCardSummary.tsx`, the inline VID count badge was changed from a purple-900/purple-100 scheme to a charcoal `[#1A1A1A]` / amber `[#F59E0B]` theme with an amber border and `VideoIcon`, visually distinguishing video references from audio (purple) and document (teal) badges.
- **API Key Badge Renamed from "OVERRIDE" to "BYOK".** The override indicator badge in the Quick API Key Switcher (`components/QuickApiKeySelector.tsx`) was relabeled to `BYOK` (Bring Your Own Key), using more precise and recognizable terminology.
- **Streamlined 2-Row Asset Library Toolbar Layout.** In `components/AssetLibrarySidebar.tsx`:
  - Consolidated search input, view mode toggles (`Grid` / `List`), `Select` mode toggle button, filter tabs (`All`, `Pinned`, `Favs`), and compact sorting dropdown (`Newest`, `Oldest`, `A-Z`, `Z-A`) into a compact, seamlessly aligned 2-row layout.
  - Removed disruptive horizontal border lines between control rows for a unified, un-cluttered visual design in the retro brutalist style.
  - Optimized responsive label display for filter tabs (`Layers`, `Pin`, `Star` icons) and shortened sorting labels to prevent horizontal scrolling and layout overflow.
- **Asset Library Backup & Restore Dropdown Labeling & Z-Index Layering.** In `components/AssetExportDropdown.tsx` and `components/AssetLibrarySidebar.tsx`:
  - Renamed the asset library header dropdown button from "Port Assets" to **"Backup / Restore"** (with header subtext `"ASSET BACKUP & RESTORE (JSON)"`) for clearer, user-friendly intent.
  - Added `relative z-30` styling to `#asset-library-header` in `AssetLibrarySidebar.tsx`, fixing z-index clipping issues and ensuring dropdown menus overlay smoothly over the upload dropzone and asset list.
- **Content-Hash Integration Across the Full Image Lifecycle.** Threaded `contentHash` computation into the workspace image uploader (`handleImageUpload`), library asset importer (`handleAddLibraryImageToWorkspace`), history save (on generation completion), history restore (when recalling saved generations), and history export/import (`lib/history-export.ts` — both `exportHistoryToJSON()` and `importHistoryFromJSON()`), ensuring new image additions immediately benefit from content-hash deduplication and that historical entries preserve hash-based asset traceability. Added a legacy history contentHash backfill step via `ensureHistoryHasContentHashes()` on application load, which scans existing history items for missing hashes, pulls missing base64 data from IndexedDB, and computes and stores hashes in-place. The `lib/content-hash.ts` module also includes an automatic FNV-1a 64-bit fallback hash function for browser environments where Web Crypto SHA-256 is unavailable, ensuring consistent deduplication across all platforms.
- **API Route Execution Timeout Increased to 300s.** In `app/api/generate/route.ts`, increased `maxDuration` from 60 seconds to 300 seconds (5 minutes) on the serverless `/api/generate` route to accommodate longer-running generations, agentic video timeline exploration, large multimodal document parsing, and high-thinking reasoning tasks without timing out.
- **Upgraded `@google/genai` to `^2.20.0`.** Upgraded the official Google Gen AI SDK in `package.json` and `package-lock.json` from `^2.4.0` to `^2.20.0` to export the official `MediaProcessing.AGENTIC` enum for agentic video understanding and resolve production build errors on Vercel.
- **Build Artifacts Git Ignore Update.** Added `*.tsbuildinfo` to `.gitignore` to prevent TypeScript incremental build metadata caches from polluting git repositories.
- **Updated System Documentation.** Updated `AGENTS.md` to reflect IndexedDB v3 schema, `contentHash` indexing, and transparent payload deduplication mechanisms.
- **Development Server Binds to All Network Interfaces.** The `dev` script in `package.json` now runs `next dev -p 3000 -H 0.0.0.0`, improving accessibility for containerized and remote development environments.
- **Release Notes Preset Descriptions Aligned with Education Focus.** In `RELEASE_NOTES_v2.md`, updated the Film Lingo and Motion Lab preset descriptions to drop AI prompt-generation language, keeping the v2.4 release notes consistent with the v2.4.1 preset refocus.

### Architecture & Refactoring

- **Extracted `PromptConfigModal` Component.** Extracted the entire System Prompt & Prompt Template configuration editor, preset management dashboard, search filters, and diff comparator (~860 lines) from `app/page.tsx` into a dedicated, reusable component (`components/PromptConfigModal.tsx`), reducing `app/page.tsx` line count by ~650 lines and establishing cleaner modular boundaries.

### Fixed

- **LocalStorage QuotaExceededError Prevention & Legacy Key Cleanup.** In `lib/projects.ts`, fixed `QuotaExceededError` crashes by removing redundant legacy `prompt_generator_history_v1` LocalStorage writes in `syncActiveProjectToLocalStorage()`, immediately freeing up ~2.6 MB of duplicate storage space. Wrapped remaining `localStorage.setItem` history syncing calls in `try/catch` blocks so full project state remains safely preserved in IndexedDB even if LocalStorage hits browser quota limits.

---

## [v2.4.1] — July 29, 2026

### Changed

- **Stripped all AI-centric and prompt-generation language from system presets.** All 10 built-in presets were refactored to focus purely on cinematic education, analysis, and craft explanation. Dedicated output sections that previously produced copy-paste AI prompts, generation tokens, style bibles, and keyword fragments were removed entirely from every preset's `system_prompt.txt`. Intro paragraphs that framed presets as prompt-generation utilities were rephrased to emphasize teaching, description, and visual literacy. Final instruction lines in 5 `prompt_template.txt` files were cleaned to drop generation/prompt language.
- **Presets are now tool-agnostic teaching references.** Each preset teaches a specific dimension of filmmaking craft — cinematic language, color theory, composition geometry, camera movement, shot breakdown, style definition, narrative treatment — without prescribing any output format or target tool. Users who want prompt generation can pair analysis presets with other tools or presets designed for that purpose.

---

## [v2.4.0] — July 29, 2026

### Added

- **Preset architecture refactored to folder-based system with 10 new specialized presets.** Replaced the 3 original flat JSON presets (AI Casting & Screenplay, AI Director & Storyboard, VFX & Speculative Worldbuilder) with 10 new specialized folder-based presets, each storing `meta.json`, `system_prompt.txt`, and `prompt_template.txt` as individual files:
  - **Cine DeepDive** — Cinematic Language Educator for multi-dimensional scene analysis across all cinematic layers (shot design, composition, camera movement, lighting, color, lenses, editing, sound) with AI generation toolkit and creative re-imagining.
  - **Color Mapper** — Color Language Specialist for extracting, naming, and designing color palettes with grading style identification, color psychology notes, and AI generation color tokens.
  - **Comp Decoder** — Visual Composition Analyst for reverse-engineering images into compositional building blocks (geometry, weight distribution, depth layers, line dynamics) with AI prompt composition tokens.
  - **Film Lingo** — Cinematic Language Translator for converting concepts into rich cinematic language with ready-to-use AI generation prompts.
  - **Genre Lexicon** — Genre & Tone Lexicon for defining and articulating genre conventions, tonal registers, and their visual signatures.
  - **Motion Lab** — Camera Motion Specialist for naming and analyzing camera movements (dolly, handheld, Steadicam, crane, zoom) with emotional motivation, movement arc analysis, and AI video motion tokens.
  - **Scene Lab** — Scene Construction Coach for turning character interactions into fully visualized scene descriptions with camera, lighting, and blocking choices expressing emotional subtext.
  - **Shot Interp** — Shot Language Interpreter for reverse-engineering finished scenes into professional shot-by-shot breakdowns with narrative purpose and directing insights.
  - **Style Architect** — Visual Identity Architect for defining comprehensive visual style guides with color philosophy, composition doctrine, lighting signature, AI style bibles, and creative director's notes.
  - **Vis Narrative** — Visual Narrative Architect for crafting director's treatment blueprints, tonal maps, and AI generation prompt suites.
- **Configurable preset import strategy (Duplicate vs. Replace).** When importing presets via URL query parameters or local JSON files, users can now choose between two strategies: **Create Duplicate** (default, safe — assigns a fresh ID and auto-increments the name with a numeric suffix like `"My Preset (2)"` on ID or name conflicts) and **Replace Existing** (overwrites the matching preset by its ID with the incoming content). The strategy toggle is rendered as a segmented control in the redesigned `PresetImportConfirmModal`, and re-evaluates the import result live when switched.
- **Redesigned PresetImportConfirmModal with summary breakdown and expandable item inspector.** The import confirmation modal (`components/PresetImportConfirmModal.tsx`) replaces the previous simple confirmation dialog with a rich interface displaying: a source metadata box (name, source URL/file), a four-column summary grid (Detected / New / Replaced / Skipped counts), and an expandable, scrollable list of individual preset items with action badges (`NEW`, `REPLACE`, `SKIPPED`). Skipped items reveal a reason explanation (exact ID match or identical name+content match). A checkbox lets users optionally apply the imported preset directly to the active workspace.
- **Unified URL and local JSON file preset import flow.** The "Import JSON" action in the Configure Prompts modal now routes through the same `openJsonPresetImport()` pipeline used by URL imports, giving local file imports the strategy selector, summary breakdown, and item inspector. Both flows share the `PresetImportConfirmModal` and `useUrlPresetImport` hook.
- **`preseturl` query parameter support.** The URL preset import detector now also recognizes `?preseturl=` (case-insensitive) in addition to the existing `presetUrl`, `configUrl`, `preset`, and `config` parameters.
- **Skip-reason differentiation in `importPresetsFromJSON()`.** The core import utility now returns a `processedItems` array of `ProcessedImportItem` objects with `action` and `skipReason` fields. Skip reasons distinguish between `exact_match` (identical ID) and `content_match_different_id` (same name + identical prompts but different ID), providing clear feedback in the import modal.
- **ALLOW_SERVER_ENV_KEY configuration flag for enforcing user-supplied API keys.** A new `ALLOW_SERVER_ENV_KEY` environment variable (defaults to `"true"`) lets deployments disable the server-side `GEMINI_API_KEY`, requiring end-users to provide their own custom Gemini API key in Engine Controls. When set to `"false"`, the generation and file upload handlers reject requests without a user-supplied key with a specific "Server environment API key usage is disabled" error message. The generation handler no longer uses a static module-level `GoogleGenAI` client singleton; instead, it creates per-request dynamic client instances based on the resolved active API key. The Files API upload handler extracts a shared `getActiveApiKey()` helper for centralized key resolution across all upload actions (direct resumable, chunked proxy, list, delete, and single-file upload).
- **Preset Replace Confirmation Modal (`PresetReplaceConfirmModal`).** Added a dedicated confirmation dialog (`components/PresetReplaceConfirmModal.tsx`) that intercepts switching presets via the Quick Preset Selector when the active workspace contains unsaved prompt edits (`[EDIT]` state). Prompts users with "Keep My Edits" (cancel switch) or "Replace Prompts" (confirm overwriting active system instructions and prompt template) options to prevent accidental data loss.
- **Active preset state persistence across page refresh.** Persisted `loadedPresetId` in `localStorage` (`prompt_generator_loaded_preset_id`) on mount in `app/page.tsx`, ensuring that refreshing the browser retains the active preset connection and its `[EDIT]` badge status instead of resetting to "Custom Workspace".
- **Snapshot-based discard in Configure Prompts modal.** Captured an initial snapshot of the active preset state when opening the prompt configuration editor (`handleOpenPromptConfig`), ensuring that clicking "Cancel" and confirming discard accurately restores `loadedPresetId`, `activeEditingPresetId`, and `newPresetName` to their exact snapshot values and synchronizes `localStorage`.
- **Ko-fi Support Button (`KofiButton`) & Environment Toggle.** Created a standalone `KofiButton` component (`components/KofiButton.tsx`) styled with Ko-fi's signature soft blue background (`#72a4f2`) to stand out intentionally in the top navigation bar (`components/AppHeader.tsx`). Added a `NEXT_PUBLIC_ENABLE_KOFI_BUTTON` environment variable flag in `.env.example` allowing deployments to conditionally disable or hide the support button by setting it to `"false"`.
- **Simplified Header Navigation Buttons (`components/AppHeader.tsx`).** Streamlined top header actions to single-word labels with distinct pastel color accents for glanceability: **Assets** (Teal), **Engine** (Indigo), **Prompts** (Amber), and **Clear** (Rose with `RotateCcw` icon). Responsive label hiding ensures header controls remain compact and un-clipped on mobile screens.
- **Updated Lab Manual & Quick-Start Guide (`components/LabManualSection.tsx`).** Refreshed the step-by-step onboarding guide to reflect current header control names (**Prompts**, **Assets**, **Engine**), large file uploads via Files API (up to 2 GB), preset URL sharing, and added a quick tips bar highlighting Multi-Project Workspaces, Reasoning Effort levels, and History Archives.
- **Quick Preset Selector row redesign with system prompt excerpt preview.** Each preset row in `components/QuickPresetSelector.tsx` (`PresetRow`) was redesigned from a compact single-line `flex items-center` layout to a multi-line `flex items-start` card layout showing the preset name (bold, uppercase, `text-[10px]`) and a 2-line truncated excerpt of the preset's system prompt beneath it (`text-[9px]`, `WebkitLineClamp: 2`), giving users a quick preview of what each preset does without needing to open the Configure Prompts modal.

### Fixed

- **Favorites & Pinned Filter Sync in Quick Preset Selector.** Fixed the ★ Favorites tab and badge counter in `components/QuickPresetSelector.tsx` to check both `pinnedIds.includes(p.id)` and `p.isFavorite`, ensuring starred presets appear consistently in the favorites filter list.

### Changed

- **Mobile Header & Visual Assets Responsive Layout Refinements.** Refactored `components/AppHeader.tsx`, `components/KofiButton.tsx`, and `components/VisualAssetsSection.tsx`:
  - **Mobile Header**: Row 1 presents PromptLab branding and Project Manager button (`MAIN WORKSPACE...`) with Quick Preset Selector hidden. Row 2 presents header action controls (**Support**, **Assets**, **Engine**, **Prompts**, **Clear**) as clean icon-only buttons stretching evenly across the viewport.
  - **Visual Assets Section**: Renamed section title cleanly to **"Visual Assets"**. Restored the desktop single-row section header layout with title on the left and action buttons (**Files API Upload**, **Add YouTube URL**, **Browse Library**) plus the `{{ visual_references }}` tag on the far right (`text-[9px] font-mono text-[#888884]`). Updated brief description to explain browser image compression for local uploads and highlight **Files API Upload** for uncompressed high-resolution assets.
- **Server-side preset API rewritten for folder-based loading with backward compatibility.** The `/api/prompt-config` route now reads presets as individual folder structures (`meta.json` + `system_prompt.txt` + `prompt_template.txt`) as the primary format, while maintaining fallback support for legacy JSON preset files, ensuring smooth migration for any remaining flat JSON presets.
- **Default prompt template simplified to minimal structure.** The fallback `prompts/prompt_template.txt` was reduced from a 23-line creative specification with genre/tone/audience/format variables to a bare `{{ visual_references }}` / `{{ idea }}` layout, delegating all formatting and structural guidance to individual presets.
- **Default system prompt stripped of hardcoded formatting instructions.** The fallback `prompts/system_prompt.txt` was reduced from 13 lines of detailed Markdown-avoidance rules to essentially empty, since all output formatting constraints are now defined per-preset rather than enforced globally.
- **Enhanced `importPresetsFromJSON()` with replace strategy, unique name generation, and expanded JSON format support.** The import utility in `lib/preset-export.ts` now accepts an `options.importStrategy` parameter, returns `replacedCount` alongside `importedCount` and `skippedCount`, and generates unique preset names via an auto-incrementing suffix (e.g., `"My Preset (2)"`) when duplicates are detected. It also accepts `{ preset: ... }` single-wrapper JSON objects as a valid import source format. In replace mode, existing presets matched by ID are overwritten in-place while preserving their position in the working array.
- **"Manage All Presets & Prompts" footer button removed from Quick Preset Selector.** The dropdown's footer action button that opened the Configure Prompts modal was removed, streamlining the quick-switching experience by eliminating a non-essential navigation element from the compact selector panel.

### Architecture & Refactoring

- **Extracted URL preset import logic into `hooks/use-url-preset-import.ts`.** ~400+ lines of state management, URL query parameter detection, remote fetch, preset parsing, duplicate evaluation, workspace application, and localStorage persistence were moved from `app/page.tsx` into a standalone custom hook. The hook exposes `openJsonPresetImport()` for triggering the same import workflow from local file uploads and an `onSetImportStrategy` callback for live strategy switching.
- **Extracted `PresetImportConfirmModal` component.** The import confirmation UI (preset metadata card, strategy selector, summary grid, expandable item list, workspace-application checkbox, loading spinner, error toast, and success toast) was split into its own component at `components/PresetImportConfirmModal.tsx` with a clean `PresetImportConfirmModalProps` interface.

---

## [v2.3.0] — July 28, 2026

### Added

- **High-Speed Direct Resumable Upload Wrapper with Smart CORS Verification.** Added a direct resumable upload wrapper (`handleDirectResumableUpload` in `components/AddFilesApiModal.tsx`) that requests a resumable upload session header (`X-Goog-Upload-URL`) from a new `action: "resumable_session"` backend endpoint (`/app/api/upload-file/route.ts`). Binary file bytes stream directly from the user's browser to Google Cloud via XMLHttpRequest with real-time percentage progress tracking (30%–95%), bypassing Vercel's 4.5 MB request body limit and execution timeouts for large media files (up to 2 GB). If browser CORS policies block reading the raw completion response, a background verification step (`action: "list"`) automatically checks Gemini Files API storage to confirm file creation without raising CORS error popups or duplicating uploads. If direct upload is blocked or fails, the system seamlessly falls back to the 2 MB chunked proxy upload pipeline.
- **Gemini Files API Processing State Polling with Differentiated Error Handling.** Both the server-side generation route (`app/api/generate/route.ts`) and the client-side upload modal (`AddFilesApiModal.tsx`) now automatically poll recently uploaded media files while they are in `PROCESSING` state on Google's Gemini servers until they reach `ACTIVE`. Server-side polls `ai.files.get()` up to 15 times at 2-second intervals per image/video reference before invoking generation. Client-side polls up to 8 times post-upload (direct path) and up to 10 verify + 8 processing poll iterations (CORS verification path), showing "Processing media tracks on Google Cloud..." status feedback. Generation errors now differentiate between PROCESSING ("wait a few seconds and try again"), FAILED ("re-upload or select a different asset"), and expired/inaccessible states ("48-hour expiry or API key mismatch") with specific resolution guidance for each case.
- **Gemini Files API Active File Browser & Selector.** Added a "Select Existing" tab in the Gemini Files API modal (`components/AddFilesApiModal.tsx`) allowing users to browse, search, and attach previously uploaded files stored on Google's Gemini Files API without re-uploading them. The backend route (`/app/api/upload-file/route.ts`) supports `action: "list"` and `action: "delete"` commands using `@google/genai`'s `ai.files.list()` and `ai.files.delete()`. In the UI, each existing file card displays its original filename/displayName, file size, MIME type badge, `ACTIVE`/`PROCESSING` status indicator, 48-hour expiration time countdown, `fileUri` with a quick copy button, custom reference label input field, and an "Attach File to Workspace" action, alongside an instant "Delete" button to purge obsolete files from Gemini Files API storage.
- **Gemini Files API Integration & Upload Modal.** Users can now upload larger media files (images and videos up to 2 GB) directly to Google's Gemini Files API via a new "FILES API UPLOAD" button in the `VisualAssetsSection`. The backend handler (`/app/api/upload-file/route.ts`) processes multi-part file uploads, streams them securely to Gemini's Files API using the `@google/genai` SDK, polls for an `ACTIVE` file processing state, and returns the generated `fileUri`.
- **Files API UI Modal & Media Reference Cards.** Added a dedicated modal component (`components/AddFilesApiModal.tsx`) featuring drag-and-drop file selection, custom developer API key override support, and a real-time progress bar with step-by-step status indicators (Uploading -> Processing -> Active). Uploaded Files API assets render as visual reference cards in the workspace with a distinct emerald-green `FILES API` badge (`VideoAssetCard` and `VisualAssetCard`), featuring local video/image preview playback using temporary browser blob URLs.
- **Files API Multi-modal Generation & History Persistence.** The server-side generation handler (`app/api/generate/route.ts`) seamlessly accepts `fileUri` references in `fileData` parts alongside inline Base64 data and YouTube URLs. Files API media references are preserved across workspace history items with `isFilesApi`, `fileUri`, and `expirationTime` metadata, allowing users to recall and re-run generations referencing Files API URIs within their 48-hour active window.
- **Token usage tracking and estimated API cost.** A comprehensive token tracking and cost estimation system was introduced with the new `lib/pricing.ts` module containing a full model pricing configuration table covering 6 Gemini models (Gemini 3.6 Flash, 3.5 Flash, 3.5 Flash-Lite, 3.1 Pro Preview with tiered ≤200K / >200K pricing, 3.1 Flash-Lite, and 3 Flash Preview) with audio input rate support and model alias resolution. Server-side SSE streaming in the generation handler (`app/api/generate/route.ts`) now captures `usageMetadata` (prompt token count, candidates/output token count, total token count, and cached content token count) from each Gemini API stream chunk and broadcasts them as `usage` events to the client. The `GenerationResultView` output panel header was enhanced to display real-time token counts (`TOKENS: {total} ({prompt} IN [{cached} CACHED] / {candidates} OUT)`) and an emerald-green estimated API cost badge alongside the character count. The `EngineControlsModal` model selector cards now display per-model IN/OUT pricing rate badges in the footer of each card. Token usage data is persisted in `HistoryItem` objects via a `tokenUsage` field and an `estimatedCost` string (computed and stored at generation time via `calculateEstimatedCost()`), with both displayed as badges in `HistoryCardSummary` (token count + cost), surfaced in `HistoryViewerModal` detail panels, and preserved across history JSON import/export. Cost display prefers the stored `estimatedCost` field over recomputation from raw `tokenUsage` to ensure stable display even if future pricing updates change the underlying rates. The active token usage state is also persisted to `localStorage` (`prompt_generator_token_usage`) so it survives page refreshes alongside other session state.

### Fixed

- **Files API Pre-Verification & Automatic Base64 Fallback.** Enhanced the generation pipeline (`app/api/generate/route.ts`) to pre-verify `fileUri` resources with `ai.files.get()` before invoking `generateContentStream()`. If a Files API asset is inaccessible (due to 48-hour expiration or API key mismatch), the system automatically falls back to inline Base64 data if available in the workspace asset payload. If Base64 is unavailable, it reports a clear, asset-specific error identifying the exact image/video tag (e.g. `@image1 as Character Name`) and resource ID with step-by-step resolution instructions.
- **Gemini Stream Error Formatting & Files API 403 Permission Error Handling.** Fixed SSE error stream parsing in `app/page.tsx` (`handleGeneratePrompt`) where stream errors like `403 PERMISSION_DENIED` on Files API file references were swallowed internally within `parseLine` without triggering `setError()` or halting the UI loading/thinking states. Both the server-side generation route (`app/api/generate/route.ts`) and client-side stream parser now unwrap stringified nested JSON error objects returned by GoogleGenAI SDK into clean, human-readable text. For `403 PERMISSION_DENIED` errors on Files API assets (which occur when files expire after 48 hours or were uploaded using a different API key), the system now provides clear actionable guidance explaining that Files API assets are bound to the specific API key used during upload and expire after 48 hours, prompting the user to re-upload or re-select an active file.
- **In-Modal Deletion Confirmation for Gemini Files API Resources.** Replaced native browser `confirm()` and `alert()` dialogs in `AddFilesApiModal.tsx` with an inline, in-modal deletion confirmation banner. Browser native pop-ups are frequently blocked or suppressed inside preview iframe environments, which caused clicking the trash button to silently fail. The new UI displays a red inline confirmation card with "Cancel" and "Confirm Delete" buttons directly within the modal, along with real-time loading state and inline error alerts on deletion failures.
- **Empty String `src` Attribute Prevention for Media Elements.** Updated image and video components (`components/VisualAssetCard.tsx`, `components/VideoAssetCard.tsx`, `components/AssetLibrarySidebar.tsx`, `components/AssetImportModal.tsx`, `components/HistoryViewerModal.tsx`, and `components/VideoPlayerModal.tsx`) to rigorously sanitize image and video sources. Instead of passing empty string (`""`) values to `<img>`, `<video>`, or `<iframe>` `src` attributes when media data is missing or pending (such as Files API assets loaded without inline Base64 streams), components now render clean fallback placeholder UI or pass non-empty sanitized values, eliminating browser console warnings and unwanted page re-downloads over the network.
- **Base64 Decoding Error on Files API Media References.** Fixed an issue where Files API uploaded image and video references were causing Base64 decoding errors (`INVALID_ARGUMENT`) during prompt generation. The server-side generation proxy (`app/api/generate/route.ts`) now checks `fileUri` and `isFilesApi` flags on uploaded media items to correctly construct `fileData` parts instead of attempting to parse temporary client-side `blob:` preview URLs as Base64 data.
- **413 Request Entity Too Large Prevention for Large File Uploads.** Implemented a robust chunked uploading mechanism for the Gemini Files API uploader. The client (`components/AddFilesApiModal.tsx`) splits large media files into 2 MB chunks uploaded sequentially with a session `uploadId`. The backend endpoint (`/app/api/upload-file/route.ts`) stages incoming chunks in system temp storage (`start`, `chunk`, `finish`, `cancel` actions) before streaming the reassembled file to Google's Gemini Files API via `@google/genai`. This completely eliminates HTTP 413 "Request Entity Too Large" errors when uploading large high-resolution video and image assets up to 2 GB while providing real-time percentage progress feedback in the modal.
- **Preset edit indicator and selection preservation in Configure Prompts modal.** When editing the system prompt or prompt template in the Configure Prompts modal, the loaded preset selection is now preserved even if the current prompt texts do not match any preset exactly. The modified preset displays an animated `[EDIT]` badge (in amber) alongside the preset name in the list, providing a clear visual indicator that custom edits have been applied to that preset without deselecting it. The active `loadedPresetId` is persisted in `localStorage` (`prompt_generator_loaded_preset_id`) so the loaded preset selection and its modified state survive page reloads and modal re-openings. A `[Deselect]` option in the modal allows users to clear the active preset association at any time.

---

## [v2.2.0] — July 26, 2026

### Added

- **Multi-project workspace support.** A comprehensive project management system (`lib/projects.ts`) replaces the single-workspace model with a multi-project architecture backed by IndexedDB. Users can now create, rename, switch, and delete independent workspaces, each with its own system prompt, prompt template, custom presets, generation history, and asset library. A new `ProjectManagerModal` component (`components/ProjectManagerModal.tsx`) provides a full-screen interface for browsing, searching, and managing all projects with a toggleable grid/compact view.
- **Backward-compatible project migration.** On first access after the upgrade, legacy `localStorage` session data (prompts, presets, history, and asset library images) is automatically detected and migrated into a "Main Workspace" default project via `initProjects()`, ensuring no existing data is lost. The active project's configuration is synced to the legacy `localStorage` keys transparently, so all existing workspace components continue to function without modification.
- **Project import/export with image bundling.** Projects can be exported as versioned JSON files (`promptlab_project` v1.0) that bundle the full project configuration alongside all asset image blobs retrieved from IndexedDB via `exportProjectJSON()`. Exported files use a standardized naming convention (`promptlab_{projectSlug}_project_backup_{date}_{time}_{uniqueId}.json`). Import via `importProjectJSON()` validates the payload, restores images to IndexedDB, and automatically handles project name collisions with incrementing suffixes.
- **"Copy from Current" project creation.** When creating a new project, users can optionally clone the active workspace's system prompt, prompt template, custom presets, and asset library into a fresh project, providing a quick starting point for variant exploration without losing the original workspace state.
- **Cross-tab project synchronization.** A `BroadcastChannel`-based sync mechanism (`promptlab_project_sync_channel`) broadcasts project switch, update, create, and delete actions across open browser tabs. The `subscribeProjectChanges()` / `broadcastProjectChange()` utilities in `lib/projects.ts`, paired with listeners in `app/page.tsx`, keep the project dropdown and active workspace in sync across tabs.
- **Project switcher in AppHeader.** A compact project selector dropdown in the top navigation bar displays the current project name and enables one-click switching between workspaces without opening the full `ProjectManagerModal`.
- **Quick Preset Selector in AppHeader.** A new `QuickPresetSelector` component (`components/QuickPresetSelector.tsx`) provides rapid switching between system and custom prompt presets directly from the top navigation bar, reducing the need to open the Configure Prompts modal for preset changes. Includes state management for template variables, preset persistence, and active preset tracking within the main application flow.
- **Collapsible generation result section.** The generation output panel in `GenerationResultView` (`components/GenerationResultView.tsx`) now supports collapsible sections, allowing users to collapse the output area for a tidier workspace. The collapsed/expanded state is persisted in localStorage for session-to-session continuity.
- **Preset timestamp metadata.** Presets now include `createdAt` and `updatedAt` timestamp fields, enabling users to track when each preset was first saved and last modified. This applies to both system presets (loaded via `/api/prompt-config`) and custom user presets (stored in localStorage), with corresponding updates to the `UserPreset` interface in `lib/preset-export.ts` and the `PresetCompareModal`.
- **Date-based preset sorting.** The preset list in the Configure Prompts modal now supports date-based sorting options in addition to alphabetical sorting. A new `formatPresetDateShort` helper function in `lib/utils.ts` provides consistent date formatting across the workspace.
- **Thinking process visualization.** The "Engine Reasoning Trace" console in `GenerationResultView` (`components/GenerationResultView.tsx`) was redesigned with a collapsible panel featuring a pulsing amber dot (`animate-pulse`) and `PROCESSING` badge during active thinking (or green dot + `COMPLETED` badge when finished). During streaming, the latest parsed reasoning block is displayed as a slideshow card with a `slideFadeIn` animation; when complete, the full log renders in a scrollable `max-h-[180px]` text block supporting markdown-formatted reasoning content. Auto-collapse behavior hides the reasoning trace once generation output starts streaming. The server-side generation handler (`app/api/generate/route.ts`) now sends `includeThoughts: true` to all models (the model-name gate on `thinkingConfig` was removed), enabling reasoning/thought output universally. A new `@keyframes slideFadeIn` animation class (`.animate-slide-fade-in`) in `globals.css` provides smooth section transitions. Thinking results (`thinkingResult`) are persisted in `HistoryItem` objects and restored from `localStorage` so reasoning traces survive history save and recall.
- **Live output character count badge.** A `{N} CHARS` badge using `toLocaleString()`-formatted numbers appears next to the copy/expand buttons in `GenerationResultView` when generation output is present, providing immediate feedback on output length.
- **Enhanced copy button with icons.** The generation output copy button was redesigned with `Copy` and `Check` (checkmark on success) lucide-react icons alongside the text label, replacing the plain text-only button with a polished icon+text layout.
- **History card summary component.** A new reusable `HistoryCardSummary` component (`components/HistoryCardSummary.tsx`) renders a detailed preview card for history items showing timestamp (24-hour format), media badges (IMG/VID counts), model badge, preset badge, title/idea excerpt, and a cleaned markdown-free output excerpt (truncated to ~220 characters). This component is integrated into `LoadWorkspaceConfirmModal`, `DeleteHistoryConfirmModal`, and `HistorySection` for consistent, rich history previews throughout the application.
- **Fuzzy search utility with tokenized matching.** New `lib/search-utils.ts` module providing `normalizeText()` (hyphen, underscore, and punctuation normalization) and `matchesSearchQuery()` (multi-word token matching with combined raw + normalized target scanning). History search now correctly matches hyphenated terms (e.g., "sci-fi" ↔ "sci fi") and supports keyword-based queries across all search scopes.
- **Clear search button in history viewer.** A dismiss `X` button inside the search input in `HistoryViewerModal` allows one-click clearing of the active search query, matching platform search bar conventions.
- **Output excerpt preview in history list items.** History items in the `HistoryViewerModal` sidebar list now display a 2-line italic excerpt of the cleaned generation output (markdown symbols stripped, ~140 characters), giving users quick context without needing to open the detail panel.
- **Auto-scroll to selected history item.** When opening the `HistoryViewerModal` or switching between history items, the selected list item now smoothly scrolls into view (`scrollIntoView` with `behavior: "smooth"`), ensuring the active item is always visible in long history lists.

### Fixed

- **Standardized section collapsible chevrons.** Standardized accordion/section chevron icons across `VisualAssetsSection`, `LabManualSection`, `HistorySection`, and prompt preset list accordions to follow standard UI conventions: pointing Right (`ChevronRight` `>`) when collapsed and Down (`ChevronDown` `v`) when expanded.
- **Project management stability and sync.** Added an `isSwitchingProjectRef` guard in `app/page.tsx` to prevent auto-save and asset-library callbacks from firing during active project switches, eliminating state race conditions. Added fallback initialization in `handleProjectsUpdated()` to auto-create a default workspace when zero projects exist. Enhanced project deletion flow in `ProjectManagerModal` to ensure the active project correctly falls back to the next available project. Updated the persistence layer in `lib/projects.ts` to support both legacy and current history storage keys. Refined `AssetLibrarySidebar` state synchronization during project switches to prevent stale asset references.

### Changed

- **Compact 5-column visual asset grid.** The asset card grid in `VisualAssetsSection` was refined from 4 columns to `md:grid-cols-3 lg:grid-cols-5`, with reduced internal padding and gaps in `VisualAssetCard`, `VideoAssetCard`, and the drag-and-drop uploader for a denser, more space-efficient layout.
- **Hover preview preserves original image aspect ratio.** Image hover previews in `VisualAssetCard` now use `object-contain` with dynamic `w-fit max-w-[340px]` container sizing instead of a fixed 280px width, displaying each reference image at its natural proportions rather than a rigid square preview box.
- **HistorySection header restructured.** The inline "Clear All" button was removed from the sidebar section (now accessible only via the full `HistoryViewerModal`), making the `setIsHistoryClearConfirmOpen` prop optional. Expand/collapse chevrons were moved to the left side adjacent to the section label. The overall header layout was reorganized for cleaner separation of filter tabs and action buttons.
- **History Viewer sidebar visual refresh.** Selected list items now display a warm amber highlight (`bg-[#FEF3C7]`) instead of a simple dark left-border. Non-selected items received a transparent left border for consistent horizontal alignment. Card padding was tightened (`px-3 py-2.5`), timestamp styling enhanced, and titles use single-line truncation (`line-clamp-1`) for cleaner scanning.
- **Default history search simplified to title-only.** The "Default" search scope no longer matches against timestamp or model fields, focusing exclusively on the history item's title/name for more predictable and relevant search results.
- **Unified export filename convention.** All export types (assets, history, presets, project backups) now follow a consistent naming pattern: `promptlab_{projectSlug}_{feature}_{date}_{time}_{uniqueId}.json`. A shared `slugify()` helper utility across export modules produces clean, filesystem-safe slug strings from project names. Asset library JSON exports are now pretty-printed (`JSON.stringify` with 2-space indentation) for readability. The `projectName` prop is threaded through `AssetLibrarySidebar`, `HistoryViewerModal`, and `ExportPresetsToJSON` to enable project-aware filenames.

### Architecture & Refactoring

- **Extracted VisualAssetsSection component.** Extracted the visual reference assets, casting maps, drag-and-drop uploader, YouTube URL trigger, library browser, error/warning alerts, image cards, and video cards from `app/page.tsx` into a modular, standalone component (`components/VisualAssetsSection.tsx`). Added section collapsibility with a `ChevronDown` toggle icon beside the title and persistent open/collapsed state saved in localStorage (`prompt_generator_visual_assets_open`).
- **IndexedDB schema upgrade.** The database version was bumped from v1 to v2, adding a new `projects` object store alongside the existing `images` store. Project data (configuration, presets, history, and asset metadata) is persisted in IndexedDB rather than localStorage, removing the ~5–10MB quota constraint for session data.
- **Centralized search utilities** in `lib/search-utils.ts`. The `normalizeText()` and `matchesSearchQuery()` functions provide consistent fuzzy search behavior with hyphen/punctuation normalization across the application, extracted from the history viewer for potential reuse in asset library and preset search.

---

## [v2.1.0] — July 24, 2026

### Added

- **Markdown-enabled generation result view.** Extracted generation output into a dedicated `GenerationResultView` component and added `react-markdown` rendering with a Formatted Markdown / Raw Monospace toggle. Users can now switch between richly rendered markdown output (headings, lists, bold, inline code, etc.) and the traditional plain-text monospace view within the output panel.
- **YouTube URL video references.** Added an "ADD YOUTUBE URL" button next to "Browse Library" in the Visual Assets header. Users can enter any YouTube URL (`youtube.com/watch?v=...` or `youtu.be/...`) and map it to a custom label. YouTube URLs are transmitted to the Gemini API as `fileData` parts (`fileUri`), mapped to unified `@videoN` annotations, and previewed via embedded iframe in `VideoPlayerModal`.
- **Multi-modal video reference support.** Uploaded MP4 videos and YouTube URLs are now supported alongside images. Videos are validated (`validateAndProcessVideo` — MP4 only, ≤30 seconds, ≤35 MB), Base64-encoded, and combined with images into a single `referenceTags` array server-side, producing a consolidated `{{ visual_references }}` variable. Video metadata persists in history, JSON exports, and imports.
- **VideoAssetCard component.** Reusable UI card (`components/VideoAssetCard.tsx`) with three-state rendering: YouTube (thumbnail + iframe embed), cached local MP4 (HTML5 preview), and uncached historical MP4 (**NO LOCAL STREAM** placeholder with `Film` icon and `UNCACHED MP4` badge). Video type badges (`YT` in red, `MP4` in stone) provide immediate visual identification.
- **VideoPlayerModal component.** Full-screen modal (`components/VideoPlayerModal.tsx`) for previewing uploaded MP4 videos (HTML5 controls) and YouTube references (embedded iframe) before generation or from history.
- **Video history tracking.** The `HistoryItem` interface now includes an optional `videos` field persisting video metadata (label, mimeType, duration, youtubeUrl). History recall restores videos with base64 stream preservation for same-session playback. History cards display purple `{N} VID` badges alongside `{N} IMG` badges. Video-aware search matches both image and video labels. YouTube cards in history detail view offer interactive `[YT ▶ PLAY]` previews.
- **Custom YouTubeIcon SVG component.** Replaced all `lucide-react` `Youtube` icon imports with a dedicated inline SVG component (`components/YouTubeIcon.tsx`), ensuring consistent YouTube branding across `VideoAssetCard`, `VideoPlayerModal`, `AddYouTubeModal`, and `HistoryViewerModal`.
- **Asset library JSON export and import.** A compact `AssetExportDropdown` supports exporting All or Selected images as versioned JSON files. An `AssetImportModal` handles importing previously exported library files with automatic duplicate detection and a processing summary.
- **History diff compare.** A `[Diff]` button in the `HistoryViewerModal` detail panel opens the shared `PresetCompareModal` to show line-by-line differences between a saved history item's system prompt/prompt template and the current active workspace, enabling users to audit how their prompt configuration has evolved over time.
- **Optional Core Idea.** Generation no longer requires the Main Objective / Idea field to be filled. Users can now synthesize sequences using only other prompt parameters or pure templates.
- **PromptTemplateHelpTooltip component.** A contextual help tooltip (`components/PromptTemplateHelpTooltip.tsx`) provides inline guidance on `{{ variable }}` syntax for prompt templates, replacing the previous workspace-wide alert banner.

### Fixed

- **Empty-string prompt inputs no longer overwritten by template files.** The server-side generation handler now uses explicit `undefined`/`null` checks instead of falsy checks (`!systemPrompt`), preventing empty strings from being silently replaced with filesystem template defaults.
- **History card preset badges for custom prompts.** History entries with stored `systemPrompt` or `promptTemplate` but no explicit preset label now display a `CUSTOM` badge, ensuring all entries have visible source attribution in the history browser.
- **YouTube thumbnail graceful degradation.** YouTube thumbnails that fail to load now hide the broken image element via an `onError` handler and fall back to a `YouTubeIcon` placeholder with the video ID, rather than rendering a broken image.

### Changed

- **Simplified history item loading logic.** Removed redundant `setState` and `localStorage.setItem` calls in `handleLoadHistoryItem`, allowing the centralized state management flow to handle prompt/template restoration during history recall.
- **Simplified prompt reset.** The "Reset Prompts" action now clears the preset editor client-side instead of fetching defaults from the API, providing instant feedback without a network round-trip. This also deselects any loaded preset.

### Architecture & Refactoring

- **AppHeader component.** Extracted the top navigation bar (logo, Asset Library, Engine Controls, Configure Prompts, and Clear Session buttons) into a dedicated `components/AppHeader.tsx` component with a clean `AppHeaderProps` interface.
- **FooterStatusBar component.** Extracted the bottom status bar (engine model, reasoning level, and temperature display) into `components/FooterStatusBar.tsx`.
- **LabManualSection component.** Extracted the collapsible quick-start guide sidebar section into `components/LabManualSection.tsx`.
- **MainIdeaSection component.** Extracted the Main Objective / Idea textarea section into `components/MainIdeaSection.tsx`.
- **ParameterInputsSection component.** Extracted the dynamic parameter form inputs section into `components/ParameterInputsSection.tsx`.
- **Confirmation modal extraction.** Four confirmation dialogs were extracted from the monolithic page into standalone components: `ClearSessionConfirmModal`, `DeleteHistoryConfirmModal`, `DiscardChangesConfirmModal`, and `LoadWorkspaceConfirmModal`. Each accepts a focused set of props and manages its own layout and accessibility.
- **page.tsx reduction.** The main workspace file was slimmed by approximately 475 lines (net reduction) through the extraction of 9 reusable components, improving maintainability and separation of concerns without changing any user-facing behavior.

---

## [v2.0.0] — July 22, 2026

### History Management

- **Clear history with a dedicated confirmation modal.** Clicking "Clear All History" opens a warning dialog before permanently deleting all history items and their associated images from IndexedDB.
- **Full-screen HistoryViewerModal.** Browse, search, rename, and load previously saved prompt iterations with full metadata — timestamp, model, temperature, and thumbnail previews.
- **Favorite toggle and filter tabs.** Mark generation entries as favorites for quick access. Three filter tabs (All, Favorites, Recent) help narrow down entries.
- **Collapsible history section in the sidebar.** An inline expandable panel (`HistorySection`) shows recent generations without opening a full modal.
- **History JSON import and export.** Export history data as JSON files for backup or cross-device migration. Exported filenames include the date, a compact timestamp, and a unique 4-character suffix. Import files back through the HistoryViewerModal.
- **Visual badges on history items.** Each entry shows metadata like model and generation status at a glance.
- **Legacy history auto-cleanup and format migration.** Old-format entries are automatically migrated to the current format on app load.
- **Deterministic variable storage.** History entries now store clean, resolved copies of template variables, eliminating stale or misleading dynamic parameter values on recall.
- **Decoupled history image IDs.** History images use unique `hist-img-{timestamp}-{idx}-{random}` identifiers completely independent of active session image IDs. Deleting or modifying images in the current session never breaks previously saved historical references.

### API Key Vault

- **Multi-key vault with add, switch, and delete.** Manage multiple labeled Gemini API keys from a single vault in the Engine Controls modal. Any existing legacy single keys are automatically migrated into the vault on first access.
- **Collapsible vault section.** The vault panel can be collapsed when not actively managing keys, reducing visual clutter.
- **Active key label in the workspace footer.** The label of the currently selected custom API key is displayed next to the system status indicator, so you always know which key is in use.

### Asset Library

- **Persistent image library sidebar.** Upload, browse, search, rename, and delete reference images stored in IndexedDB independently of any workspace session. Upload deduplication prevents storing the same image twice.
- **Cross-workspace image reuse.** Add library images to the active workspace with a single click, automatically creating `@imageN` references with the library label.
- **Resizable sidebar width.** Drag the divider to adjust the Asset Library sidebar width; the setting is persisted in localStorage for future sessions.
- **Dedicated VisualAssetCard component.** Reusable card layout with hover preview, shared between the workspace sidebar and the asset library for consistent asset display.

### Presets & Configuration

- **Update existing presets.** The sidebar now offers a dual-mode control panel with "Update Preset" (overwrite the selected preset) and "Save As New" (create a cloned copy), alongside a "[Deselect]" button to start a fresh workspace.
- **Active and edited state tracking.** Visual badges show `[ACTIVE]` in emerald when a preset matches the editor content, and `[EDITED]` in pulsing amber when the editor has diverged from the saved version.
- **Preset search and three-tab filtering.** Search presets by name and filter with a three-tab toggle (All, System, User) showing count badges. The active tab selection is persisted across sessions.
- **Workspace actions dropdown.** Import JSON, Export JSON, and Reset to TXT Files are consolidated into a single compact "Config Options" menu, freeing sidebar space.
- **Discard confirmation on unsaved changes.** Closing the Configure Prompts modal or pressing ESC with unsaved edits now prompts a confirmation dialog to prevent accidental data loss.

### Preset Compare & Diff Viewer

- **Side-by-side diff viewer.** When browsing presets, a "Compare" button opens a full-screen modal showing line-by-line differences between the current editor content and the selected preset's configuration.
- **Unified and split views.** Toggle between inline (unified) and side-by-side (split) diff layouts with green/red color-coded additions and deletions.
- **"Changes Only" filter.** A git-style context-window filter collapses unchanged regions to 3-line context blocks with `<skipped N lines>` markers, toggleable to full file view.
- **Built on a custom LCS diff engine.** A Longest Common Subsequence algorithm (`computeLineDiff`) generates precise line-by-line change data with line number tracking for accurate comparisons.

### Preset Export & Import

- **Bulk export dropdown.** A compact dropdown menu (`PresetExportDropdown`) in the Configure Prompts modal header supports exporting user presets in bulk with three modes: Export All, Export Favorites, and Export Active Preset. Each option shows a live count badge.
- **Versioned export payload.** Exports produce a JSON file (`promptlab_presets_{tag}_{date}_{time}_{uniqueId}.json`) conforming to the `PresetExportPayload` interface with version 1.0, export timestamp, type tag, item count, and an array of `UserPreset` objects.
- **UserPreset interface.** Defined in `lib/preset-export.ts`, each preset carries an `id`, `name`, `systemPrompt`, `promptTemplate`, and optional `isFavorite` flag, shared between the Configure Prompts modal and the export dropdown.
- **Duplicate-aware import.** The `importPresetsFromJSON` utility validates imported JSON structure (accepts raw arrays, `presets`-wrapped arrays, `items`-wrapped arrays, or single objects). Duplicates are detected by matching both ID and name+content combinations, with skipped entries reported in the import summary.
- **Favorite/pinned reconciliation.** The export utility reconciles `isFavorite` status using `pinnedPresetIds`. On import, any preset marked as favorite/pinned is automatically added to the pinned IDs set.
- **Filename conventions.** Export filenames include the date (YYYY-MM-DD), a compact timestamp (HHMMSS), and a unique 4-character random suffix. For active preset exports, the preset's slugified name is used as the tag instead of the export type.

### Engine Controls

- **Dedicated EngineControlsModal.** All engine configuration — model selection, temperature, reasoning effort, max tokens, and API key vault — was extracted from the main workspace into a focused modal dialog.
- **Collapsible advanced settings.** Temperature and max output token controls are hidden behind an expandable "Advanced" section to reduce clutter.
- **Updated model selection interface.** The model picker and its surrounding UI were redesigned for clearer navigation and feedback.

### UI Improvements

- **Live character count badge.** A `{N} CHARS` badge appears next to the "Generation Result" header whenever output is present, giving immediate feedback on output length.
- **Truncated long titles and names.** History idea titles exceeding 100 characters are truncated to prevent layout breakage. Overly long preset names in modals are also truncated to keep confirmations readable.
- **Updated application icons.** All favicon and app icon assets were refreshed across platforms (favicon, Android Chrome, Apple touch icon, and logo).
- **Polished input transitions.** The idea textarea transition was changed to colors-only to prevent subtle layout shifts on focus.

### Architecture & Documentation

- **Centralized IndexedDB helpers** in `lib/indexeddb.ts`. Database open, save, get, and delete operations are shared across components, eliminating code duplication.
- **Centralized utility functions** in `lib/utils.ts`. URL helpers, the LCS diff engine, and image compression logic were extracted from the main page for better code organization and reusability.
- **History export utilities** in `lib/history-export.ts`. JSON import and export logic is encapsulated in a dedicated module for maintainability.
- **Preset export utilities** in `lib/preset-export.ts`. Bulk JSON export and import logic for user presets with duplicate detection and pinned-id reconciliation, shared across the Configure Prompts modal and the PresetExportDropdown component.
- **Vercel Analytics** integrated in the root layout for deployment observability.
- **Updated project documentation.** AGENTS.md and README.md were refreshed to document all new features including the Asset Library, Preset Compare, and Search/Filtering capabilities.

---

## [v1.0.0] — July 12, 2026

Initial release of PromptLab.

### Core Engine

- Dynamic template system with auto-generated form fields from `{{ placeholder_variables }}` in the prompt template.
- Real-time text streaming via Server-Sent Events (SSE) with client-side chunk buffer reassembly for reliable parsing.
- Reasoning trace separation — for models supporting thinking/reasoning, the engine's internal thought process is displayed in a dedicated console alongside the main generation output.
- Strict plain-text output formatting with zero Markdown symbols, producing clean, readable scripts.
- Server-side Gemini API proxy (`/app/api/generate/route.ts`) — the API key never touches the client.

### Image Handling

- Drag-and-drop image uploads with `@imageN` casting annotations mapped to character or setting labels.
- Automatic JPEG compression (90% quality) via HTML Canvas, with white background fill for PNG transparency handling.
- IndexedDB image storage (`promptlab_db`) avoiding browser localStorage quota limits (5–10MB vs hundreds of MB).
- Metadata separation — only image metadata stored in localStorage; raw Base64 blobs stored exclusively in IndexedDB.
- Images smaller than ~40KB bypass the compression pipeline automatically.

### Presets & Configuration

- Three built-in presets: AI Casting & Screenplay, AI Director & Storyboard, and VFX & Speculative Worldbuilder.
- Custom preset CRUD — save, load, and delete user presets via localStorage, managed independently from filesystem presets.
- JSON import and export for presets.
- URL preset import via query parameters (`?presetUrl=`, `?configUrl=`, `?preset=`, or `?config=`) with automatic GitHub blob-to-raw URL conversion and an import confirmation modal.

### Engine Controls

- Model selection (default: Gemini 3.5 Flash, with 3.1 Flash Lite and 3.1 Pro options).
- Temperature control (0.0 to 2.0, default 1.0).
- Reasoning effort levels: MINIMAL, LOW, MEDIUM (default), and HIGH.
- Custom API key override stored in localStorage and securely proxied server-side.
- Max output token threshold.
- Workspace footer shows active engine, reasoning level, and temperature.

### Session Management

- Input persistence in localStorage — template variables, prompts, and engine settings survive page refreshes.
- Collapsible history panel with past generation recall — clicking a history card restores the full workspace state including templates, variables, and image references (loaded from IndexedDB).
- Clear session with confirmation dialog.
- Collapsible Lab Manual quick-start guide with 4-step walkthrough, persisted open/closed state.
- Collapsible sections in the Configure Prompts modal (System Presets, Custom Presets, Lab Manual) with persisted state.

### UI/UX

- Escape key closes modal dialogs.
- Custom branding — logo, favicon, and app icons across all platforms.
- Responsive layout with dedicated input sidebar and output panel.
- Analog Brutalist Retro Lab aesthetic with Inter, JetBrains Mono, and serif typography.