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

### 🎛️ Prompt Engineering
- **Dynamic Template Variables** — Add `{{ placeholders }}` to your prompt template and form fields appear automatically. No hardcoding needed.
- **Custom Presets** — Save, update, or delete your own presets. Share them via URL or import/export as JSON files. Visual badges show whether a preset is loaded or has unsaved changes.
- **Preset Compare & Diff Viewer** — Side-by-side differences between your current config and any saved preset, with color-coded additions and deletions.
- **Import Strategy Control** — When importing presets, choose whether to create duplicates (safe) or replace existing ones in-place — with a full breakdown of what will be added, replaced, or skipped before you commit.
- **Quick Preset Switcher** — Switch between system and custom presets directly from the top navigation bar without opening a modal.

### 🖼️ Media References
- **Image Uploads** — Drag and drop images as casting or scene references. Each asset auto-maps to `@imageN` and compresses to high-quality JPEG automatically.
- **Video Uploads (MP4)** — Upload MP4 videos alongside images, validated for length and size, and mapped to `@videoN` annotations. Preview videos in a full-screen player before generating.
- **YouTube References** — Paste any YouTube URL to use as a video reference, mapped to `@videoN` alongside your uploaded videos.
- **Gemini Files API** — Upload media files up to 2 GB via Google's Gemini Files API with real-time progress tracking. Browse and reuse previously uploaded files from a built-in file browser — no re-uploading needed.

### 🤖 AI Engine
- **Multiple Gemini Models** — Switch between Gemini 3.5 Flash, 3.5 Flash-Lite, 3.1 Pro Preview, and more.
- **Temperature & Reasoning Control** — Fine-tune creativity (0.0–2.0) and choose from four reasoning effort levels (MINIMAL through HIGH).
- **Engine Reasoning Trace** — Watch the model's internal thinking process stream in real-time alongside your output, with a pulsing indicator during active processing.
- **Token Usage & Cost Tracking** — See exactly how many tokens each generation used (input, output, and cached), with a real-time estimated cost in USD.

### 📊 Output
- **Dual-Mode Rendering** — Toggle between richly formatted Markdown (headings, lists, bold) and traditional raw monospace text.
- **Live Character Count** — See your output length at a glance with a formatted `{N} CHARS` badge.
- **Real-Time Streaming** — Watch generations appear word-by-word via Server-Sent Events.

### 💾 Workspace
- **Multi-Project Support** — Create independent workspaces, each with their own prompts, presets, history, and asset library. Switch between them from the top bar.
- **Session History** — Past generations are saved locally. Favorite entries, search with fuzzy matching, compare historical prompts against your current workspace with a built-in diff viewer, and export/import as JSON for backup.
- **Asset Library** — A persistent image sidebar for uploading, browsing, searching, and reusing images across any workspace without re-uploading.
- **Workspace Clone** — Create a new project by copying your current prompts, presets, and assets — perfect for exploring variations.

### 🔐 API Keys
- **Multi-Key Vault** — Manage multiple labeled Gemini API keys, switch between them, and see which key is active in the workspace footer.
- **Bring Your Own Key** — Use your own Gemini API key stored locally in your browser — no server-side key required.
- **Deployment Security** — Server operators can disable the server-side API key entirely (`ALLOW_SERVER_ENV_KEY`), ensuring every user provides their own key.

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

1. **Bring your own system instructions and template** via the **Configure Prompts** button — or start from one of the example presets.
2. **Fill in the template variables** that appear in the left panel.
3. **Upload reference images and videos** by dragging them into the drop zone — label each one to map it to a character or setting (e.g., `@image1` for images, `@video1` for videos). For large media files, use the **Files API Upload** option (supports up to 2 GB).
4. **Click "Generate Sequence"** to test your prompt against Gemini.
5. **Review the output**, switch between Markdown and Raw view, tweak your template, and generate again — iterate until your prompt design feels right.
6. **Browse past generations** in the history panel — favorite, search, export, or click any entry to restore it.

### Sharing Presets via URL

You can share a preset configuration by hosting a JSON file (e.g., on GitHub) and appending its raw URL as a query parameter:

```
https://promptlab.taruma.my.id/?presetUrl=https://raw.githubusercontent.com/user/repo/main/my-preset.json
```

Supported parameters: `?presetUrl=`, `?configUrl=`, `?preset=`, `?config=`, or `?preseturl=`. Opening such a link will show an import confirmation dialog where you can choose how duplicates are handled and preview exactly what will be imported.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No* | Your Gemini API key. *Not required if you provide a custom key in the app's Engine Controls panel. |
| `ALLOW_SERVER_ENV_KEY` | No | Set to `"false"` to disable the server-side API key, requiring every user to supply their own key. Defaults to `"true"`. |

---

## Tech Stack

Built with [Next.js](https://nextjs.org/) 15, [Tailwind CSS](https://tailwindcss.com/) v4, [Vercel Analytics](https://vercel.com/analytics), [react-markdown](https://github.com/remarkjs/react-markdown), and the [Google GenAI SDK](https://www.npmjs.com/package/@google/genai). Image persistence uses IndexedDB to avoid browser storage limits. Video validation uses the HTML5 Video API for metadata extraction. Large media uploads use the Gemini Files API with direct resumable streaming.

---

## Disclaimer

This project was created through vibe coding using [AI Studio](https://ai.studio) with Gemini 3.5 Flash. Use at your own risk — feel free to inspect and modify the source code as you see fit.

---

## License

MIT © [Taruma Sakti](https://github.com/taruma)