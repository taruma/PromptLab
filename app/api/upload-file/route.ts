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
    return NextResponse.json({ error: error.message || "Failed to list files from Gemini Files API." }, { status: 500 });
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
    return NextResponse.json({ error: error.message || "Failed to upload file to Gemini Files API." }, { status: 500 });
  }
}
