import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Initialize Gemini client on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

interface UploadedImage {
  label: string;
  base64: string; // potentially a dataURL
  mimeType: string;
}

export async function POST(req: NextRequest) {
  try {
    let { 
      variables = {}, 
      images = [], 
      systemPrompt, 
      promptTemplate,
      model = "gemini-3.5-flash",
      thinkingLevel = "MEDIUM",
      temperature = 1.0,
      maxTokens,
      customApiKey
    } = await req.json() as {
      variables: Record<string, string>;
      images: UploadedImage[];
      systemPrompt?: string;
      promptTemplate?: string;
      model?: string;
      thinkingLevel?: string;
      temperature?: number;
      maxTokens?: number;
      customApiKey?: string;
    };

    // Determine the active API key and dynamic client instantiation
    const activeApiKey = customApiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!activeApiKey) {
      return NextResponse.json({ 
        error: "No Gemini API key found. Please input a custom API key in 'Engine Controls' or verify the project settings." 
      }, { status: 400 });
    }

    const activeAi = customApiKey?.trim()
      ? new GoogleGenAI({
          apiKey: customApiKey.trim(),
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build-custom',
            }
          }
        })
      : ai;

    // Load original prompt and template from files if not supplied by the client
    if (!systemPrompt || !promptTemplate) {
      const systemPromptPath = path.join(process.cwd(), "prompts", "system_prompt.txt");
      const promptTemplatePath = path.join(process.cwd(), "prompts", "prompt_template.txt");

      if (!systemPrompt) {
        systemPrompt = await fs.readFile(systemPromptPath, "utf-8");
      }
      if (!promptTemplate) {
        promptTemplate = await fs.readFile(promptTemplatePath, "utf-8");
      }
    }

    let filledTemplate = promptTemplate;

    // Process image reference naming e.g. "@image1 as Name, @image2 as Name"
    const imageList: UploadedImage[] = images || [];
    let visualReferencesText = "None";
    if (imageList.length > 0) {
      visualReferencesText = imageList
        .map((img, index) => `@image${index + 1} as ${img.label || `Image ${index + 1}`}`)
        .join(", ");
    }

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

    // Add the filled template as the main prompt text
    parts.push({
      text: `Please process this concept request. Here is the compiled specifications:\n\n${filledTemplate}`,
    });

    // Call Gemini with the systemInstruction and custom parameters
    const config: any = {
      systemInstruction: systemPrompt,
      temperature: temperature !== undefined ? Number(temperature) : 1.0,
    };

    // Apply thinkingLevel configuration if using a Gemini 3 series model
    if (model.startsWith("gemini-3")) {
      let mappedThinkingLevel: ThinkingLevel | undefined;
      if (thinkingLevel === "HIGH") mappedThinkingLevel = ThinkingLevel.HIGH;
      else if (thinkingLevel === "MEDIUM") mappedThinkingLevel = ThinkingLevel.MEDIUM;
      else if (thinkingLevel === "LOW") mappedThinkingLevel = ThinkingLevel.LOW;
      else if (thinkingLevel === "MINIMAL" && model !== "gemini-3.1-pro-preview") {
        mappedThinkingLevel = ThinkingLevel.MINIMAL;
      }
      
      if (mappedThinkingLevel) {
        config.thinkingConfig = {
          thinkingLevel: mappedThinkingLevel,
        };
      }
    }

    if (maxTokens) {
      config.maxOutputTokens = Number(maxTokens);
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
        } catch (streamError: any) {
          console.error("Error in generate stream:", streamError);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: streamError.message })}\n\n`)
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
