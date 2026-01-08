// FILE: src/app/api/reports/problems/route.js
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { createRequire } from "module";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS } from "@/utils/constants";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const require = createRequire(import.meta.url);
const pdfkitMod = require("pdfkit");

const PDFDocument =
  pdfkitMod?.default ?? pdfkitMod?.PDFDocument ?? pdfkitMod;

if (typeof PDFDocument !== "function") {
  throw new Error(
    `pdfkit import failed: typeof=${typeof PDFDocument}, keys=${Object.keys(pdfkitMod || {}).join(",")}`
  );
}

const ALLOWED_STATUSES = new Set(["primeceno", "prijavljeno", "reseno"]);
const isDev = process.env.NODE_ENV !== "production";

function json(status, body) {
  return NextResponse.json(body, { status });
}

function safeText(v) {
  return v === null || v === undefined ? "" : String(v);
}

function statusLabel(status) {
  return STATUS_LABELS?.[status] ?? status;
}

async function fetchImageBuffer(imageUrl) {
  if (!imageUrl) return null;

  if (imageUrl.startsWith("/uploads/")) {
    try {
      const abs = path.join(process.cwd(), "public", imageUrl);
      return await fs.readFile(abs);
    } catch {
      return null;
    }
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    try {
      const resp = await fetch(imageUrl);
      if (!resp.ok) return null;
      const arr = await resp.arrayBuffer();
      return Buffer.from(arr);
    } catch {
      return null;
    }
  }

  return null;
}

export async function GET(req) {
  try {
    const session = await auth();
    const email = session?.user?.email ? String(session.user.email).toLowerCase() : null;
    if (!email) return json(401, { error: "Morate biti ulogovani" });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // primeceno|prijavljeno|reseno|svi|null

    let where = { user: { email } };
    if (status && status !== "svi") {
      if (!ALLOWED_STATUSES.has(status)) return json(400, { error: "Nevalidan status." });
      where = { user: { email }, status };
    }

    const problems = await prisma.problem.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
    });

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const fontPath = path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf");
    doc.font(fontPath);
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));

    const done = new Promise((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;

    const titleStatus = status && status !== "svi" ? statusLabel(status) : "Svi";

    doc.fontSize(20).text(`Izveštaj - ${titleStatus}`);
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor("#444").text(`Datum: ${dateStr}`);
    doc.fillColor("#000").moveDown(1);

    if (problems.length === 0) {
      doc.fontSize(12).text("Nema problema za izabrani filter.");
      doc.end();
      await done;

      const pdf = Buffer.concat(chunks);
      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="izvestaj_${status || "svi"}_${dateStr}.pdf"`,
        },
      });
    }

    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];

      doc.fontSize(14).text(`Problem ${i + 1}`, { underline: true });
      doc.moveDown(0.4);

      doc.fontSize(11);
      doc.text(`Naslov: ${safeText(p.title)}`);
      doc.text(`Opis: ${safeText(p.description)}`);
      doc.text(`Tip problema: ${safeText(p.problemType)}`);
      if (p.proposedSolution) doc.text(`Predlog rešenja: ${safeText(p.proposedSolution)}`);
      doc.text(`Prioritet: ${safeText(p.priority)}`);
      doc.text(`Status: ${statusLabel(p.status)}`);

      const imgBuf = await fetchImageBuffer(p.imageUrl);
      if (imgBuf) {
        doc.moveDown(0.5);
        doc.text("Slika:");
        doc.moveDown(0.2);
        try {
          doc.image(imgBuf, { fit: [500, 300], align: "center" });
        } catch {
          doc.text("(Ne mogu da ubacim sliku u PDF)");
        }
      }

      doc.moveDown(1);
      if (doc.y > 740 && i !== problems.length - 1) doc.addPage();
    }

    doc.end();
    await done;

    const pdf = Buffer.concat(chunks);
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="izvestaj_${status || "svi"}_${dateStr}.pdf"`,
      },
    });
  } catch (e) {
    console.error("GET /api/reports/problems error:", e);
    return json(500, {
      error: "Greška pri generisanju PDF-a.",
      ...(isDev ? { details: String(e?.message || e) } : {}),
    });
  }
}