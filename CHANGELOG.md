# Changelog

All notable changes to PromptLab, a playground for drafting and iterating on AI prompt templates.

---

## [UNRELEASED]

### Added

- **Multi-project workspace support.** A comprehensive project management system (`lib/projects.ts`) replaces the single-workspace model with a multi-project architecture backed by IndexedDB. Users can now create, rename, switch, and delete independent workspaces, each with its own system prompt, prompt template, custom presets, generation history, and asset library. A new `ProjectManagerModal` component (`components/ProjectManagerModal.tsx`) provides a full-screen interface for browsing, searching, and managing all projects with a toggleable grid/compact view.
- **Backward-compatible project migration.** On first access after the upgrade, legacy `localStorage` session data (prompts, presets, history, and asset library images) is automatically detected and migrated into a "Main Workspace" default project via `initProjects()`, ensuring no existing data is lost. The active project's configuration is synced to the legacy `localStorage` keys transparently, so all existing workspace components continue to function without modification.
- **Project import/export with image bundling.** Projects can be exported as versioned JSON files (`promptlab_project` v1.0) that bundle the full project configuration alongside all asset image blobs retrieved from IndexedDB via `exportProjectJSON()`. Exported files use a standardized naming convention (`PromptLab-Project-{name}_{date}_{time}_{uniqueId}.json`). Import via `importProjectJSON()` validates the payload, restores images to IndexedDB, and automatically handles project name collisions with incrementing suffixes.
- **"Copy from Current" project creation.** When creating a new project, users can optionally clone the active workspace's system prompt, prompt template, custom presets, and asset library into a fresh project, providing a quick starting point for variant exploration without losing the original workspace state.
- **Cross-tab project synchronization.** A `BroadcastChannel`-based sync mechanism (`promptlab_project_sync_channel`) broadcasts project switch, update, create, and delete actions across open browser tabs. The `subscribeProjectChanges()` / `broadcastProjectChange()` utilities in `lib/projects.ts`, paired with listeners in `app/page.tsx`, keep the project dropdown and active workspace in sync across tabs.
- **Project switcher in AppHeader.** A compact project selector dropdown in the top navigation bar displays the current project name and enables one-click switching between workspaces without opening the full `ProjectManagerModal`.
- **Quick Preset Selector in AppHeader.** A new `QuickPresetSelector` component (`components/QuickPresetSelector.tsx`) provides rapid switching between system and custom prompt presets directly from the top navigation bar, reducing the need to open the Configure Prompts modal for preset changes. Includes state management for template variables, preset persistence, and active preset tracking within the main application flow.
- **Collapsible generation result section.** The generation output panel in `GenerationResultView` (`components/GenerationResultView.tsx`) now supports collapsible sections, allowing users to collapse the output area for a tidier workspace. The collapsed/expanded state is persisted in localStorage for session-to-session continuity.
- **Preset timestamp metadata.** Presets now include `createdAt` and `updatedAt` timestamp fields, enabling users to track when each preset was first saved and last modified. This applies to both system presets (loaded via `/api/prompt-config`) and custom user presets (stored in localStorage), with corresponding updates to the `UserPreset` interface in `lib/preset-export.ts` and the `PresetCompareModal`.
- **Date-based preset sorting.** The preset list in the Configure Prompts modal now supports date-based sorting options in addition to alphabetical sorting. A new `formatDate` helper function in `lib/utils.ts` provides consistent date formatting across the workspace.
- **Thinking process visualization.** The "Engine Reasoning Trace" console in `GenerationResultView` (`components/GenerationResultView.tsx`) was redesigned with a collapsible panel featuring a pulsing amber dot (`animate-pulse`) and `PROCESSING` badge during active thinking (or green dot + `COMPLETED` badge when finished). During streaming, the latest parsed reasoning block is displayed as a slideshow card with a `slideFadeIn` animation; when complete, the full log renders in a scrollable `max-h-[180px]` text block supporting markdown-formatted reasoning content. Auto-collapse behavior hides the reasoning trace once generation output starts streaming. The server-side generation handler (`app/api/generate/route.ts`) now sends `includeThoughts: true` to all models (the model-name gate on `thinkingConfig` was removed), enabling reasoning/thought output universally. A new `@keyframes slideFadeIn` animation class (`.animate-slide-fade-in`) in `globals.css` provides smooth section transitions. Thinking results (`thinkingResult`) are persisted in `HistoryItem` objects and restored from `localStorage` so reasoning traces survive history save and recall.
- **Live output character count badge.** A `{N} CHARS` badge using `toLocaleString()`-formatted numbers appears next to the copy/expand buttons in `GenerationResultView` when generation output is present, providing immediate feedback on output length.
- **Enhanced copy button with icons.** The generation output copy button was redesigned with `Copy` and `Check` (checkmark on success) lucide-react icons alongside the text label, replacing the plain text-only button with a polished icon+text layout.
- **History card summary component.** A new reusable `HistoryCardSummary` component (`components/HistoryCardSummary.tsx`) renders a detailed preview card for history items showing timestamp (24-hour format), media badges (IMG/VID counts), model badge, preset badge, title/idea excerpt, and a cleaned markdown-free output excerpt (truncated to ~220 characters). This component is integrated into `LoadWorkspaceConfirmModal`, `DeleteHistoryConfirmModal`, and `HistorySection` for consistent, rich history previews throughout the application.

### Fixed

- **Standardized section collapsible chevrons.** Standardized accordion/section chevron icons across `VisualAssetsSection`, `LabManualSection`, `HistorySection`, and prompt preset list accordions to follow standard UI conventions: pointing Right (`ChevronRight` `>`) when collapsed and Down (`ChevronDown` `v`) when expanded.
- **Project management stability and sync.** Added an `isSwitchingProjectRef` guard in `app/page.tsx` to prevent auto-save and asset-library callbacks from firing during active project switches, eliminating state race conditions. Added fallback initialization in `handleProjectsUpdated()` to auto-create a default workspace when zero projects exist. Enhanced project deletion flow in `ProjectManagerModal` to ensure the active project correctly falls back to the next available project. Updated the persistence layer in `lib/projects.ts` to support both legacy and current history storage keys. Refined `AssetLibrarySidebar` state synchronization during project switches to prevent stale asset references.

### Architecture & Refactoring

- **Extracted VisualAssetsSection component.** Extracted the visual reference assets, casting maps, drag-and-drop uploader, YouTube URL trigger, library browser, error/warning alerts, image cards, and video cards from `app/page.tsx` into a modular, standalone component (`components/VisualAssetsSection.tsx`). Added section collapsibility with a `ChevronDown` toggle icon beside the title and persistent open/collapsed state saved in localStorage (`prompt_generator_visual_assets_open`).
- **IndexedDB schema upgrade.** The database version was bumped from v1 to v2, adding a new `projects` object store alongside the existing `images` store. Project data (configuration, presets, history, and asset metadata) is persisted in IndexedDB rather than localStorage, removing the ~5–10MB quota constraint for session data.

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