import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper: converts typical GitHub blob URLs to raw URLs
export const truncateText = (text: string, maxLength: number = 80): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

export const getRawUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "github.com") {
      const parts = parsed.pathname.split("/");
      // E.g. /username/repo/blob/branch/path/to/file.json
      if (parts[3] === "blob") {
        parts.splice(3, 1); // remove "blob"
        parsed.hostname = "raw.githubusercontent.com";
        parsed.pathname = parts.join("/");
        return parsed.toString();
      }
    }
    return url;
  } catch (e) {
    return url;
  }
};

// --- Diff Helper interfaces and function ---
export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  value: string;
  lineNumberA?: number;
  lineNumberB?: number;
}

export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  
  const n = oldLines.length;
  const m = newLines.length;
  
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const diff: DiffLine[] = [];
  let i = n;
  let j = m;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diff.unshift({
        type: "unchanged",
        value: oldLines[i - 1],
        lineNumberA: i,
        lineNumberB: j
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({
        type: "added",
        value: newLines[j - 1],
        lineNumberB: j
      });
      j--;
    } else {
      diff.unshift({
        type: "removed",
        value: oldLines[i - 1],
        lineNumberA: i
      });
      i--;
    }
  }
  
  return diff;
}

export interface SplitDiffRow {
  left?: {
    lineNumber?: number;
    value: string;
    type: "removed" | "unchanged";
  };
  right?: {
    lineNumber?: number;
    value: string;
    type: "added" | "unchanged";
  };
}

export function alignDiffLines(diffLines: DiffLine[]): SplitDiffRow[] {
  const rows: SplitDiffRow[] = [];
  let i = 0;
  const len = diffLines.length;

  while (i < len) {
    if (diffLines[i].type === "unchanged") {
      rows.push({
        left: {
          lineNumber: diffLines[i].lineNumberA,
          value: diffLines[i].value,
          type: "unchanged"
        },
        right: {
          lineNumber: diffLines[i].lineNumberB,
          value: diffLines[i].value,
          type: "unchanged"
        }
      });
      i++;
    } else {
      const removed: DiffLine[] = [];
      const added: DiffLine[] = [];
      
      while (i < len && diffLines[i].type !== "unchanged") {
        if (diffLines[i].type === "removed") {
          removed.push(diffLines[i]);
        } else if (diffLines[i].type === "added") {
          added.push(diffLines[i]);
        }
        i++;
      }
      
      const maxLen = Math.max(removed.length, added.length);
      for (let k = 0; k < maxLen; k++) {
        const leftLine = removed[k];
        const rightLine = added[k];
        
        rows.push({
          left: leftLine ? {
            lineNumber: leftLine.lineNumberA,
            value: leftLine.value,
            type: "removed"
          } : undefined,
          right: rightLine ? {
            lineNumber: rightLine.lineNumberB,
            value: rightLine.value,
            type: "added"
          } : undefined
        });
      }
    }
  }
  return rows;
}

// Helper: converts file to Base64 and compresses to JPEG via HTML Canvas
export const compressImageToJpeg = (file: File, quality = 0.9): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const rawBase64 = reader.result as string;
      
      // If the file is extremely small (< 40KB) or not a common image, bypass canvas processing
      if (file.size < 40960 && (file.type === "image/jpeg" || file.type === "image/png")) {
        resolve(rawBase64);
        return;
      }

      const img = new window.Image();
      img.src = rawBase64;
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          // Maintain exact original resolution
          const width = img.naturalWidth || img.width || 800;
          const height = img.naturalHeight || img.height || 600;
          
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(rawBase64);
            return;
          }

          // Fill background with white to handle alpha transparency of PNGs elegantly
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG format with specified quality level
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn("Canvas compression failed, falling back to raw Base64:", err);
          resolve(rawBase64);
        }
      };
      img.onerror = (err) => {
        console.warn("Image onload failed, falling back to raw Base64:", err);
        resolve(rawBase64);
      };
    };
    reader.onerror = (err) => reject(err);
  });
};
