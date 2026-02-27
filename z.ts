import * as fs from 'fs';
import * as path from 'path';

// Bypass dotenv auto-injection — read .env file directly
const envContent = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf-8');
const match = envContent.match(/^GROQ_API_KEY=(.+)$/m);
const groqKey = match?.[1]?.trim();

console.log('=== Test Groq ===');
console.log('Key from .env file:', groqKey?.slice(0, 8) + '...');
console.log('Key from process.env:', process.env.GROQ_API_KEY?.slice(0, 8) + '...');
console.log('Are they the same?', groqKey === process.env.GROQ_API_KEY);

if (!groqKey) {
  console.error('STOP: No GROQ_API_KEY found in .env');
  process.exit(1);
}

// Force the real value
process.env.GROQ_API_KEY = groqKey;

import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY.trim() });

async function test() {
  console.log('Sending request to Groq...');
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Dis juste OK.' }],
    max_tokens: 5,
  });
  console.log('Response:', res.choices[0]?.message?.content);
}

test().catch((e) => {
  console.error('Error:', e.status ?? '', e.message);
});