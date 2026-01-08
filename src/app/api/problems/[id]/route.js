// FILE: src/app/api/problems/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

const isDev = process.env.NODE_ENV !== "production";

function json(status, body) {
  return NextResponse.json(body, { status });
}

async function getEmail() {
  const session = await auth();
  return session?.user?.email ? String(session.user.email).toLowerCase() : null;
}

async function getId(ctx) {
  // Next.js 16: params je Promise. :contentReference[oaicite:1]{index=1}
  const p = await ctx?.params;
  return p?.id ? String(p.id) : null;
}

export async function GET(_req, ctx) {
  try {
    const id = await getId(ctx);
    if (!id) return json(400, { error: "Nedostaje id u ruti." });

    const email = await getEmail();
    if (!email) return json(401, { error: "Morate biti ulogovani" });

    const problem = await prisma.problem.findFirst({
      where: { id, user: { email } },
    });

    if (!problem) return json(404, { error: "Problem nije pronađen" });
    return json(200, problem);
  } catch (e) {
    console.error("GET /api/problems/[id] error:", e);
    return json(500, {
      error: "Došlo je do greške",
      ...(isDev ? { details: String(e?.message || e) } : {}),
    });
  }
}

export async function PUT(req, ctx) {
  try {
    const id = await getId(ctx);
    if (!id) return json(400, { error: "Nedostaje id u ruti." });

    const email = await getEmail();
    if (!email) return json(401, { error: "Morate biti ulogovani" });

    const existing = await prisma.problem.findFirst({
      where: { id, user: { email } },
    });
    if (!existing) return json(404, { error: "Problem nije pronađen" });

    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: "Neispravan JSON body" });

    const title = typeof body.title === "string" ? body.title.trim() : existing.title;
    const problemType =
      typeof body.problemType === "string" ? body.problemType.trim() : existing.problemType;

    if (!title) return json(400, { error: "Naslov je obavezan" });
    if (!problemType) return json(400, { error: "Tip problema je obavezan" });

    const updated = await prisma.problem.update({
      where: { id },
      data: {
        title,
        description:
          typeof body.description === "string" ? (body.description.trim() || null) : existing.description,
        problemType,
        proposedSolution:
          typeof body.proposedSolution === "string"
            ? (body.proposedSolution.trim() || null)
            : existing.proposedSolution,
        priority: body.priority ?? existing.priority,
        status: body.status ?? existing.status,
        imageUrl:
          typeof body.imageUrl === "string" ? (body.imageUrl.trim() || null) : existing.imageUrl,
        latitude: body.latitude !== undefined ? Number(body.latitude) : existing.latitude,
        longitude: body.longitude !== undefined ? Number(body.longitude) : existing.longitude,
      },
    });

    return json(200, updated);
  } catch (e) {
    console.error("PUT /api/problems/[id] error:", e);
    return json(500, {
      error: "Došlo je do greške pri izmeni",
      ...(isDev ? { details: String(e?.message || e) } : {}),
    });
  }
}

export async function DELETE(_req, ctx) {
  try {
    const id = await getId(ctx);
    if (!id) return json(400, { error: "Nedostaje id u ruti." });

    const email = await getEmail();
    if (!email) return json(401, { error: "Morate biti ulogovani" });

    const existing = await prisma.problem.findFirst({
      where: { id, user: { email } },
    });
    if (!existing) return json(404, { error: "Problem nije pronađen" });

    await prisma.problem.delete({ where: { id } });
    return json(200, { ok: true });
  } catch (e) {
    console.error("DELETE /api/problems/[id] error:", e);
    return json(500, {
      error: "Došlo je do greške pri brisanju",
      ...(isDev ? { details: String(e?.message || e) } : {}),
    });
  }
}
