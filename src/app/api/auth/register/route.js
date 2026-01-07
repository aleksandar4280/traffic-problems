// API ruta za registraciju korisnika

import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    // Validacija
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email i lozinka su obavezni' },
        { status: 400 }
      );
    }

    // Proveri da li korisnik već postoji
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Korisnik sa ovim email-om već postoji' },
        { status: 400 }
      );
    }

    // Hash lozinke
    const hashedPassword = await hash(password, 12);

    // Kreiraj korisnika
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    return NextResponse.json(
      { 
        message: 'Korisnik uspešno kreiran',
        user: { id: user.id, email: user.email, name: user.name }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Greška pri registraciji:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške pri registraciji' },
      { status: 500 }
    );
  }
}