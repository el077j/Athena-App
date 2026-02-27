import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateRevisionSlots } from '@/lib/groq';

// GET: get schedule blocks + revision slots
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const scheduleBlocks = await prisma.scheduleBlock.findMany({
      where: { userId: session.userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    const revisionSlots = await prisma.revisionSlot.findMany({
      where: { userId: session.userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ scheduleBlocks, revisionSlots }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Schedule error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: add schedule block or generate revision slots
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === 'generate') {
      // Generate AI revision slots
      const scheduleBlocks = await prisma.scheduleBlock.findMany({
        where: { userId: session.userId },
      });

      const skills = await prisma.skill.findMany({
        where: { userId: session.userId },
      });

      const subjects = skills.map((s) => s.name);
      if (subjects.length === 0) {
        return NextResponse.json({ error: 'Aucune matière trouvée. Complétez l\'onboarding.' }, { status: 400 });
      }

      const slots = await generateRevisionSlots(scheduleBlocks, subjects);

      // Delete old AI slots and create new ones
      await prisma.revisionSlot.deleteMany({ where: { userId: session.userId } });

      const created = await Promise.all(
        slots.map((slot: { subject: string; method: string; dayOfWeek: number; startTime: string; endTime: string }) =>
          prisma.revisionSlot.create({
            data: {
              subject: slot.subject,
              method: slot.method,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              userId: session.userId,
            },
          })
        )
      );

      return NextResponse.json({ revisionSlots: created });
    }

    // Add a schedule block
    const block = await prisma.scheduleBlock.create({
      data: {
        title: body.title,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime,
        endTime: body.endTime,
        type: body.type || 'course',
        color: body.color,
        userId: session.userId,
      },
    });

    return NextResponse.json({ block });
  } catch (error) {
    console.error('Schedule POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE: delete a schedule block
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await req.json();
    await prisma.scheduleBlock.delete({ where: { id, userId: session.userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Schedule DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
