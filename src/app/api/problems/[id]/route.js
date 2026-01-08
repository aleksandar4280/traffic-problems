// FILE: src/app/api/problems/[id]/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Morate biti ulogovani" }, { status: 401 });
    }

    const problem = await prisma.problem.findFirst({
      where: {
        id: params.id,
        user: { email: session.user.email },
      },
    });

    if (!problem) return NextResponse.json({ error: "Problem nije pronađen" }, { status: 404 });
    return NextResponse.json(problem);
  } catch (e) {
    console.error("GET /api/problems/[id] error:", e);
    return NextResponse.json({ error: "Došlo je do greške" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Morate biti ulogovani" }, { status: 401 });
    }

    const body = await request.json();

    const existing = await prisma.problem.findFirst({
      where: { id: params.id, user: { email: session.user.email } },
    });
    if (!existing) return NextResponse.json({ error: "Problem nije pronađen" }, { status: 404 });

    const updated = await prisma.problem.update({
      where: { id: params.id },
      data: {
        title: typeof body.title === "string" ? body.title.trim() : existing.title,
        description: typeof body.description === "string" ? body.description.trim() : existing.description,
        problemType: typeof body.problemType === "string" ? body.problemType.trim() : existing.problemType,
        proposedSolution:
          typeof body.proposedSolution === "string" ? body.proposedSolution.trim() : existing.proposedSolution,
        priority: body.priority ?? existing.priority,
        status: body.status ?? existing.status,
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : existing.imageUrl,
        latitude: Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : existing.latitude,
        longitude: Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : existing.longitude,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("PUT /api/problems/[id] error:", e);
    return NextResponse.json({ error: "Došlo je do greške" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Morate biti ulogovani" }, { status: 401 });
    }

    const existing = await prisma.problem.findFirst({
      where: { id: params.id, user: { email: session.user.email } },
    });
    if (!existing) return NextResponse.json({ error: "Problem nije pronađen" }, { status: 404 });

    await prisma.problem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/problems/[id] error:", e);
    return NextResponse.json({ error: "Došlo je do greške" }, { status: 500 });
  }
}