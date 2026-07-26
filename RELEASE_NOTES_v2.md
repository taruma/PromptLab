**PromptLab v2** transforms from a single-session prompt tester into a **persistent, multi-modal, multi-project creative environment**. Every generation is automatically archived with full context. A reusable asset library supports images, MP4 videos, and YouTube links — all combined into a unified reference pipeline. Independent workspaces keep your projects organized, a git-style diff viewer lets you compare prompt configurations side-by-side, and the redesigned thinking trace panel visualizes the engine's reasoning in real time. All of this runs on modern IndexedDB storage, so nothing gets lost between sessions.

---

## ✨ Highlights

### 🕘 Session History & Recall

Every generation is now automatically saved with its complete context — template variables, image and video references, engine parameters, and reasoning traces. Finding past work is fast and forgiving.

- Browse, search, rename, and restore any past generation from a full-screen history browser
- Mark favorites and filter by All, Favorites, or Recent
- Fuzzy search handles typos and hyphenated terms (e.g., "sci-fi" matches "sci fi")
- A compact inline panel in the sidebar shows recent work without opening the full browser
- Export your history as JSON for backup or cross-device migration
- Compare any saved generation's prompt configuration against your current workspace with a diff viewer

### 🖼️ Asset Library & Video References

Reference images live in a persistent library independent of any workspace — upload once, reuse everywhere. Video is now a first-class reference type alongside images.

- Upload, browse, search, rename, sort, and delete assets in a resizable sidebar with list and grid views
- Drag in MP4 files (up to 30 seconds, 35 MB) or paste YouTube URLs — both map to `@videoN` labels
- Images, videos, and YouTube links combine into a single `{{ visual_references }}` variable server-side
- Video cards show type badges (`YT` / `MP4`) and open in a full-screen preview player
- Video metadata persists in history alongside image references
- Export and import your asset library as JSON with automatic duplicate detection

### 📂 Multi-Project Workspaces

Create independent workspaces — each with its own prompts, presets, history, and asset library. Everything persists automatically, and switching is instant.

- Browse and manage all projects from a full-screen dashboard with grid or compact views
- Switch workspaces directly from the top navigation bar without opening the full manager
- Clone an existing workspace when you want to experiment without losing your starting point
- Export entire projects as portable JSON files with all images bundled in; import with automatic name collision handling
- Your existing data is automatically migrated into a default workspace on first launch — nothing is lost

### ⚙️ Presets, Diff & Bulk Export

Preset management now tracks exactly where you stand, lets you compare any two configurations, and supports bulk operations.

- Update an existing preset or save as a new one — visual `[ACTIVE]` and `[EDITED]` badges show whether your editor matches the saved version
- Jump between presets from the top bar with the Quick Preset Selector without opening the full editor
- Search presets by name and filter by All, System, or User tabs with live count badges
- Compare any preset against your current editor with a side-by-side diff viewer — green additions, red deletions, and a "Changes Only" filter to skip unchanged regions
- Bulk export presets (All, Favorites, or Active) as versioned JSON; import with duplicate detection

### 🧠 Reasoning Visualization & Output Rendering

Generation output now supports two view modes, and the engine's thinking process is visualized in a redesigned panel.

- Toggle between richly formatted Markdown and raw monospace text in the output panel
- Collapse the output area to reclaim workspace; the setting persists across sessions
- An amber dot pulses next to a `PROCESSING` label while the model is thinking
- Each new reasoning block fades in with a smooth animation during streaming
- The reasoning panel auto-collapses once output begins, keeping the workspace clean
- The complete thinking trace is saved alongside your history

### 🎛️ Engine Controls & API Key Vault

All engine settings are centralized in a dedicated modal with a multi-key vault for managing API credentials.

- Switch models, tune temperature, set reasoning effort, and cap max tokens from one dialog
- Add, label, switch between, and delete multiple Gemini API keys in a collapsible vault
- Your active key's label is always visible in the status bar
- Temperature and max token controls are tucked behind an expandable "Advanced" section
- Existing legacy keys are automatically migrated into the vault

---

## ✨ What's New

- 🕘 Full session history with favorites, fuzzy search, one-click restore, and JSON import/export
- 🖼️ Persistent asset library — IndexedDB-backed, resizable, with search, sort, and deduplication
- 🎬 Multi-modal video — MP4 upload and YouTube URL references mapped to `@videoN`
- 🖥️ Full-screen video preview for both MP4 and YouTube references
- 📂 Multi-project workspaces with independent prompts, presets, history, and assets
- 🔄 Project switcher in the top bar and "Copy from Current" for instant workspace cloning
- 📤 Project export with bundled images — portable, versioned, and importable
- ⚙️ Update existing presets with active/edited state tracking badges
- 🎛️ Quick Preset Selector for rapid switching without opening the full editor
- 🔍 Git-style diff viewer — unified/split views, changes-only filter, preset and history comparison
- 📤 Bulk preset export (All / Favorites / Active) with duplicate-aware import
- 📝 Dual-mode output — Formatted Markdown and Raw Monospace with a toggle
- 💡 Redesigned thinking trace — pulsing amber dot, slideshow cards, auto-collapse
- 🔑 Multi-key API key vault with labeled keys and automatic legacy migration
- 🟢 Optional Core Idea — generate without filling the Main Objective field
- 📥 Collapsible generation output with persisted state

---

## ⬆️ Upgrading from PromptLab v1

- ✅ **No breaking changes.** Your existing prompts, presets, history, and images are fully compatible.
- 🧳 Everything is automatically migrated into a "Main Workspace" project on first launch — your data stays intact.
- 🔑 Any existing API key is migrated into the new multi-key vault automatically.

---

## 🚀 Installation

```bash
git clone https://github.com/taruma/PromptLab.git
cd PromptLab && npm install
```

Set your API key (optional — you can provide one in-app):

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Requirements:** Node.js 18+ · [Google Gemini API Key](https://aistudio.google.com/apikey)

---

**⭐ Star on GitHub** · [taruma/PromptLab](https://github.com/taruma/PromptLab)
<br>**🌐 Live Deployment** · [promptlab.taruma.my.id](https://promptlab.taruma.my.id)
<br>**📄 License** · MIT © [Taruma Sakti](https://github.com/taruma)