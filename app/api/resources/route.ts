import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sanitizeInput, sanitizeUrl } from '@/lib/security';

// GET: list resources
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const subject = req.nextUrl.searchParams.get('subject');
    const where: { userId: string; subject?: string } = { userId: session.userId };
    if (subject) where.subject = subject;

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ resources }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Resources GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: create resource
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const title = sanitizeInput(body.title || '');
    const type = body.type;
    const subject = sanitizeInput(body.subject || '');
    const tags = Array.isArray(body.tags) ? body.tags.map((t: string) => sanitizeInput(t)) : [];
    let content = body.content || '';

    if (!title || !['url', 'pdf', 'note'].includes(type) || !content || !subject) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    if (title.length > 200 || subject.length > 100 || content.length > 10000) {
      return NextResponse.json({ error: 'Contenu trop long' }, { status: 400 });
    }

    // Sanitize URL type content
    if (type === 'url' || type === 'pdf') {
      content = sanitizeUrl(content);
      if (!content) {
        return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
      }
    } else {
      content = sanitizeInput(content);
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        type,
        content,
        subject,
        tags,
        userId: session.userId,
      },
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error('Resources POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE: delete resource
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await req.json();
    await prisma.resource.delete({ where: { id, userId: session.userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resources DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
