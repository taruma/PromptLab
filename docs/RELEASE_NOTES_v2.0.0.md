## v2.0.0: Recall, Reuse, Refine.

**PromptLab v2.0.0** is a major feature release that transforms the workspace from a single-session prompt tester into a **persistent creative environment**. This release introduces a fully overhauled **Session History** system with favorites and import/export, a cross-workspace **Asset Library** for reusable reference images, a **multi-key API Key Vault**, a **side-by-side Preset Diff Viewer**, **bulk preset export/import**, and significant UI refinements. Under the hood, the codebase was modularized with shared utilities, extracted components, and centralized IndexedDB helpers.

---

### 📦 What's New

#### 🕘 Session History (Fully Overhauled)

- **Favorite toggle & filter tabs** — Mark generations as favorites for quick access. Browse with three tabs: All, Favorites, and Recent.
- **Full-screen HistoryViewerModal** — Browse, search, rename, and load previously saved prompt iterations with full metadata (timestamp, model, temperature, thumbnail previews).
- **Collapsible inline history panel** — The `HistorySection` sidebar component shows recent generations without opening a full modal.
- **History JSON import & export** — Export history data as JSON files for backup or cross-device migration. Filenames include date, compact timestamp, and a unique 4-character suffix. Import files back through the HistoryViewerModal.
- **Decoupled history image IDs** — History images use unique `hist-img-{timestamp}-{idx}-{random}` identifiers completely independent of active session image IDs. Deleting or modifying workspace images never breaks previously saved historical references.
- **Deterministic variable storage** — History entries store clean, resolved copies of template variables, eliminating stale or misleading dynamic parameter values on recall.
- **Legacy history auto-migration** — Old-format entries are automatically migrated to the current format on app load.
- **Clear history with confirmation** — A dedicated confirmation modal warns before permanently deleting all history items and their associated IndexedDB images.

#### 🖼️ Asset Library

- **Persistent image library sidebar** — Upload, browse, search, rename, sort (by name or date), and delete reference images stored in IndexedDB independently of any workspace session. Toggle between list and grid views.
- **Cross-workspace image reuse** — Add library images to the active workspace with a single click, automatically creating `@imageN` references with the library label — no need to re-upload.
- **Resizable sidebar width** — Drag the divider to adjust the Asset Library sidebar width; the setting persists in `localStorage` across sessions.
- **Upload deduplication** — Duplicate images with matching base64 content are detected and prevented.
- **Dedicated VisualAssetCard component** — A reusable card layout with hover preview, shared between the workspace sidebar and the asset library for consistent display.

#### 🔑 API Key Vault

- **Multi-key vault with add, switch, and delete** — Manage multiple labeled Gemini API keys from a single collapsible vault in the Engine Controls modal. Existing legacy single keys are automatically migrated into the vault on first access.
- **Active key label in workspace footer** — The label of the currently selected custom API key is displayed next to the system status indicator, so you always know which key is in use.

#### ⚙️ Presets & Configuration

- **Update existing presets** — A dual-mode control panel offers "Update Preset" (overwrite the selected preset) and "Save As New" (create a cloned copy), alongside a "[Deselect]" button to start a fresh workspace.
- **Active & edited state tracking** — Visual badges show `[ACTIVE]` in emerald when a preset matches the editor content, and `[EDITED]` in pulsing amber when the editor has diverged from the saved version.
- **Preset search & three-tab filtering** — Search presets by name and filter with a three-tab toggle (All / System / User) showing count badges. The active tab selection persists across sessions.
- **Workspace actions dropdown** — Import JSON, Export JSON, and Reset to TXT Files are consolidated into a single compact "Config Options" menu.
- **Discard confirmation on unsaved changes** — Closing the Configure Prompts modal or pressing ESC with unsaved edits now prompts a confirmation dialog to prevent accidental data loss.

#### 🔍 Preset Compare & Diff Viewer

- **Side-by-side diff viewer** — When browsing presets, a "Compare" button opens a full-screen modal showing line-by-line differences between the current editor content and any saved preset's configuration.
- **Unified & split views** — Toggle between inline (unified) and side-by-side (split) diff layouts with green/red color-coded additions and deletions.
- **"Changes Only" filter** — A git-style context-window filter collapses unchanged regions to 3-line context blocks with `<skipped N lines>` markers, toggleable to full file view.
- **Built on a custom LCS diff engine** — A Longest Common Subsequence algorithm (`computeLineDiff`) generates precise line-by-line change data with line number tracking.

#### 📤 Bulk Preset Export & Import

- **Export dropdown with three modes** — Export All, Export Favorites, or Export Active Preset from a compact dropdown in the Configure Prompts header. Each option shows a live count badge.
- **Versioned JSON payload** — Exports produce a `promptlab_presets_{tag}_{date}_{time}_{uniqueId}.json` file with version, timestamp, type tag, item count, and an array of preset objects.
- **Duplicate-aware import** — Import validates JSON structure (accepts raw arrays, wrapped arrays, or single objects). Duplicates are detected by matching both ID and name+content combinations, with skipped entries reported in the import summary.
- **Favorite/pinned reconciliation** — On import, any preset marked as favorite is automatically added to the pinned IDs set.

#### 🎛️ Engine Controls

- **Dedicated EngineControlsModal** — All engine configuration (model selection, temperature, reasoning effort, max tokens, API key vault) is now in a focused modal dialog, extracted from the main workspace.
- **Collapsible advanced settings** — Temperature and max output token controls are hidden behind an expandable "Advanced" section to reduce clutter.
- **Redesigned model selection** — The model picker and surrounding UI were refreshed for clearer navigation and feedback.

#### ✨ UI Improvements

- **Live character count badge** — A `{N} CHARS` badge appears next to the "Generation Result" header whenever output is present.
- **Truncated long titles & names** — History idea titles exceeding 100 characters are truncated to prevent layout breakage. Overly long preset names in modals are also truncated for readability.
- **Updated application icons** — All favicon and app icon assets were refreshed across platforms (favicon, Android Chrome, Apple touch icon, and logo).
- **Polished input transitions** — The idea textarea transition was changed to colors-only to prevent subtle layout shifts on focus.

---

### 🛠️ Under the Hood

- **Centralized IndexedDB helpers** (`lib/indexeddb.ts`) — Database open, save, get, and delete operations shared across components.
- **Centralized utility functions** (`lib/utils.ts`) — URL helpers, LCS diff engine, and image compression logic extracted from the main page.
- **Dedicated history export module** (`lib/history-export.ts`) — JSON import/export logic encapsulated for maintainability.
- **Dedicated preset export module** (`lib/preset-export.ts`) — Bulk JSON export/import with duplicate detection and pinned-ID reconciliation.
- **Extracted components** — `HistorySection`, `VisualAssetCard`, `PresetCompareModal`, `PresetExportDropdown`, and `EngineControlsModal` were extracted from the monolithic page into reusable, testable components.
- **Vercel Analytics** — Integrated in the root layout for deployment observability.

---

#### ⬆️ Upgrade Notes

- **Legacy history auto-migration** — Old-format history entries in `localStorage` are automatically migrated to the current format on first load. No manual action required.
- **API key vault migration** — Any existing legacy single API key stored in `localStorage` is automatically migrated into the new multi-key vault on first access.
- **No breaking changes** — All v1.0.0 workspace configurations, presets, and stored data are fully compatible with v2.0.0.

---

#### 📝 Full Commit History

See [CHANGELOG.md](./CHANGELOG.md) for the complete 42-commit breakdown, or view the [full diff on GitHub](https://github.com/taruma/PromptLab/compare/v1.0.0...v2.0.0).
