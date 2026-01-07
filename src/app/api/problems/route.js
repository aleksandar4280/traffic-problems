// API ruta za sve probleme (GET sve probleme, POST novi problem)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Preuzmi sve probleme
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Morate biti ulogovani' },
        { status: 401 }
      );
    }

    const problems = await prisma.problem.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(problems);

  } catch (error) {
    console.error('Greška pri preuzimanju problema:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške' },
      { status: 500 }
    );
  }
}

// POST - Kreiraj novi problem
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Morate biti ulogovani' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validacija obaveznih polja
    if (!data.title || !data.problemType || !data.latitude || !data.longitude) {
      return NextResponse.json(
        { error: 'Naslov, tip problema i lokacija su obavezni' },
        { status: 400 }
      );
    }

    // Pronađi korisnika
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    // Kreiraj problem
    const problem = await prisma.problem.create({
      data: {
        title: data.title,
        description: data.description || null,
        problemType: data.problemType,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        proposedSolution: data.proposedSolution || null,
        priority: data.priority || 'srednji',
        status: 'prijavljeno',
        imageUrl: data.imageUrl || null,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(problem, { status: 201 });

  } catch (error) {
    console.error('Greška pri kreiranju problema:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške pri kreiranju problema' },
      { status: 500 }
    );
  }
}