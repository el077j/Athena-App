import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateDiagnosticQuestions } from '@/lib/groq';

// POST: complete onboarding
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { level, objectives, diagnosticResults } = await req.json();

    // Update user profile
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        level,
        objectives,
        onboardingComplete: true,
      },
    });

    // Save diagnostic results & create skills
    if (diagnosticResults && Array.isArray(diagnosticResults)) {
      for (const result of diagnosticResults) {
        await prisma.diagnosticResult.create({
          data: {
            subject: result.subject,
            score: result.score,
            total: result.total,
            weakAreas: result.weakAreas || [],
            userId: session.userId,
          },
        });

        await prisma.skill.upsert({
          where: {
            userId_name: { userId: session.userId, name: result.subject },
          },
          create: {
            name: result.subject,
            score: Math.round((result.score / result.total) * 100),
            userId: session.userId,
          },
          update: {
            score: Math.round((result.score / result.total) * 100),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET: generate diagnostic questions for a subject
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const subject = req.nextUrl.searchParams.get('subject');
    if (!subject) {
      return NextResponse.json({ error: 'Matière requise' }, { status: 400 });
    }

    const questions = await generateDiagnosticQuestions(subject);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
