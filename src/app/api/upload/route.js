// FILE: src/app/api/upload/route.js
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function json(status, body) {
  return NextResponse.json(body, { status });
}

function getUploadDir() {
  const envDir = process.env.UPLOAD_DIR;
  if (envDir) return path.isAbsolute(envDir) ? envDir : path.join(process.cwd(), envDir);
  return path.join(process.cwd(), "public", "uploads");
}

function extFromMime(mime) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return "";
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file) return json(400, { error: "Nedostaje file." });
    if (typeof file === "string") return json(400, { error: "Neispravan file." });

    if (!ALLOWED.has(file.type)) {
      return json(400, { error: "Dozvoljeni formati: JPG, PNG, WEBP, GIF." });
    }
    if (file.size > MAX_BYTES) {
      return json(400, { error: "Slika je prevelika (max 5MB)." });
    }

    const uploadDir = getUploadDir();
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = extFromMime(file.type);
    const filename = `${crypto.randomUUID()}${ext}`;
    const absPath = path.join(uploadDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(absPath, buffer);

    // Pošto snimaš u public/uploads, URL je /uploads/<filename>
    const url = `/uploads/${filename}`;
    return json(201, { url });
  } catch (e) {
    console.error("POST /api/upload error:", e);
    return json(500, { error: "Upload nije uspeo.", details: String(e?.message || e) });
  }
}