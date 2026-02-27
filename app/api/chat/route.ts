import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { chatWithAI } from '@/lib/groq';
import { checkRateLimit } from '@/lib/security';

// GET: chat history
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.log('[Chat GET] Loading history for userId:', session.userId);

    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    console.log('[Chat GET] Returning', messages.length, 'messages');

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('[Chat GET] ❌ Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: send message
export async function POST(req: NextRequest) {
  console.log('[Chat POST] Request received');
  try {
    const session = await getSession();
    if (!session) {
      console.warn('[Chat POST] Unauthenticated request');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.log('[Chat POST] Session OK — userId:', session.userId);

    if (!checkRateLimit(`chat:${session.userId}`, 20, 60000)) {
      console.warn('[Chat POST] Rate limit exceeded for userId:', session.userId);
      return NextResponse.json({ error: 'Trop de messages. Patientez un moment.' }, { status: 429 });
    }

    const body = await req.json();
    // NOTE: intentionally use the raw body message (not sanitizeInput which encodes slashes)
    const message = (body.message || '').trim();
    if (!message || message.length > 2000) {
      return NextResponse.json({ error: 'Message invalide (max 2000 caractères)' }, { status: 400 });
    }
    console.log('[Chat POST] Message length:', message.length);

    // Save user message
    const userMsg = await prisma.chatMessage.create({
      data: { role: 'user', content: message, userId: session.userId },
    });
    console.log('[Chat POST] User message saved — id:', userMsg.id);

    // Get recent chat history (EXCLUDING the just-saved message to avoid duplicates)
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: session.userId, id: { not: userMsg.id } },
      orderBy: { createdAt: 'desc' },
      take: 9, // last 9 = ~5 exchanges
    });
    console.log('[Chat POST] History messages loaded:', recentMessages.length);

    // Build context: history (oldest first) + current user message
    const historyMessages = recentMessages.reverse().map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Optional: prepend resource + schedule context at the start of fresh conversations
    const resources = await prisma.resource.findMany({
      where: { userId: session.userId },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch schedule blocks to give the AI live awareness of the user's timetable
    const scheduleBlocks = await prisma.scheduleBlock.findMany({
      where: { userId: session.userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      take: 30,
    });

    const contextMessages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];

    // Always inject schedule + resource context so the AI can analyse the timetable
    if (resources.length > 0 || scheduleBlocks.length > 0) {
      const parts: string[] = [];

      if (scheduleBlocks.length > 0) {
        const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        const scheduleLines = scheduleBlocks
          .map((b: { dayOfWeek: number; startTime: string; endTime: string; title: string }) => `  • ${DAYS[b.dayOfWeek] ?? `Jour ${b.dayOfWeek}`} ${b.startTime}–${b.endTime} : ${b.title}`)
          .join('\n');
        parts.push(`Emploi du temps :\n${scheduleLines}`);
      }

      if (resources.length > 0) {
        const resourceLines = resources
          .map((r: { subject: string; title: string; content: string }) => `  • [${r.subject}] ${r.title}: ${r.content.substring(0, 150)}`)
          .join('\n');
        parts.push(`Ressources récentes :\n${resourceLines}`);
      }

      contextMessages.push({
        role: 'system',
        content: `Contexte de l'étudiant (données live Supabase) :\n\n${parts.join('\n\n')}`,
      });
      console.log('[Chat POST] System context injected — schedule:', scheduleBlocks.length, '| resources:', resources.length);
    } else {
      console.log('[Chat POST] No schedule blocks or resources found for this user');
    }

    // Append history then current message
    contextMessages.push(...historyMessages);
    contextMessages.push({ role: 'user', content: message });

    console.log('[Chat POST] Sending to Groq — total messages:', contextMessages.length);

        // erreur is here

    const aiResponse = await chatWithAI(contextMessages);
     console.log('[Chat POST] ai response:', aiResponse);
    console.log('[Chat POST] Groq response received, length:', aiResponse.length);

    // Save AI response
    const aiMsg = await prisma.chatMessage.create({
      data: { role: 'assistant', content: aiResponse, userId: session.userId },
    });

    return NextResponse.json({ userMessage: userMsg, aiMessage: aiMsg });
  } catch (error) {
    console.error('[Chat POST] ❌ Error:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE: clear chat history
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    console.log('[Chat DELETE] Clearing history for userId:', session.userId);

    await prisma.chatMessage.deleteMany({ where: { userId: session.userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Chat DELETE] ❌ Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
