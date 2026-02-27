import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH: toggle revision slot completion
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await req.json();
    const slot = await prisma.revisionSlot.findFirst({
      where: { id, userId: session.userId },
    });

    if (!slot) {
      return NextResponse.json({ error: 'Créneau non trouvé' }, { status: 404 });
    }

    const updated = await prisma.revisionSlot.update({
      where: { id },
      data: { completed: !slot.completed },
    });

    return NextResponse.json({ slot: updated });
  } catch (error) {
    console.error('Revision toggle error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
