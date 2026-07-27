# Gemini Interactions API Migration Reference Guide

This document details the migration path from the standard `@google/genai` `models.generateContentStream` method to the **Gemini Interactions API** (`ai.interactions`).

---

## 1. Overview of Changes

The Gemini Interactions API (`ai.interactions`) introduces a modern, stateful-capable paradigm for interacting with Gemini models.

### Paradigm Comparison

| Feature | Legacy (`models.generateContentStream`) | Gemini Interactions API (`interactions.createStream`) |
| :--- | :--- | :--- |
| **SDK Access Point** | `ai.models.generateContentStream` | `ai.interactions.createStream` |
| **Request Payload** | `{ model, contents: { parts }, config }` | `{ model, input, config }` |
| **Stream Output** | Array of candidates with `parts[].text` and `parts[].thought` | Event-driven stream deltas (`text`, `thought`, `usage`) |
| **Session Capability** | Purely stateless | Stateful interaction sessions support follow-up turns |
| **Thinking Config** | `config.thinkingConfig = { includeThoughts, thinkingLevel }` | `config.thinkingConfig` mapped to interaction options |

---

## 2. API Signature & Code Comparison

### Legacy Implementation (`app/api/generate/route.ts`)

```typescript
// Legacy: models.generateContentStream
const responseStream = await activeAi.models.generateContentStream({
  model: model || "gemini-3.5-flash",
  contents: { parts },
  config: {
    systemInstruction: systemPrompt,
    temperature: Number(temperature),
    thinkingConfig: {
      includeThoughts: true,
      thinkingLevel: mappedThinkingLevel,
    },
    maxOutputTokens: maxTokens ? Number(maxTokens) : undefined,
  },
});

for await (const chunk of responseStream) {
  const chunkParts = chunk.candidates?.[0]?.content?.parts || [];
  let text = "";
  let thought = "";

  for (const p of chunkParts) {
    if (p.thought) {
      thought += p.text || "";
    } else {
      text += p.text || "";
    }
  }

  if (text || thought) {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ text, thought })}\n\n`)
    );
  }
}
```

### Interactions API Implementation (`app/api/generate/route.ts`)

```typescript
// Migration: interactions.createStream
const responseStream = await activeAi.interactions.createStream({
  model: model || "gemini-3.5-flash",
  input: {
    systemInstruction: systemPrompt,
    parts: parts,
  },
  config: {
    temperature: Number(temperature),
    thinkingConfig: {
      includeThoughts: true,
      thinkingLevel: mappedThinkingLevel,
    },
    maxOutputTokens: maxTokens ? Number(maxTokens) : undefined,
  },
});

for await (const chunk of responseStream) {
  // Extract token usage metadata if present
  if (chunk.usageMetadata) {
    const usage = {
      promptTokens: chunk.usageMetadata.promptTokenCount,
      candidatesTokens: chunk.usageMetadata.candidatesTokenCount,
      totalTokens: chunk.usageMetadata.totalTokenCount,
      cachedTokens: chunk.usageMetadata.cachedContentTokenCount,
    };
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ usage })}\n\n`)
    );
  }

  // Process text and thought deltas from interaction chunk parts
  const chunkParts = chunk.candidates?.[0]?.content?.parts || chunk.parts || [];
  let text = "";
  let thought = "";

  for (const p of chunkParts) {
    if (p.thought) {
      thought += p.text || "";
    } else {
      text += p.text || "";
    }
  }

  if (text || thought) {
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ text, thought })}\n\n`)
    );
  }
}
```

---

## 3. Multi-Modal Part Formatting

Multi-modal inputs (`images` and `videos`) remain structured using `inlineData` or `fileData` parts:

```typescript
// Images (JPEG/PNG Base64)
parts.push({
  inlineData: {
    mimeType: img.mimeType || "image/jpeg",
    data: cleanBase64Data,
  }
});

// Videos (MP4 Base64 or YouTube URL)
if (vid.youtubeUrl) {
  parts.push({
    fileData: {
      fileUri: vid.youtubeUrl,
    }
  });
} else if (vid.base64) {
  parts.push({
    inlineData: {
      mimeType: vid.mimeType || "video/mp4",
      data: cleanBase64Data,
    }
  });
}
```

---

## 4. Next.js SSE Response Preservation

To ensure zero breakage in the frontend consumer ([app/page.tsx](file:///e:/_github/PromptX/app/page.tsx)), the API route returns standard `text/event-stream` format:

```typescript
return new NextResponse(stream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  },
});
```

Payload structure emitted to client:
- `data: {"filledPrompt": "..."}`
- `data: {"text": "...", "thought": "..."}`
- `data: {"usage": {"promptTokens": 120, "candidatesTokens": 450, ...}}`
