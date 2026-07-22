<div align="center">
<img src="public/logo_promptlab.png" alt="PromptLab Logo" width="120" height="120" />

# PromptLab

**[promptlab.taruma.my.id](https://promptlab.taruma.my.id)**

*A playground for drafting and iterating on AI prompt templates — experiment, test, and refine before taking your prompts to production.*

</div>

---

## What is PromptLab?

PromptLab is a **first-draft playground** for prompt engineering. Write your system instructions and prompt templates with `{{ dynamic_variables }}`, upload reference images and videos, and quickly test your prompts against **Google Gemini**. It's not a production pipeline — it's where you sketch, iterate, and nail down your prompt design before using it elsewhere.

---

## Features

- **Dynamic Template Variables** — Add `{{ placeholders }}` to your prompt template and form fields appear automatically. No hardcoding needed.
- **Visual Reference Uploads** — Drag and drop images to serve as casting or scene references. Each asset is auto-mapped (e.g., `@image1`) and injected into your prompt. Images are automatically compressed to high-quality JPEG to conserve storage.
- **Multi-Modal Video Support** — Upload MP4 videos alongside images as reference assets. Videos are validated (≤30 seconds, ≤35 MB) and mapped to `@videoN` annotations. Preview uploaded videos in a full-screen player before generating. *(Note: video uploads work best when running locally; hosted deployments may hit POST payload size limits.)*
- **Image Storage with IndexedDB** — Uploaded images are stored in your browser's IndexedDB, avoiding localStorage quota limits. You can upload larger files without worrying about storage caps.
- **Custom Presets** — Save, update, or delete your own presets. Import and export as JSON files. Share presets via URL query parameters. Visual badges show when a preset is loaded or has unsaved changes.
- **Engine Controls** — Switch between Gemini models (3.5 Flash, 3.1 Flash Lite, 3.1 Pro), adjust temperature, reasoning effort, and max output tokens.
- **API Key Vault** — Bring your own Gemini API keys. Manage multiple labeled keys, switch between them, and delete old ones — all from the Engine Controls panel.
- **Session History** — Past generations are saved locally. Favorite entries, filter by tabs (All / Favorites / Recent), import/export as JSON for backup or sharing, and clear with a single action.
- **Asset Library** — A persistent image library sidebar. Upload, browse, search, rename, and reuse images across workspaces without re-uploading.
- **Preset Compare & Diff Viewer** — Side-by-side diff between your current config and any saved preset. Git-style add/remove highlighting before you load.
- **Preset Export & Import** — Bulk export user presets (All / Favorites / Active) as versioned JSON files, with duplicate detection and favorite/pinned reconciliation on import.
- **Preset Search & Filtering** — Search presets by name and filter with All / System / User tab toggles for quick navigation.
- **Lab Manual & Quick-Start Guide** — A built-in 4-step walkthrough helps new users get oriented and productive immediately.

---

## Built-in Presets

| Preset | Focus |
|--------|-------|
| **AI Casting & Screenplay** | Character-driven dramatic narratives. Generates synthetic persona breakdowns, scene beats, cinematic dialogue drafts, and performance directives. |
| **AI Director & Storyboard** | Cinematic pre-production. Produces directorial vision, camera/lens specs, shot-by-shot AI storyboard plans, and soundscape design. |
| **VFX & Speculative Worldbuilder** | Virtual production & world design. Delivers environmental constitutions, LED volume schematics, VFX complexity passes, and text-to-3D asset prompts. |

> **These presets are examples only.** PromptLab is designed for you to bring your own system instructions and prompt templates — edit freely or start from scratch via the **Configure Prompts** panel.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A [Google Gemini API key](https://aistudio.google.com/apikey)

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/taruma/PromptLab.git
cd PromptLab
npm install
```

### 2. Set Your API Key

Create a `.env.local` file in the project root:

```
GEMINI_API_KEY=your_api_key_here
```

You can also provide a key later through the **Engine Controls** panel in the app — it will be stored locally in your browser.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

1. **Bring your own system instructions and template** via the **Configure Prompts** button — or start from one of the example presets
2. **Fill in the template variables** that appear in the left panel
3. **Upload reference images and videos** by dragging them into the drop zone — label each one to map it to a character or setting (e.g., `@image1` for images, `@video1` for videos). *For video uploads with larger files, run PromptLab locally to avoid payload size limits on hosted deployments.*
4. **Click "Generate Sequence"** to test your prompt against Gemini
5. **Review the output**, tweak your template, and generate again — iterate until your prompt design feels right
6. **Browse past generations** in the history panel — favorite, export, or click any entry to restore it

### Sharing Presets via URL

You can share a preset configuration by hosting a JSON file (e.g., on GitHub) and appending its raw URL as a query parameter:

```
https://promptlab.taruma.my.id/?presetUrl=https://raw.githubusercontent.com/user/repo/main/my-preset.json
```

Supported parameters: `?presetUrl=`, `?configUrl=`, `?preset=`, or `?config=`. Opening such a link will show an import confirmation dialog.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No* | Your Gemini API key. *Not required if you provide a custom key in the app's Engine Controls panel. |

---

## Tech Stack

Built with [Next.js](https://nextjs.org/) 15, [Tailwind CSS](https://tailwindcss.com/) v4, [Vercel Analytics](https://vercel.com/analytics), and the [Google GenAI SDK](https://www.npmjs.com/package/@google/genai). Image persistence uses IndexedDB to avoid browser storage limits. Video validation uses the HTML5 Video API for metadata extraction.

---

## Disclaimer

This project was created through vibe coding using [AI Studio](https://ai.studio) with Gemini 3.5 Flash. Use at your own risk — feel free to inspect and modify the source code as you see fit.

---

## License

MIT © [Taruma Sakti](https://github.com/taruma)