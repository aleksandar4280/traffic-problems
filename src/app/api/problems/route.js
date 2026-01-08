// FILE: src/app/api/problems/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Morate biti ulogovani" }, { status: 401 });
    }

    const problems = await prisma.problem.findMany({
      where: { user: { email: session.user.email } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(problems);
  } catch (e) {
    console.error("GET /api/problems error:", e);
    return NextResponse.json({ error: "Došlo je do greške" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Morate biti ulogovani" }, { status: 401 });
    }

    const body = await request.json();

    const title = (body.title ?? "").trim();
    const problemType = (body.problemType ?? "").trim();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!title) return badRequest("Naslov je obavezan");
    if (!problemType) return badRequest("Tip problema je obavezan");
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return badRequest("Lokacija (latitude/longitude) nije validna");
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "Korisnik nije pronađen" }, { status: 404 });

    const created = await prisma.problem.create({
      data: {
        title,
        description: body.description?.trim() || null,
        problemType,
        latitude,
        longitude,
        proposedSolution: body.proposedSolution?.trim() || null,
        priority: body.priority || "srednji",
        status: body.status || "primeceno",
        imageUrl: body.imageUrl?.trim() || null,
        userId: user.id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("POST /api/problems error:", e);
    return NextResponse.json({ error: "Došlo je do greške pri kreiranju problema" }, { status: 500 });
  }
}