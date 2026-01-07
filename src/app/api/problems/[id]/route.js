// API ruta za pojedinačni problem (GET, PUT, DELETE)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Preuzmi jedan problem
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Morate biti ulogovani' },
        { status: 401 }
      );
    }

    const problem = await prisma.problem.findUnique({
      where: {
        id: params.id
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

    if (!problem) {
      return NextResponse.json(
        { error: 'Problem nije pronađen' },
        { status: 404 }
      );
    }

    return NextResponse.json(problem);

  } catch (error) {
    console.error('Greška pri preuzimanju problema:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške' },
      { status: 500 }
    );
  }
}

// PUT - Ažuriraj problem
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Morate biti ulogovani' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Pronađi korisnika
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    // Proveri da li problem postoji i da li pripada korisniku
    const existingProblem = await prisma.problem.findUnique({
      where: { id: params.id }
    });

    if (!existingProblem) {
      return NextResponse.json(
        { error: 'Problem nije pronađen' },
        { status: 404 }
      );
    }

    if (existingProblem.userId !== user.id) {
      return NextResponse.json(
        { error: 'Nemate dozvolu da ažurirate ovaj problem' },
        { status: 403 }
      );
    }

    // Ažuriraj problem
    const updatedProblem = await prisma.problem.update({
      where: {
        id: params.id
      },
      data: {
        title: data.title,
        description: data.description,
        problemType: data.problemType,
        proposedSolution: data.proposedSolution,
        priority: data.priority,
        status: data.status,
        imageUrl: data.imageUrl,
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

    return NextResponse.json(updatedProblem);

  } catch (error) {
    console.error('Greška pri ažuriranju problema:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške pri ažuriranju' },
      { status: 500 }
    );
  }
}

// DELETE - Obriši problem
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Morate biti ulogovani' },
        { status: 401 }
      );
    }

    // Pronađi korisnika
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    // Proveri da li problem postoji i da li pripada korisniku
    const existingProblem = await prisma.problem.findUnique({
      where: { id: params.id }
    });

    if (!existingProblem) {
      return NextResponse.json(
        { error: 'Problem nije pronađen' },
        { status: 404 }
      );
    }

    if (existingProblem.userId !== user.id) {
      return NextResponse.json(
        { error: 'Nemate dozvolu da obrišete ovaj problem' },
        { status: 403 }
      );
    }

    // Obriši problem
    await prisma.problem.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json(
      { message: 'Problem uspešno obrisan' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Greška pri brisanju problema:', error);
    return NextResponse.json(
      { error: 'Došlo je do greške pri brisanju' },
      { status: 500 }
    );
  }
}