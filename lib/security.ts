/**
 * Security utilities for Athena Flow
 * - XSS sanitization
 * - CSRF token generation/validation
 * - Input validation helpers
 */

// ─── XSS SANITIZATION ──────────────────────────────────────────
const DANGEROUS_TAGS = /<\s*\/?\s*(script|iframe|object|embed|form|input|link|meta|style|base|svg|math|details|marquee)[^>]*>/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URI = /javascript\s*:/gi;
const DATA_URI = /data\s*:\s*text\/html/gi;
const EXPRESSION_CSS = /expression\s*\(/gi;

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(DANGEROUS_TAGS, '')
    .replace(EVENT_HANDLERS, '')
    .replace(JAVASCRIPT_URI, '')
    .replace(DATA_URI, '')
    .replace(EXPRESSION_CSS, '')
    .trim();
}

export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Only allow http, https, and mailto protocols
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) {
    return trimmed.replace(JAVASCRIPT_URI, '').replace(DATA_URI, '');
  }
  return '';
}

// ─── CSRF PROTECTION ──────────────────────────────────────────
import { randomBytes, createHmac } from 'crypto';

const CSRF_SECRET = process.env.JWT_SECRET || 'athena-csrf-secret';

export function generateCsrfToken(sessionId: string): string {
  const nonce = randomBytes(16).toString('hex');
  const hmac = createHmac('sha256', CSRF_SECRET)
    .update(`${sessionId}:${nonce}`)
    .digest('hex');
  return `${nonce}:${hmac}`;
}

export function validateCsrfToken(token: string, sessionId: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  const [nonce, providedHmac] = parts;
  const expectedHmac = createHmac('sha256', CSRF_SECRET)
    .update(`${sessionId}:${nonce}`)
    .digest('hex');
  // Timing-safe comparison
  if (expectedHmac.length !== providedHmac.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expectedHmac.length; i++) {
    mismatch |= expectedHmac.charCodeAt(i) ^ providedHmac.charCodeAt(i);
  }
  return mismatch === 0;
}

// ─── INPUT VALIDATION ──────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 6 && password.length <= 128;
}

export function isValidName(name: string): boolean {
  return typeof name === 'string' && name.trim().length >= 1 && name.length <= 100;
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else {
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }
  return sanitized;
}

// ─── RATE LIMITING (simple in-memory) ───────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}
