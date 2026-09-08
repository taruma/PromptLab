## v2.7.0: Stage. Render. Stream.

**PromptLab v2.7.0** introduces a breakthrough visual output pipeline, dedicated split-screen drafting capabilities, and a comprehensive memory-safe backup overhaul. This release debuts the **Auteur Script Visualizer** (`AuteurScriptView`), rendering structured procedural prompt outputs into dynamic macro-states, collapsible staging blocks, and compact execution cards with zero-overhead format auto-detection. Alongside it, the new **Output Renderer** (`OutputRendererModal`) delivers an edge-to-edge split-screen workspace with live multi-mode preview, persistent local drafting, and full-height **Lossless PNG Export** at 2x retina sharpness (`html-to-image`). Under the hood, a unified **v1.1 Content-Addressable Image Pool** and **Chunked Streaming Blob Serialization** across **Project Workspaces**, **Asset Library**, and **User Presets** completely eliminates V8 single-string heap crashes (`RangeError`), coupled with rich pre-import visual inspection dashboards, duplicate-detection intelligence, scope controls, and defensive package validation.

---

### ✨ Highlights

#### 🎬 Auteur Script Visual Rendering Pipeline & Quad-Surface Integration

PromptLab now provides first-class visual rendering for prompt templates producing procedural scripts divided into staging protocols and execution state-machines:

- 🎭 **Dedicated Retro Lab Visualizer (`AuteurScriptView.tsx`)** — transforms raw procedural text into structured, high-density retro lab components featuring collapsible staging directives and compact execution timeline cards.
- 🧩 **Schema-Tolerant Dynamic Parser (`lib/auteur-parser.ts`)** — employs an open-ended dynamic regex pattern `\[([A-Z0-9 _%-]+)\]` to parse arbitrary macro-blocks (`[INTENT]`, `[LOGIC]`, `[CONTINUITY PROTOCOL]`, `[REFERENCES]`, `[EXECUTION]`) without rigid whitelists. Dynamically extracts sub-states (`STEP 1`, `STATE 1`, `1.`, etc.) into structured action, speech, and metadata channels.
- ⚡ **Zero-Overhead Smart Auto-Detection (`isAuteurScript`)** — lightweight regex detector immediately identifies Auteur Script formatted outputs without parsing latency, dynamically surfacing the `AUTEUR` view toggle in output toolbars.
- 📂 **Persistent Collapsible Staging (`localStorage`)** — auxiliary staging blocks (`[INTENT]`, `[LOGIC]`, etc.) remain visible and uncollapsed by default for immediate auditing, with interactive collapse toggles persisted across sessions under `prompt_generator_auteur_collapsed_staging`. The primary `[EXECUTION]` payload is permanently locked open.
- 🎚️ **Calibrated Typography Scale** — specifically calibrated font sizing prevents reading fatigue: `text-[12.5px]`–`13px` (`font-mono`) with `leading-relaxed` for dialogue and visual actions, `text-[11px]`–`11.5px` for sub-state pills, and `text-[9px]`–`10px` for technical instrumentation metadata.
- 🔲 **Quad-Surface Parity** — fully integrated across all four generation, history, and editing surfaces:
  1. Main Generation Result panel (`GenerationResultView.tsx`)
  2. History Detail Viewer (`HistoryOutputViewer.tsx`)
  3. Distraction-Free Fullscreen Focus Modal (`HistoryFullscreenOutputModal.tsx`)
  4. Output Renderer Split Workspace (`OutputRendererModal.tsx`)

---

#### 🖥️ Output Renderer Split-Screen Workspace & Lossless PNG Export

A dedicated split-screen creative workspace for formatting, drafting, and previewing generation outputs or arbitrary prompt text:

- 🌐 **Top Header Navigation Trigger (`AppHeader.tsx`)** — retro cyan navigation button (`Renderer`, `#output-renderer-header-btn`) with `Eye` icon provides instant access to the renderer from anywhere in the workspace.
- 🪟 **Distraction-Free Split Workspace (`OutputRendererModal.tsx`)** — full-bleed split dialog (Tier 2 `z-50`) registered with the universal LIFO Escape key stack (`useModalEscape`) and compound modal safety gates (`isAnyModalActive`).
- ✍️ **Edge-to-Edge Source Editor** — full-height monospace text editor equipped with live line and character counters, alongside one-click "Workspace" (import active generation result) and "Clear" actions.
- 💾 **Persistent Draft Text (`localStorage`)** — preserves editor text across modal open/close cycles and page refreshes (`prompt_generator_output_renderer_draft`), adhering to a strict non-destructive invariant that never overwrites user text automatically.
- 📸 **Full-Height Lossless Retina PNG Export (`lib/image-export.ts`)** — integrated export button (`Camera` icon) in the preview toolbar measures the unconstrained `scrollHeight` of rendered output using `html-to-image` at 2x retina pixel ratio (`pixelRatio: 2`). Captures extensive long-form outputs and complete Auteur Script timelines in a single seamless, uncropped image with standardized filenames: `screenshot_promptlab_{projectSlug}_{viewMode}_{YYYY-MM-DD}_{HHMMSS}_{uniqueId}.png`.

---

#### 🔀 Unified Multi-Mode Output Pipeline & Codebase Deduplication

Generation output rendering across the entire application has been unified into a single, high-craft architecture:

- 🎛️ **Universal Multi-Mode Output View (`MultiModeOutputView.tsx`)** — reusable 4-mode viewer component implementing segmented controls:
  - **MD** — Formatted Markdown with custom-styled typography, tables, and code fences
  - **RAW** — Monospace plain text preserving whitespace and lineation
  - **JSON** — Syntax-highlighted JSON with line numbers, token color coding, and line counters
  - **AUTEUR** — Procedural script visualization with collapsible staging blocks
- 🧹 **Shared Output Helpers (`lib/output-render-helpers.tsx`)** — centralized JSON extraction (`extractCleanJson`), JSON line syntax highlighting (`highlightJsonLine`), and brutalist Markdown typography mappings (`outputMarkdownComponents`).
- 🚀 **Eliminated 450+ Lines of Duplication** — refactored `GenerationResultView.tsx`, `HistoryOutputViewer.tsx`, and `HistoryFullscreenOutputModal.tsx` onto the unified rendering engine.

---

#### 📦 Project Workspace Backups: v1.1 Image Pool, Scope Controls & Pre-Import Inspection

Multi-project workspace backup and migration has been overhauled for crash-proof scalability, data integrity, and complete inspection visibility:

- 🛡️ **Critical History Image Preservation Fix** — resolved an issue where project backups previously omitted reference images attached to generation history records. Both `assetLibrary` and `project.history` images are now aggregated into a single unified export pool.
- 🗜️ **v1.1 Deduplicated Image Pool** — stores unique image Base64 payloads once in a top-level `images: Record<string, string>` dictionary keyed by SHA-256 `contentHash` (or fallback ID), stripping inline payloads from individual history items (`img.base64 = ""`).
- 🌊 **Chunked Streaming Blob Serialization** — streams discrete string parts directly into `new Blob(chunks, { type: "application/json" })`, bypassing the V8 single-string memory ceiling (~512MB) and eliminating `RangeError: Invalid string length` crashes on large projects.
- 🎛️ **Configurable Export Scope Modal (`ProjectExportModal.tsx`)** — Tier 3 (`z-[60]`) dialog providing 3 quick-scope presets:
  - **Full Backup** — complete archive with prompts, presets, assets, and full history with images
  - **Compact History** — all prompts, presets, assets, and history text/metrics with history images stripped for lightweight sharing
  - **Starter Template** — prompts, presets, and assets only; zero history records
- 🔍 **Pre-Import Inspection Dashboard (`ProjectImportConfirmModal.tsx`)** — Tier 3 (`z-[60]`) inspection dialog featuring a real-time summary breakdown ribbon (`PRESETS`, `HISTORY`, `ASSETS`, `IMAGES`), project name collision resolution with auto-incrementing suffixes, prompt inspection tabs, and an auto-switch toggle.
- ⚡ **Event-Loop Yielding Hydration** — pre-hydrates IndexedDB `images` store in batches of 10 with `setTimeout(0)`, ensuring a fluid 60 FPS browser UI throughout large workspace imports.

---

#### 🖼️ Asset Library Import/Export Overhaul: v1.1 Pool & Visual Inspection

Backing up and restoring image assets is now faster, memory-safe, and visually auditable:

- 🗜️ **v1.1 Content-Addressable Image Pool** — eliminates multi-megabyte Base64 payload duplication by consolidating shared images under SHA-256 `contentHash` keys with 100% backward compatibility for legacy v1.0 imports.
- 🌊 **Chunked Streaming Blob Construction** — replaces monolithic string concatenation with streaming array chunks, making library exports immune to V8 string heap limits.
- 🔍 **Pre-Import Visual Inspection Modal (`AssetImportModal.tsx`)** — Tier 3 (`z-[60]`) inspection dashboard featuring a real-time breakdown ribbon (`TOTAL IN FILE`, `+NEW UNIQUE`, `ALREADY EXISTS`), scrollable thumbnail preview grid with `NEW` (emerald) and `EXISTS` (amber) status tags, and merge strategy controls.
- 🎯 **Dual-Criteria Duplicate Detection** — checks incoming assets against both SHA-256 `contentHash` and `id`, backed by an asynchronous background hash resolver for existing session assets.
- ⭐ **Export Favorites / Pinned** — added dedicated favorite/pinned export action in `AssetExportDropdown.tsx` with live count badges and capture-phase Escape isolation.

---

#### 🛡️ User Presets Import/Export System Hardening & Defensive Validation

Preset management is now fully fortified against accidental file misplacements and format collisions:

- 🛡️ **Defensive Type Validation** — `lib/preset-export.ts` strictly validates package types, immediately rejecting accidental uploads of History exports (`promptlab_history_export`), Asset Library backups (`promptlab_asset_library`), or Project backups (`promptlab_project`) with descriptive guidance pointing users to the correct dialog.
- 🔎 **Heuristic History Collision Prevention** — examines untyped containers with `items: [...]` for signature history fields (`generationResult`, `outputs`, `specs`), preventing generation records from polluting user preset libraries.
- 📐 **Standardized Inspection Contract (`readAndValidatePresetsJSON`)** — provides asynchronous validation returning `{ success, data, rawItems, error }`, establishing full architectural parity with Project and Asset Library import contracts.
- 🔄 **100% Backward-Compatible Multi-Format Parser** — seamlessly parses versioned packages (`presets`), legacy containers (`items`), raw `UserPreset[]` arrays, single preset wrappers, and raw preset objects.

---

#### 📐 Modal Overlay Architecture & Tier Alignment

Overlay behavior across the application has been aligned with the 5-Tier Z-Index Stacking Context Scale:

- 🏢 **Tier 3 Elevation (`z-[60]`)** — `PresetImportConfirmModal`, `PresetReplaceConfirmModal`, `ProjectImportConfirmModal`, `ProjectExportModal`, and `AssetImportModal` are normalized to Tier 3, guaranteeing clean stacking above primary Tier 2 (`z-50`) modals.
- 🔒 **Capture-Phase Escape Key Isolation (Tier 4 `z-[70]`)** — `PresetExportDropdown` and `AssetExportDropdown` attach document capture-phase Escape listeners (`e.stopImmediatePropagation()`), ensuring dropdown dismissals never close underlying parent dialogs.
- 📚 **Universal LIFO Escape Stack Integration** — all sub-dialogs register directly with `useModalEscape`, guaranteeing predictable, single-level dismissals on <kbd>Escape</kbd>.

---

### ✨ What's New

- 🎬 **Auteur Script Visualizer (`components/AuteurScriptView.tsx`)** — specialized high-density retro lab renderer for procedural prompt outputs.
- 🧩 **Auteur Parser Engine (`lib/auteur-parser.ts`)** — open-ended dynamic regex macro-block parser with `isAuteurScript` auto-detection.
- 🖥️ **Output Renderer Split Workspace (`components/OutputRendererModal.tsx`)** — split-screen editor and live multi-mode preview with persistent drafts.
- 📸 **Retina PNG Screenshot Exporter (`lib/image-export.ts`)** — uncompressed 2x retina DOM-to-PNG export measuring full unconstrained `scrollHeight`.
- 🔀 **Universal Multi-Mode Output View (`components/MultiModeOutputView.tsx`)** — consolidated 4-mode viewer (MD, Raw, JSON, Auteur).
- 🧹 **Output Rendering Helpers (`lib/output-render-helpers.tsx`)** — centralized JSON parser, syntax highlighter, and Markdown styling mappings.
- 📦 **Project Scope Export Modal (`components/ProjectExportModal.tsx`)** — export dialog with Full, Compact History, and Starter Template scopes.
- 🔍 **Project Import Inspection Modal (`components/ProjectImportConfirmModal.tsx`)** — inspection modal with breakdown ribbon, collision resolution, and prompt preview.
- 🖼️ **Asset Import Inspection Modal (`components/AssetImportModal.tsx`)** — visual pre-import inspection dashboard with thumbnail grid and status tags.
- ⭐ **Export Favorites for Assets (`components/AssetExportDropdown.tsx`)** — one-click export for pinned/favorited asset images.
- 🛡️ **Defensive Preset Validator (`lib/preset-export.ts`)** — foreign package rejection and heuristic collision prevention.
- 🏷️ **Dynamic Version Badge** — footer status bar displays dynamic version (`PromptLab v2.7.0 by Taruma Sakti`) sourced directly from `package.json`.

---

### 🔄 Changed

- **Quad-Surface Multi-Mode Output Rendering**: `GenerationResultView`, `HistoryOutputViewer`, `HistoryFullscreenOutputModal`, and `OutputRendererModal` all share the unified `MultiModeOutputView` rendering engine.
- **Project Export Image Aggregation**: `exportProjectJSON` aggregates both `assetLibrary` and `history` reference images into the v1.1 deduplicated image pool, eliminating data loss during project backup and restore.
- **Streaming Blob Serialization**: Asset Library, Project Workspaces, and History exports now use chunked array streaming into `new Blob(chunks)` to bypass V8 single-string heap limits.
- **Modal Z-Index Alignment**: `PresetImportConfirmModal` and `PresetReplaceConfirmModal` realigned from generic `z-50` to Tier 3 `z-[60]`.
- **Dropdown Escape Key Isolation**: `PresetExportDropdown` and `AssetExportDropdown` elevated to Tier 4 `z-[70]` with capture-phase Escape dismissal.

---

### 🐛 Fixed

- **Project Backup History Image Loss**: Resolved bug where project exports omitted reference images stored on generation history records.
- **V8 Single-String Heap Crashes (`RangeError`)**: Replaced monolithic JSON serialization with streaming chunked Blobs across Project and Asset exports.
- **Preset Import Collision from History Files**: Added heuristic inspection on untyped `items: [...]` containers to prevent generation history items from polluting preset libraries.
- **Foreign Package Import Guidance**: Accidental cross-uploads of History, Asset Library, Project, or Preset files now display helpful error messages directing users to the correct workspace dialog.
- **Dropdown Escape Propagation**: Fixed issue where pressing Escape while closing an Export JSON dropdown inadvertently closed the parent modal.

---

### 📁 Files Affected

- `package.json` & `package-lock.json` — version bump to `2.7.0`
- `CHANGELOG.md` — finalized `[v2.7.0]` release entry
- `components/AuteurScriptView.tsx` — new Auteur Script procedural visualizer component
- `lib/auteur-parser.ts` — new schema-tolerant macro/sub-state parser with `isAuteurScript` detector
- `components/OutputRendererModal.tsx` — new split-screen editor and live multi-mode preview modal
- `components/MultiModeOutputView.tsx` — new universal 4-mode output viewer component
- `lib/output-render-helpers.tsx` — new shared output rendering and syntax highlighting helpers
- `lib/image-export.ts` — new full-height DOM-to-PNG export utility
- `components/AppHeader.tsx` — added top navigation trigger button (`Renderer`)
- `components/GenerationResultView.tsx` — refactored to use shared `MultiModeOutputView`
- `components/history/HistoryOutputViewer.tsx` — refactored to use shared `MultiModeOutputView`
- `components/history/HistoryFullscreenOutputModal.tsx` — refactored to use shared `MultiModeOutputView`
- `components/ProjectExportModal.tsx` — new project export scope selection modal
- `components/ProjectImportConfirmModal.tsx` — new project import inspection modal
- `components/ProjectManagerModal.tsx` — integrated new export and import modal workflows
- `lib/projects.ts` — unified image pool aggregation, v1.1 deduplication, chunked streaming, and defensive validation
- `components/AssetImportModal.tsx` — overhauled pre-import visual inspection dashboard
- `components/AssetExportDropdown.tsx` — added favorite export scope and capture-phase Escape isolation
- `components/AssetLibrarySidebar.tsx` — integrated updated export/import modals and lifecycle hashing
- `lib/asset-library-export.ts` — v1.1 image pooling, chunked streaming, and dual-criteria duplicate detection
- `lib/preset-export.ts` — defensive type validation, heuristic collision prevention, and `readAndValidatePresetsJSON`
- `components/PresetImportConfirmModal.tsx` — realigned to Tier 3 `z-[60]` and wired to `useModalEscape`
- `components/PresetReplaceConfirmModal.tsx` — realigned to Tier 3 `z-[60]` and wired to `useModalEscape`
- `components/PresetExportDropdown.tsx` — elevated to Tier 4 `z-[70]` with capture-phase Escape listener
- `hooks/use-url-preset-import.ts` — integrated defensive validation and error handling
- `app/page.tsx` — registered `OutputRendererModal`, updated preset error handling, and wired safety gates
- `AGENTS.md` — codified Rule V, Rule W, and updated file registries
- `README.md` — updated feature specifications for Output Renderer, Auteur Script, and v1.1 backups
- `.agents/rules/modal-overlay-architecture.md` — verified stacking context tiers and event hierarchy
