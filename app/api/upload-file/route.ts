import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function getActiveApiKey(customApiKey?: string): { apiKey?: string; error?: string } {
  const allowServerEnvKey = process.env.ALLOW_SERVER_ENV_KEY?.toLowerCase() !== "false" && process.env.ALLOW_SERVER_ENV_KEY !== "0";
  const trimmedCustom = customApiKey?.trim();
  const apiKey = trimmedCustom || (allowServerEnvKey ? process.env.GEMINI_API_KEY : undefined);

  if (!apiKey) {
    if (!allowServerEnvKey && !trimmedCustom) {
      return {
        error: "Server environment API key usage is disabled on this deployment. Please enter your custom Gemini API key in 'Engine Controls'."
      };
    }
    return {
      error: "No Gemini API key found. Please input a custom API key in 'Engine Controls' or verify configuration."
    };
  }

  return { apiKey };
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

  if (message.includes("Failed to convert server response to JSON")) {
    return "Gemini Files API Error: Google's backend encountered an internal serialization error (500: Failed to convert server response to JSON). This typically occurs when an aborted or corrupt file entry exists in the account.";
  }

  if (
    message.includes("You do not have permission to access the File") ||
    message.includes("PERMISSION_DENIED") ||
    (message.includes("403") && message.includes("File"))
  ) {
    const fileMatch = message.match(/File\s+([a-zA-Z0-9_-]+)/);
    const fileId = fileMatch ? fileMatch[1] : "";
    return `Gemini Files API Error: Access denied to uploaded file resource ${fileId ? `'${fileId}'` : ""}. Files API assets expire after 48 hours and are linked to the specific API key used during upload.`;
  }

  if (message.includes("API_KEY_INVALID") || message.includes("API key not valid")) {
    return "Gemini API Error: Invalid API key provided. Please check your custom API key in 'Engine Controls' or verify configuration.";
  }

  return message;
}

async function safelyListFiles(ai: GoogleGenAI): Promise<any[]> {
  // Strategy 1: Attempt standard batch fetch (fastest when account files metadata is healthy)
  try {
    const listResult = await ai.files.list({ config: { pageSize: 100 } });
    const fileList: any[] = [];
    if (Array.isArray((listResult as any).files)) {
      fileList.push(...(listResult as any).files);
    } else if (typeof (listResult as any)[Symbol.asyncIterator] === "function") {
      for await (const file of listResult as any) {
        fileList.push(file);
      }
    } else if (Array.isArray(listResult)) {
      fileList.push(...listResult);
    }
    return fileList;
  } catch (batchError: any) {
    console.warn("Standard files.list batch failed, attempting progressive item-by-item fallback:", batchError?.message);
  }

  // Strategy 2: Progressive fallback with pageSize: 1.
  // If an aborted or corrupted file entry exists on Google's backend, batch serialization crashes
  // with 500 "Failed to convert server response to JSON". Iterating item-by-item allows us to
  // harvest all valid active files that precede the corrupted entry.
  try {
    const pager = await ai.files.list({ config: { pageSize: 1 } });
    const collectedFiles: any[] = [];
    try {
      for await (const file of pager as any) {
        collectedFiles.push(file);
      }
    } catch (streamError: any) {
      console.warn("Files API progressive listing stopped at unreadable item. Recovered valid files:", collectedFiles.length);
    }
    if (collectedFiles.length > 0) {
      return collectedFiles;
    }
    throw new Error("Unable to retrieve any files from Gemini Files API.");
  } catch (fallbackError: any) {
    console.error("Progressive files listing fallback failed:", fallbackError);
    throw fallbackError;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customApiKey = req.headers.get("x-api-key") || searchParams.get("customApiKey") || undefined;
    const { apiKey: activeApiKey, error: keyError } = getActiveApiKey(customApiKey);

    if (!activeApiKey) {
      return NextResponse.json({ error: keyError }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: activeApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-files-api',
        }
      }
    });

    const fileList = await safelyListFiles(ai);

    const mappedFiles = fileList.map((f: any) => ({
      name: f.name,
      displayName: f.displayName || f.name,
      mimeType: f.mimeType,
      sizeBytes: Number(f.sizeBytes) || 0,
      fileUri: f.uri,
      state: f.state,
      expirationTime: f.expirationTime,
      createTime: f.createTime,
      updateTime: f.updateTime,
    }));

    return NextResponse.json({ files: mappedFiles });
  } catch (error: any) {
    console.error("Files API List Error:", error);
    return NextResponse.json({ error: formatGeminiErrorMessage(error) || "Failed to list files from Gemini Files API." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;
  try {
    const contentType = req.headers.get("content-type") || "";
    let isJson = contentType.includes("application/json");

    let formData: FormData | null = null;
    let jsonBody: any = null;

    if (isJson) {
      jsonBody = await req.json().catch(() => null);
    } else if (contentType.includes("multipart/form-data")) {
      formData = await req.formData().catch(() => null);
    } else {
      jsonBody = await req.json().catch(() => null);
      if (jsonBody) {
        isJson = true;
      } else {
        formData = await req.formData().catch(() => null);
      }
    }

    const action = isJson ? jsonBody?.action : (formData?.get("action") as string | null);

    // ACTION: RESUMABLE SESSION (Direct Resumable Upload Handshake Wrapper)
    if (action === "resumable_session") {
      const fileName = isJson ? jsonBody?.fileName : (formData?.get("fileName") as string);
      const mimeType = isJson ? jsonBody?.mimeType : (formData?.get("mimeType") as string);
      const fileSize = isJson ? jsonBody?.fileSize : Number(formData?.get("fileSize"));
      const customApiKey = isJson ? jsonBody?.customApiKey : (formData?.get("customApiKey") as string) || req.headers.get("x-api-key") || undefined;
      const { apiKey: activeApiKey, error: keyError } = getActiveApiKey(customApiKey);

      if (!activeApiKey) {
        return NextResponse.json({ error: keyError }, { status: 400 });
      }

      if (!fileName || !fileSize) {
        return NextResponse.json({ error: "Missing fileName or fileSize for resumable session." }, { status: 400 });
      }

      const googleInitRes = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(activeApiKey)}`,
        {
          method: "POST",
          headers: {
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": String(fileSize),
            "X-Goog-Upload-Header-Content-Type": mimeType || "application/octet-stream",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: {
              display_name: fileName,
            },
          }),
        }
      );

      if (!googleInitRes.ok) {
        const errText = await googleInitRes.text().catch(() => "");
        return NextResponse.json({
          error: `Google Files API session initialization failed: ${googleInitRes.statusText} ${errText}`
        }, { status: googleInitRes.status });
      }

      const uploadUrl = googleInitRes.headers.get("X-Goog-Upload-URL");
      if (!uploadUrl) {
        return NextResponse.json({
          error: "Google Files API did not return an X-Goog-Upload-URL session header."
        }, { status: 500 });
      }

      return NextResponse.json({ uploadUrl });
    }

    // ACTION: LIST
    if (action === "list") {
      const customApiKey = isJson ? jsonBody?.customApiKey : (formData?.get("customApiKey") as string) || req.headers.get("x-api-key") || undefined;
      const { apiKey: activeApiKey, error: keyError } = getActiveApiKey(customApiKey);

      if (!activeApiKey) {
        return NextResponse.json({ error: keyError }, { status: 400 });
      }

      const ai = new GoogleGenAI({
        apiKey: activeApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build-files-api',
          }
        }
      });

      const fileList = await safelyListFiles(ai);

      const mappedFiles = fileList.map((f: any) => ({
        name: f.name,
        displayName: f.displayName || f.name,
        mimeType: f.mimeType,
        sizeBytes: Number(f.sizeBytes) || 0,
        fileUri: f.uri,
        state: f.state,
        expirationTime: f.expirationTime,
        createTime: f.createTime,
        updateTime: f.updateTime,
      }));

      return NextResponse.json({ files: mappedFiles });
    }

    // ACTION: DELETE
    if (action === "delete") {
      const fileName = isJson ? jsonBody?.name : (formData?.get("name") as string);
      const customApiKey = isJson ? jsonBody?.customApiKey : (formData?.get("customApiKey") as string) || req.headers.get("x-api-key") || undefined;
      if (!fileName) {
        return NextResponse.json({ error: "Missing file resource name to delete." }, { status: 400 });
      }
      const { apiKey: activeApiKey, error: keyError } = getActiveApiKey(customApiKey);
      if (!activeApiKey) {
        return NextResponse.json({ error: keyError }, { status: 400 });
      }

      const ai = new GoogleGenAI({
        apiKey: activeApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build-files-api',
          }
        }
      });

      await ai.files.delete({ name: fileName });
      return NextResponse.json({ success: true, name: fileName });
    }

    // 1. CHUNKED UPLOAD - ACTION: START
    if (action === "start") {
      const fileName = isJson ? jsonBody?.fileName : (formData?.get("fileName") as string);
      const mimeType = isJson ? jsonBody?.mimeType : (formData?.get("mimeType") as string);

      const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const safeUploadId = uploadId.replace(/[^a-zA-Z0-9_-]/g, "");
      const targetPath = path.join(os.tmpdir(), `promptlab_${safeUploadId}.tmp`);

      // Initialize empty temporary staging file
      await fs.writeFile(targetPath, Buffer.alloc(0));

      return NextResponse.json({ uploadId: safeUploadId });
    }

    // 2. CHUNKED UPLOAD - ACTION: CHUNK
    if (action === "chunk") {
      if (!formData) {
        return NextResponse.json({ error: "Chunk upload requires multipart/form-data payload." }, { status: 400 });
      }
      const rawUploadId = formData.get("uploadId") as string;
      const chunkFile = formData.get("chunk") as File | null;

      if (!rawUploadId || !chunkFile) {
        return NextResponse.json({ error: "Missing uploadId or chunk data." }, { status: 400 });
      }

      const safeUploadId = rawUploadId.replace(/[^a-zA-Z0-9_-]/g, "");
      const targetPath = path.join(os.tmpdir(), `promptlab_${safeUploadId}.tmp`);

      // Append chunk buffer to staging file
      const arrayBuffer = await chunkFile.arrayBuffer();
      const chunkBuffer = Buffer.from(arrayBuffer);

      await fs.appendFile(targetPath, chunkBuffer);

      return NextResponse.json({ success: true, uploadId: safeUploadId });
    }

    // 3. CHUNKED UPLOAD - ACTION: FINISH
    if (action === "finish") {
      const rawUploadId = isJson ? jsonBody?.uploadId : (formData?.get("uploadId") as string);
      const fileName = isJson ? jsonBody?.fileName : (formData?.get("fileName") as string);
      const mimeType = isJson ? jsonBody?.mimeType : (formData?.get("mimeType") as string);
      const customApiKey = isJson ? jsonBody?.customApiKey : (formData?.get("customApiKey") as string) || req.headers.get("x-api-key") || undefined;

      if (!rawUploadId) {
        return NextResponse.json({ error: "Missing uploadId in finish action." }, { status: 400 });
      }

      const safeUploadId = rawUploadId.replace(/[^a-zA-Z0-9_-]/g, "");
      tempFilePath = path.join(os.tmpdir(), `promptlab_${safeUploadId}.tmp`);

      try {
        await fs.access(tempFilePath);
      } catch {
        return NextResponse.json({ error: "Staged file upload session not found or expired." }, { status: 404 });
      }

      const { apiKey: activeApiKey, error: keyError } = getActiveApiKey(customApiKey);
      if (!activeApiKey) {
        return NextResponse.json({ error: keyError }, { status: 400 });
      }

      const ai = new GoogleGenAI({
        apiKey: activeApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build-files-api',
          }
        }
      });

      // Upload staged temp file to Gemini Files API
      const uploadResult = await ai.files.upload({
        file: tempFilePath,
        config: {
          mimeType: mimeType || "application/octet-stream",
          displayName: fileName || "Reference File",
        }
      });

      // Clean up temporary local staging file immediately
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
        tempFilePath = null;
      }

      if (!uploadResult.name) {
        return NextResponse.json({ error: "Files API did not return a valid file resource name." }, { status: 500 });
      }

      const fileResourceName = uploadResult.name;

      // Poll until file state is ACTIVE (or timeout after 45s)
      let fileState = uploadResult;
      const startTime = Date.now();
      while (fileState.state === "PROCESSING" && (Date.now() - startTime < 45000)) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        fileState = await ai.files.get({ name: fileResourceName });
      }

      if (fileState.state === "FAILED") {
        return NextResponse.json({ error: "File processing failed on Gemini Files API." }, { status: 500 });
      }

      return NextResponse.json({
        fileUri: fileState.uri,
        name: fileState.name,
        displayName: fileState.displayName || fileName,
        mimeType: fileState.mimeType || mimeType,
        sizeBytes: Number(fileState.sizeBytes) || 0,
        expirationTime: fileState.expirationTime,
        state: fileState.state,
      });
    }

    // 4. CHUNKED UPLOAD - ACTION: CANCEL
    if (action === "cancel") {
      const rawUploadId = isJson ? jsonBody?.uploadId : (formData?.get("uploadId") as string);
      if (rawUploadId) {
        const safeUploadId = rawUploadId.replace(/[^a-zA-Z0-9_-]/g, "");
        const targetPath = path.join(os.tmpdir(), `promptlab_${safeUploadId}.tmp`);
        await fs.unlink(targetPath).catch(() => {});
      }
      return NextResponse.json({ cancelled: true });
    }

    // 5. LEGACY SINGLE FILE DIRECT UPLOAD MODE (no action specified)
    if (!formData) {
      return NextResponse.json({ error: "No form data or valid action provided." }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const customApiKey = (formData.get("customApiKey") as string) || req.headers.get("x-api-key") || undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided in form data." }, { status: 400 });
    }

    const { apiKey: activeApiKey, error: keyError } = getActiveApiKey(customApiKey);
    if (!activeApiKey) {
      return NextResponse.json({ error: keyError }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: activeApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-files-api',
        }
      }
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempDir = os.tmpdir();
    const sanitizeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    tempFilePath = path.join(tempDir, `promptlab_upload_${Date.now()}_${sanitizeName}`);

    await fs.writeFile(tempFilePath, buffer);

    const uploadResult = await ai.files.upload({
      file: tempFilePath,
      config: {
        mimeType: file.type || "application/octet-stream",
        displayName: file.name,
      }
    });

    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
      tempFilePath = null;
    }

    if (!uploadResult.name) {
      return NextResponse.json({ error: "Files API did not return a valid file resource name." }, { status: 500 });
    }

    const fileName = uploadResult.name;

    let fileState = uploadResult;
    const startTime = Date.now();
    while (fileState.state === "PROCESSING" && (Date.now() - startTime < 45000)) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      fileState = await ai.files.get({ name: fileName });
    }

    if (fileState.state === "FAILED") {
      return NextResponse.json({ error: "File processing failed on Gemini Files API." }, { status: 500 });
    }

    return NextResponse.json({
      fileUri: fileState.uri,
      name: fileState.name,
      displayName: fileState.displayName || file.name,
      mimeType: fileState.mimeType || file.type,
      sizeBytes: Number(fileState.sizeBytes) || file.size,
      expirationTime: fileState.expirationTime,
      state: fileState.state,
    });
  } catch (error: any) {
    console.error("Files API Upload Error:", error);
    if (tempFilePath) {
      await fs.unlink(tempFilePath).catch(() => {});
    }
    return NextResponse.json({ error: formatGeminiErrorMessage(error) || "Failed to process Gemini Files API request." }, { status: 500 });
  }
}
