---
name: gemini-interactions-api
description: Migration guide and reference for transitioning applications from Gemini models.generateContent to the new Gemini Interactions API (ai.interactions). Use when migrating, upgrading @google/genai SDK, or implementing stateful multi-turn interactions and event streams.
---

# Gemini Interactions API Migration Skill

This skill provides step-by-step instructions, code patterns, and reference architectures for migrating applications from traditional `@google/genai` `models.generateContent` / `models.generateContentStream` to the **Gemini Interactions API** (`ai.interactions.create` / `ai.interactions.createStream`).

## Key Migration Objectives

1. **API Call Shift**:
   - Replace `activeAi.models.generateContentStream({ model, contents, config })` with `activeAi.interactions.createStream({ model, input, config })`.
2. **Unified Event Streaming**:
   - Handle structured stream events for `text` deltas, `thought` / reasoning trace deltas, and `usageMetadata` token counts.
3. **Multi-Modal Attachment Mapping**:
   - Map image Base64 data (`inlineData`), video uploads (`inlineData`), and YouTube or file references (`fileData`) to the Interactions API input structure.
4. **Backward-Compatible SSE Preservation**:
   - Keep the server-sent events (SSE) API contract compatible with frontend consumers (`data: { text, thought, usage, filledPrompt }`).

## References

For detailed code comparison, type definitions, and Next.js App Router patterns, see [references/migration.md](file:///e:/_github/PromptX/.agents/skills/gemini-interactions-api/references/migration.md).
