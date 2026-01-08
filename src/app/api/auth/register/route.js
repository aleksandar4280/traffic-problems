// FILE: src/app/api/auth/register/route.js
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function json(status, body) {
  return NextResponse.json(body, { status });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return json(400, { error: "Neispravan JSON body." });

    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const name = body.name ? String(body.name).trim() : null;

    if (!email || !password) {
      return json(400, { error: "Email i lozinka su obavezni." });
    }
    if (!email.includes("@")) {
      return json(400, { error: "Email nije validan." });
    }
    if (password.length < 6) {
      return json(400, { error: "Lozinka mora imati najmanje 6 karaktera." });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return json(400, { error: "Korisnik sa ovim email-om već postoji." });
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: { id: true, email: true, name: true },
    });

    return json(201, { message: "Korisnik uspešno kreiran", user });
  } catch (error) {
    console.error("Greška pri registraciji:", error);
    const isDev = process.env.NODE_ENV !== "production";

    return json(500, {
      error: "Došlo je do greške pri registraciji.",
      ...(isDev ? { details: String(error?.message || error) } : {}),
    });
  }
}