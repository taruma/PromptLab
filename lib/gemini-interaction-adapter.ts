import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export interface UploadedImage {
  label: string;
  base64: string;
  mimeType: string;
}

export interface UploadedVideo {
  label: string;
  base64?: string;
  youtubeUrl?: string;
  mimeType?: string;
}

export interface InteractionParams {
  variables?: Record<string, string>;
  images?: UploadedImage[];
  videos?: UploadedVideo[];
  systemPrompt?: string;
  promptTemplate?: string;
  filledTemplate: string;
  model?: string;
  thinkingLevel?: string;
  temperature?: number;
  maxTokens?: number;
  customApiKey?: string;
  defaultAi: GoogleGenAI;
}

/**
 * Handles streaming generation via Gemini Interactions API (ai.interactions.createStream).
 * Encapsulates Interaction API details and yields SSE-compatible chunk data objects.
 */
export async function createInteractionStreamResponse(
  params: InteractionParams,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController
): Promise<void> {
  const {
    images = [],
    videos = [],
    systemPrompt = "",
    filledTemplate,
    model = "gemini-3.5-flash",
    thinkingLevel = "MEDIUM",
    temperature = 1.0,
    maxTokens,
    customApiKey,
    defaultAi,
  } = params;

  // Use custom API key client if provided, otherwise default client
  const aiClient = customApiKey?.trim()
    ? new GoogleGenAI({
        apiKey: customApiKey.trim(),
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build-custom-interaction",
          },
        },
      })
    : defaultAi;

  // Send the filled template in the very first SSE chunk
  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({ filledPrompt: filledTemplate })}\n\n`)
  );

  // Prepare multi-modal content parts
  const parts: any[] = [];

  // Visual reference images
  for (const img of images) {
    let cleanData = img.base64;
    const commaIndex = cleanData.indexOf(",");
    if (commaIndex !== -1) {
      cleanData = cleanData.substring(commaIndex + 1);
    }
    parts.push({
      inlineData: {
        mimeType: img.mimeType || "image/jpeg",
        data: cleanData,
      },
    });
  }

  // Visual reference videos
  for (const vid of videos) {
    if (vid.youtubeUrl) {
      parts.push({
        fileData: {
          fileUri: vid.youtubeUrl,
        },
      });
    } else if (vid.base64) {
      let cleanData = vid.base64;
      const commaIndex = cleanData.indexOf(",");
      if (commaIndex !== -1) {
        cleanData = cleanData.substring(commaIndex + 1);
      }
      parts.push({
        inlineData: {
          mimeType: vid.mimeType || "video/mp4",
          data: cleanData,
        },
      });
    }
  }

  // Main prompt text
  parts.push({
    text: `Please process this concept request. Here is the compiled specifications:\n\n${filledTemplate}`,
  });

  // Mapped Thinking Level
  let mappedThinkingLevel: ThinkingLevel | undefined;
  if (thinkingLevel === "HIGH") mappedThinkingLevel = ThinkingLevel.HIGH;
  else if (thinkingLevel === "MEDIUM") mappedThinkingLevel = ThinkingLevel.MEDIUM;
  else if (thinkingLevel === "LOW") mappedThinkingLevel = ThinkingLevel.LOW;
  else if (thinkingLevel === "MINIMAL" && !model.includes("pro-preview")) {
    mappedThinkingLevel = ThinkingLevel.MINIMAL;
  }

  const thinkingConfig = {
    includeThoughts: true,
    ...(mappedThinkingLevel ? { thinkingLevel: mappedThinkingLevel } : {}),
  };

  try {
    // Check if aiClient supports interactions API (aiClient.interactions or aiClient.chats)
    const clientAny = aiClient as any;
    let responseStream: any;

    if (clientAny.interactions && typeof clientAny.interactions.createStream === "function") {
      responseStream = await clientAny.interactions.createStream({
        model: model || "gemini-3.5-flash",
        input: {
          systemInstruction: systemPrompt,
          parts: parts,
        },
        config: {
          temperature: temperature !== undefined ? Number(temperature) : 1.0,
          thinkingConfig,
          ...(maxTokens ? { maxOutputTokens: Number(maxTokens) } : {}),
        },
      });
    } else {
      // Fallback for current SDK interface if interactions property is under models or chats
      const config: any = {
        systemInstruction: systemPrompt,
        temperature: temperature !== undefined ? Number(temperature) : 1.0,
        thinkingConfig,
        ...(maxTokens ? { maxOutputTokens: Number(maxTokens) } : {}),
      };

      responseStream = await aiClient.models.generateContentStream({
        model: model || "gemini-3.5-flash",
        contents: { parts },
        config,
      });
    }

    let latestUsage: {
      promptTokens?: number;
      candidatesTokens?: number;
      totalTokens?: number;
      cachedTokens?: number;
    } | null = null;

    for await (const chunk of responseStream) {
      if (chunk.usageMetadata) {
        latestUsage = {
          promptTokens: chunk.usageMetadata.promptTokenCount,
          candidatesTokens: chunk.usageMetadata.candidatesTokenCount,
          totalTokens: chunk.usageMetadata.totalTokenCount,
          cachedTokens: chunk.usageMetadata.cachedContentTokenCount,
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ usage: latestUsage })}\n\n`)
        );
      }

      const chunkParts =
        chunk.candidates?.[0]?.content?.parts || chunk.parts || [];
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

    if (latestUsage) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ usage: latestUsage })}\n\n`)
      );
    }
  } catch (error: any) {
    console.error("Error in Interaction API Stream:", error);
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
    );
  }
}
