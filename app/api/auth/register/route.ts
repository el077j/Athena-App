import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { sanitizeInput, isValidEmail, isValidPassword, isValidName, checkRateLimit } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`register:${ip}`, 5, 60000)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez plus tard.' }, { status: 429 });
    }

    const body = await req.json();
    const name = sanitizeInput(body.name || '');
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!isValidName(name) || !isValidEmail(email) || !isValidPassword(password)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, onboardingComplete: true },
    });

    const token = await signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({ user, token });
    response.cookies.set('athena-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
