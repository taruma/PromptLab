import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface UploadedImage {
  label: string;
  base64: string; // potentially a dataURL
  mimeType: string;
  isFilesApi?: boolean;
  fileUri?: string;
}

interface UploadedVideo {
  label: string;
  base64?: string; // potentially a dataURL
  youtubeUrl?: string; // YouTube video URL
  mimeType?: string;
  isFilesApi?: boolean;
  fileUri?: string;
}

function formatGeminiErrorMessage(rawError: any): string {
  let message = typeof rawError === "string" ? rawError : rawError?.message || String(rawError || "An unknown error occurred.");
  
  // Unwrap nested JSON error strings if present
  for (let i = 0; i < 3; i++) {
    if (typeof message === "string" && (message.trim().startsWith("{") || message.trim().startsWith("["))) {
      try {
        const parsed = JSON.parse(message);
        if (parsed?.error?.message) {
          message = parsed.error.message;
        } else if (parsed?.message) {
          message = parsed.message;
        } else if (parsed?.error && typeof parsed.error === "string") {
          message = parsed.error;
        } else {
          break;
        }
      } catch {
        break;
      }
    }
  }

  // Actionable guidance for Gemini Files API 403 / permission denied errors
  if (
    message.includes("You do not have permission to access the File") ||
    message.includes("PERMISSION_DENIED") ||
    (message.includes("403") && message.includes("File"))
  ) {
    const fileMatch = message.match(/File\s+([a-zA-Z0-9_-]+)/);
    const fileId = fileMatch ? fileMatch[1] : "";
    return `Gemini Files API Error: Access denied to uploaded file resource ${fileId ? `'${fileId}'` : ""}. Note: Files API assets are linked to the specific API key used during upload and automatically expire after 48 hours. If you switched API keys or the file expired, please re-upload or re-select an active file in the 'Files API Upload' modal.`;
  }

  if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
    return "Gemini API Error: Invalid API key provided. Please check your custom API key in 'Engine Controls' or verify project settings.";
  }

  return message;
}

export async function POST(req: NextRequest) {
  try {
    let { 
      variables = {}, 
      images = [], 
      videos = [],
      systemPrompt, 
      promptTemplate,
      model = "gemini-3.7-flash",
      thinkingLevel = "MEDIUM",
      temperature = 1.0,
      maxTokens,
      customApiKey,
      responseMimeType,
      responseSchema,
    } = await req.json() as {
      variables: Record<string, string>;
      images: UploadedImage[];
      videos?: UploadedVideo[];
      systemPrompt?: string;
      promptTemplate?: string;
      model?: string;
      thinkingLevel?: string;
      temperature?: number;
      maxTokens?: number;
      customApiKey?: string;
      responseMimeType?: string;
      responseSchema?: string | object;
    };

    // Determine the active API key and dynamic client instantiation
    const allowServerEnvKey = process.env.ALLOW_SERVER_ENV_KEY?.toLowerCase() !== "false" && process.env.ALLOW_SERVER_ENV_KEY !== "0";
    const trimmedCustomKey = customApiKey?.trim();
    const activeApiKey = trimmedCustomKey || (allowServerEnvKey ? process.env.GEMINI_API_KEY : undefined);

    if (!activeApiKey) {
      if (!allowServerEnvKey && !trimmedCustomKey) {
        return NextResponse.json({ 
          error: "Server environment API key usage is disabled on this deployment. Please enter your custom Gemini API key in 'Engine Controls' to generate." 
        }, { status: 400 });
      }
      return NextResponse.json({ 
        error: "No Gemini API key found. Please input a custom API key in 'Engine Controls' or verify the project settings." 
      }, { status: 400 });
    }

    const activeAi = new GoogleGenAI({
      apiKey: activeApiKey,
      httpOptions: {
        headers: {
          'User-Agent': trimmedCustomKey ? 'aistudio-build-custom' : 'aistudio-build',
        }
      }
    });

    // Load original prompt and template from files if not supplied (undefined/null) by the client
    if (systemPrompt === undefined || systemPrompt === null || promptTemplate === undefined || promptTemplate === null) {
      const systemPromptPath = path.join(process.cwd(), "prompts", "system_prompt.txt");
      const promptTemplatePath = path.join(process.cwd(), "prompts", "prompt_template.txt");

      if (systemPrompt === undefined || systemPrompt === null) {
        systemPrompt = await fs.readFile(systemPromptPath, "utf-8");
      }
      if (promptTemplate === undefined || promptTemplate === null) {
        promptTemplate = await fs.readFile(promptTemplatePath, "utf-8");
      }
    }

    let filledTemplate = promptTemplate;

    // Process reference naming e.g. "@image1 as Name, @video1 as Name, @audio1 as Name, @doc1 as Name"
    const imageList: UploadedImage[] = images || [];
    const videoList: UploadedVideo[] = videos || [];
    
    const referenceTags: string[] = [];
    if (imageList.length > 0) {
      imageList.forEach((img, index) => {
        referenceTags.push(`@image${index + 1} as ${img.label || `Image ${index + 1}`}`);
      });
    }
    if (videoList.length > 0) {
      let vCount = 0;
      let aCount = 0;
      let dCount = 0;
      videoList.forEach((vid) => {
        const isAudio = Boolean(vid.mimeType?.startsWith("audio/"));
        const isDoc = Boolean(
          vid.mimeType?.startsWith("text/") ||
          vid.mimeType === "application/pdf" ||
          (vid.mimeType && !vid.mimeType.startsWith("video/") && !vid.mimeType.startsWith("image/") && !vid.mimeType.startsWith("audio/"))
        );
        if (isAudio) {
          aCount++;
          referenceTags.push(`@audio${aCount} as ${vid.label || `Audio ${aCount}`}`);
        } else if (isDoc) {
          dCount++;
          referenceTags.push(`@doc${dCount} as ${vid.label || `Document ${dCount}`}`);
        } else {
          vCount++;
          referenceTags.push(`@video${vCount} as ${vid.label || `Video ${vCount}`}`);
        }
      });
    }

    const visualReferencesText = referenceTags.length > 0 ? referenceTags.join(", ") : "None";

    // Set automatic variables for references/cast
    const finalVariables = {
      ...variables,
      visual_references: visualReferencesText,
      cast: visualReferencesText,
    };

    // Replace all variable placeholders in the template
    for (const [key, value] of Object.entries(finalVariables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      filledTemplate = filledTemplate.replace(regex, value);
    }

    // Also replace any leftover variables with empty string to prevent placeholders in output
    filledTemplate = filledTemplate.replace(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g, "");

    // Prepare multi-modal content parts
    const parts: any[] = [];

    // Add the visual reference images to the request parts
    for (let i = 0; i < imageList.length; i++) {
      const img = imageList[i];
      if ((img.isFilesApi || img.fileUri) && img.fileUri) {
        let fileDataValid = false;
        let lastFileState: string | undefined = undefined;
        try {
          const fileName = img.fileUri.includes("/files/")
            ? "files/" + img.fileUri.split("/files/")[1]
            : (img.fileUri.startsWith("files/") ? img.fileUri : `files/${img.fileUri}`);

          let fileObj: any = await activeAi.files.get({ name: fileName });
          lastFileState = fileObj?.state;

          // If the file is still PROCESSING (common right after video/image upload), poll for state to become ACTIVE
          let pollAttempts = 0;
          while (fileObj && fileObj.state === "PROCESSING" && pollAttempts < 15) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            try {
              fileObj = await activeAi.files.get({ name: fileName });
              lastFileState = fileObj?.state;
            } catch {
              break;
            }
            pollAttempts++;
          }

          if (fileObj && (fileObj.state === "ACTIVE" || !fileObj.state)) {
            fileDataValid = true;
            parts.push({
              fileData: {
                fileUri: img.fileUri,
                mimeType: fileObj.mimeType || img.mimeType || "image/jpeg",
              }
            });
          } else {
            console.warn(`Files API image file '${fileName}' ended in state '${fileObj?.state}'`);
          }
        } catch (fileErr: any) {
          console.warn(`Files API check failed for image fileUri '${img.fileUri}':`, fileErr?.message || fileErr);
        }

        if (!fileDataValid) {
          if (img.base64 && !img.base64.startsWith("blob:")) {
            let cleanData = img.base64;
            const commaIndex = cleanData.indexOf(",");
            if (commaIndex !== -1) {
              cleanData = cleanData.substring(commaIndex + 1);
            }
            parts.push({
              inlineData: {
                mimeType: img.mimeType || "image/jpeg",
                data: cleanData,
              }
            });
          } else {
            const fileId = img.fileUri.includes("/files/") ? img.fileUri.split("/files/")[1] : img.fileUri;
            if (lastFileState === "PROCESSING") {
              throw new Error(
                `Gemini Files API Notice: The uploaded reference image '@image${i + 1}' (${img.label || "Image"}) referencing '${fileId}' is still being processed by Google Gemini (state: PROCESSING). Please wait a few seconds for media encoding to complete and try generating again.`
              );
            } else if (lastFileState === "FAILED") {
              throw new Error(
                `Gemini Files API Error: Media processing failed on Google Gemini Files API for '@image${i + 1}' (${img.label || "Image"}) referencing '${fileId}'. Please re-upload or select a different asset.`
              );
            } else {
              throw new Error(
                `Gemini Files API Error: The uploaded reference image '@image${i + 1}' (${img.label || "Image"}) referencing '${fileId}' is no longer accessible on Gemini Files API. Files API assets automatically expire after 48 hours or require the same API key used during upload. Please remove or re-upload this asset in the 'Visual Assets' section.`
              );
            }
          }
        }
      } else if (img.base64 && !img.base64.startsWith("blob:")) {
        let cleanData = img.base64;
        const commaIndex = cleanData.indexOf(",");
        if (commaIndex !== -1) {
          cleanData = cleanData.substring(commaIndex + 1);
        }

        parts.push({
          inlineData: {
            mimeType: img.mimeType || "image/jpeg",
            data: cleanData,
          }
        });
      }
    }

    // Add the visual reference videos to the request parts
    for (let i = 0; i < videoList.length; i++) {
      const vid = videoList[i];
      if ((vid.isFilesApi || vid.fileUri) && vid.fileUri) {
        let fileDataValid = false;
        let lastFileState: string | undefined = undefined;
        try {
          const fileName = vid.fileUri.includes("/files/")
            ? "files/" + vid.fileUri.split("/files/")[1]
            : (vid.fileUri.startsWith("files/") ? vid.fileUri : `files/${vid.fileUri}`);

          let fileObj: any = await activeAi.files.get({ name: fileName });
          lastFileState = fileObj?.state;

          // If the file is still PROCESSING (common right after video upload), poll for state to become ACTIVE
          let pollAttempts = 0;
          while (fileObj && fileObj.state === "PROCESSING" && pollAttempts < 15) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            try {
              fileObj = await activeAi.files.get({ name: fileName });
              lastFileState = fileObj?.state;
            } catch {
              break;
            }
            pollAttempts++;
          }

          if (fileObj && (fileObj.state === "ACTIVE" || !fileObj.state)) {
            fileDataValid = true;
            parts.push({
              fileData: {
                fileUri: vid.fileUri,
                mimeType: fileObj.mimeType || vid.mimeType || "video/mp4",
              }
            });
          } else {
            console.warn(`Files API video file '${fileName}' ended in state '${fileObj?.state}'`);
          }
        } catch (fileErr: any) {
          console.warn(`Files API check failed for video fileUri '${vid.fileUri}':`, fileErr?.message || fileErr);
        }

        if (!fileDataValid) {
          if (vid.base64 && !vid.base64.startsWith("blob:")) {
            let cleanData = vid.base64;
            const commaIndex = cleanData.indexOf(",");
            if (commaIndex !== -1) {
              cleanData = cleanData.substring(commaIndex + 1);
            }
            parts.push({
              inlineData: {
                mimeType: vid.mimeType || "video/mp4",
                data: cleanData,
              }
            });
          } else {
            const fileId = vid.fileUri.includes("/files/") ? vid.fileUri.split("/files/")[1] : vid.fileUri;
            const assetTag = `@asset${i + 1}`;
            if (lastFileState === "PROCESSING") {
              throw new Error(
                `Gemini Files API Notice: The uploaded reference media '${vid.label || assetTag}' referencing '${fileId}' is still being processed by Google Gemini (state: PROCESSING). Please wait a few seconds for media encoding to complete and try generating again.`
              );
            } else if (lastFileState === "FAILED") {
              throw new Error(
                `Gemini Files API Error: Media processing failed on Google Gemini Files API for '${vid.label || assetTag}' referencing '${fileId}'. Please re-upload or select a different asset.`
              );
            } else {
              throw new Error(
                `Gemini Files API Error: The uploaded reference media '${vid.label || assetTag}' referencing '${fileId}' is no longer accessible on Gemini Files API. Files API assets automatically expire after 48 hours or require the same API key used during upload. Please remove or re-upload this asset in the 'Visual Assets' section.`
              );
            }
          }
        }
      } else if (vid.youtubeUrl) {
        parts.push({
          fileData: {
            fileUri: vid.youtubeUrl,
          }
        });
      } else if (vid.base64 && !vid.base64.startsWith("blob:")) {
        let cleanData = vid.base64;
        const commaIndex = cleanData.indexOf(",");
        if (commaIndex !== -1) {
          cleanData = cleanData.substring(commaIndex + 1);
        }

        parts.push({
          inlineData: {
            mimeType: vid.mimeType || "video/mp4",
            data: cleanData,
          }
        });
      }
    }

    // Add the filled template as the main prompt text
    parts.push({
      text: `Please process this concept request. Here is the compiled specifications:\n\n${filledTemplate}`,
    });

    // Call Gemini with the systemInstruction and custom parameters
    const config: any = {
      systemInstruction: systemPrompt,
      temperature: temperature !== undefined ? Number(temperature) : 1.0,
    };

    // Apply thinkingLevel configuration for Gemini models supporting thinking features
    let mappedThinkingLevel: ThinkingLevel | undefined;
    if (thinkingLevel === "HIGH") mappedThinkingLevel = ThinkingLevel.HIGH;
    else if (thinkingLevel === "MEDIUM") mappedThinkingLevel = ThinkingLevel.MEDIUM;
    else if (thinkingLevel === "LOW") mappedThinkingLevel = ThinkingLevel.LOW;
    else if (thinkingLevel === "MINIMAL" && !model.includes("pro-preview")) {
      mappedThinkingLevel = ThinkingLevel.MINIMAL;
    }

    config.thinkingConfig = {
      includeThoughts: true,
      ...(mappedThinkingLevel ? { thinkingLevel: mappedThinkingLevel } : {}),
    };

    if (maxTokens) {
      config.maxOutputTokens = Number(maxTokens);
    }

    if (responseMimeType === "application/json") {
      config.responseMimeType = "application/json";
      if (responseSchema) {
        if (typeof responseSchema === "string" && responseSchema.trim()) {
          try {
            config.responseSchema = JSON.parse(responseSchema.trim());
          } catch (schemaErr: any) {
            return NextResponse.json({
              error: `Invalid JSON Schema provided: ${schemaErr?.message || "Syntax error"}. Please check your schema in Engine Controls.`,
            }, { status: 400 });
          }
        } else if (typeof responseSchema === "object") {
          config.responseSchema = responseSchema;
        }
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseStream = await activeAi.models.generateContentStream({
            model: model || "gemini-3.5-flash",
            contents: { parts },
            config,
          });

          // Send the filled template in the very first SSE chunk
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ filledPrompt: filledTemplate })}\n\n`)
          );

          let latestUsage: { promptTokens?: number; candidatesTokens?: number; totalTokens?: number; cachedTokens?: number } | null = null;

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

          if (latestUsage) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ usage: latestUsage })}\n\n`)
            );
          }
        } catch (streamError: any) {
          console.error("Error in generate stream:", streamError);
          const formattedError = formatGeminiErrorMessage(streamError);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: formattedError })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    const formattedError = formatGeminiErrorMessage(error);
    return NextResponse.json({ error: formattedError }, { status: 500 });
  }
}
