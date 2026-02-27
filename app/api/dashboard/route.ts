import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        objectives: true,
        onboardingComplete: true,
      },
    });

    const skills = await prisma.skill.findMany({
      where: { userId: session.userId },
      orderBy: { name: 'asc' },
    });

    const recentResources = await prisma.resource.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const revisionSlots = await prisma.revisionSlot.findMany({
      where: { userId: session.userId },
    });

    const completedSlots = revisionSlots.filter((s: { completed: boolean }) => s.completed).length;
    const totalSlots = revisionSlots.length;

    const payload = {
      user,
      skills,
      recentResources,
      stats: {
        totalResources: await prisma.resource.count({ where: { userId: session.userId } }),
        completedRevisions: completedSlots,
        totalRevisions: totalSlots,
        completionRate: totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0,
      },
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
