## v2.1.0: Capture. Compare. Export.

**PromptLab v2.1.0** introduces **multi-modal video references** (MP4 uploads + YouTube URLs), Markdown-rendered generation output, history diff comparison, asset library import/export, and a major architecture refactor extracting 9 reusable components from the monolithic workspace.

---

### ✨ Highlights

#### 🎬 Multi-Modal Video & YouTube Support

PromptLab now supports video references alongside images. Upload MP4 files (≤30 seconds, ≤35 MB) or add YouTube URLs — both map to `@videoN` annotations in your prompt templates and stream to Gemini as `inlineData` / `fileData` parts.

- 📹 **Local MP4 upload** with automatic validation and Base64 encoding
- ▶️ **YouTube URL references** with auto-extracted thumbnails and embedded iframe previews
- 🔗 **Unified `{{ visual_references }}` pipeline** combining all image and video assets server-side
- 🃏 **Three-state `VideoAssetCard`** handles YouTube (playable), cached MP4 (playable), and uncached historical MP4 (NO LOCAL STREAM placeholder)
- 🖥️ **Full-screen `VideoPlayerModal`** for pre-generation preview of both MP4 and YouTube references
- 💾 **Video metadata preserved in history** — recall, export, and import with purple `{N} VID` badges

#### 📝 Markdown-Enabled Output Rendering

The generation output panel now supports a **Formatted Markdown / Raw Monospace** toggle. Output is rendered with `react-markdown` using custom-styled headings, lists, bold, italic, inline code, and horizontal rules — all in PromptLab's brutalist aesthetic. The raw monospace view remains available for users who prefer the original plain-text output.

#### 🔍 History Diff Compare

A new `[Diff]` button in the `HistoryViewerModal` detail panel opens the shared `PresetCompareModal` to show line-by-line differences between a saved history item's prompt configuration and your current active workspace. Audit how your system instructions and prompt templates have evolved over time with unified or split diff views.

#### 📤 Asset Library Import & Export

The asset library now supports JSON export (All or Selected images) and import with automatic duplicate detection. Previously exported library files can be re-imported, with a processing summary reporting total imported, duplicates skipped, and errors encountered.

#### 🟢 Optional Core Idea

The Main Objective / Idea field is no longer required for generation. You can now run generations using only dynamic parameters and your prompt template — useful for lightweight testing or pure template-driven workflows.

---

#### ✨ What's New

- ✨ **Markdown rendering toggle** in generation output (Formatted / Raw) via `GenerationResultView`
- ▶️ **YouTube URL video references** with `@videoN` mapping, thumbnail extraction, and iframe preview
- 🎬 **Multi-modal video support** — MP4 upload with validation, Base64 encoding, and unified reference pipeline
- 📦 **`VideoAssetCard` component** with three-state rendering (YouTube / cached MP4 / uncached MP4)
- 📦 **`VideoPlayerModal` component** for full-screen video preview (HTML5 + YouTube iframe)
- 💾 **Video history tracking** — metadata persists across sessions, exports, and imports
- 🎨 **`YouTubeIcon` custom SVG component** replacing all `lucide-react` Youtube imports
- 📤 **Asset library JSON export and import** with duplicate detection
- 🔍 **History diff compare** via shared `PresetCompareModal`
- 🟢 **Optional Core Idea** — generation works without the Main Objective field
- 💬 **`PromptTemplateHelpTooltip` component** for inline `{{ variable }}` syntax guidance

#### 🐛 Fixed

- 🐛 Empty-string prompt inputs are no longer overwritten by filesystem template defaults
- 🐛 History cards for custom prompts now show a `CUSTOM` badge
- 🐛 Broken YouTube thumbnails gracefully degrade to a `YouTubeIcon` placeholder

#### 🔄 Changed

- ⚡ Simplified history item loading — centralized state management handles restoration
- ⚡ "Reset Prompts" now clears the editor client-side for instant feedback

#### 🏗️ Architecture

- 🏗️ Extracted 9 reusable components from `page.tsx`: `AppHeader`, `FooterStatusBar`, `LabManualSection`, `MainIdeaSection`, `ParameterInputsSection`, `ClearSessionConfirmModal`, `DeleteHistoryConfirmModal`, `DiscardChangesConfirmModal`, `LoadWorkspaceConfirmModal`
- 📉 Main workspace file reduced by ~475 lines (net)

---

#### ⬆️ Upgrade Notes

- ✅ **No breaking changes.** All existing localStorage data, IndexedDB images, history items, and custom presets are fully compatible with v2.1.0.
- 💾 Video references added to history before upgrading from v2.0.0 will not contain video metadata — only generations created in v2.1.0+ will include the new `videos` field.
- 🎨 The `lucide-react` `Youtube` icon is no longer used; a custom `YouTubeIcon` SVG component replaces it throughout the UI.

---

#### 🔗 Resources

- 📋 **Full Changelog**: https://github.com/taruma/PromptLab/compare/v2.0.0...v2.1.0
