import Groq from 'groq-sdk';

let _groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!_groq) {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set. Add it to .env and restart.');
    }
    _groq = new Groq({ apiKey });
  }
  return _groq;
}

export async function chatWithAI(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
) {
  const groq = getGroqClient();

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            `Tu es Athena, une assistante IA spécialisée dans l'aide aux étudiants. ` +
            `Tu aides avec l'organisation, les révisions, la compréhension de cours et la méthodologie de travail. ` +
            `Tu réponds toujours en français, de manière concise et encourageante. ` +
            `Tu utilises des techniques pédagogiques comme le rappel actif, la répétition espacée et la méthode Pomodoro.`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || "Désolée, je n'ai pas pu générer de réponse.";
  } catch (err: unknown) {
    console.error('[Groq] chatWithAI error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Groq API error: ${msg}`);
  }
}

export async function generateRevisionSlots(
  schedule: { title: string; dayOfWeek: number; startTime: string; endTime: string }[],
  subjects: string[]
) {
  const groq = getGroqClient();

  const prompt = `Analyse cet emploi du temps et génère des créneaux de révision optimisés.

Emploi du temps actuel:
${schedule.map((s) => `- ${s.title}: Jour ${s.dayOfWeek}, ${s.startTime}-${s.endTime}`).join('\n')}

Matières à réviser: ${subjects.join(', ')}

Génère des créneaux de révision en JSON avec ce format:
[{"subject": "...", "method": "pomodoro|active-recall|spaced-repetition", "dayOfWeek": 0-6, "startTime": "HH:MM", "endTime": "HH:MM"}]

Règles:
- Ne pas chevaucher les cours existants
- Sessions de 25-50 min avec pauses
- Varier les méthodes
- Répartir équitablement les matières
- Préférer le matin pour les matières difficiles

Réponds UNIQUEMENT avec le JSON, sans texte autour.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const text = completion.choices[0]?.message?.content || '[]';
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch (err: unknown) {
    console.error('[Groq] generateRevisionSlots error:', err);
    return [];
  }
}

export async function generateDiagnosticQuestions(subject: string) {
  const groq = getGroqClient();

  const prompt = `Génère 5 questions QCM de diagnostic pour évaluer le niveau d'un étudiant en "${subject}".

Format JSON:
[{
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "..."
}]

Les questions doivent couvrir différents niveaux de difficulté.
Réponds UNIQUEMENT avec le JSON.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2048,
    });

    const text = completion.choices[0]?.message?.content || '[]';
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch (err: unknown) {
    console.error('[Groq] generateDiagnosticQuestions error:', err);
    return [];
  }
}
