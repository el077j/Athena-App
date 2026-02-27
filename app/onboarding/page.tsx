'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GraduationCap, Target, Brain, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const levels = ['Lycée', 'Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat', 'Autre'];
const subjectSuggestions = ['Mathématiques', 'Physique', 'Chimie', 'Informatique', 'Biologie', 'Histoire', 'Philosophie', 'Économie', 'Droit', 'Langues', 'Littérature', 'Sciences Politiques'];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (user?.onboardingComplete) router.replace('/dashboard');
  }, [user, router]);

  const toggleSubject = (subject: string) => {
    setSubjects((prev) => prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]);
  };

  const toggleObjective = (obj: string) => {
    setObjectives((prev) => prev.includes(obj) ? prev.filter((o) => o !== obj) : [...prev, obj]);
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const diagnosticResults = subjects.map((subject) => ({ subject, score: 0, total: 5, weakAreas: [] }));
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, objectives, diagnosticResults }),
      });
      if (res.ok) {
        await fetchUser();
        router.replace('/dashboard');
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const objectiveOptions = [
    'Améliorer mes notes',
    'Mieux organiser mon temps',
    'Préparer mes examens',
    'Développer de nouvelles compétences',
    'Réduire mon stress',
    'Trouver des méthodes de travail efficaces',
  ];

  const steps = [
    { title: 'Bienvenue sur Athena Flow', subtitle: 'Commençons par faire connaissance', icon: Sparkles },
    { title: 'Ton niveau d\'études', subtitle: 'Quel est ton niveau actuel ?', icon: GraduationCap },
    { title: 'Tes objectifs', subtitle: 'Que souhaites-tu accomplir ?', icon: Target },
    { title: 'Tes matières', subtitle: 'Quelles matières étudies-tu ?', icon: Brain },
  ];

  return (
    <div className="min-h-screen app-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="deco-orb deco-orb-blue" style={{ width: 500, height: 500, top: -150, right: -200 }} />
      <div className="deco-orb deco-orb-cyan" style={{ width: 300, height: 300, bottom: -50, left: -100 }} />
      <div className="deco-grid" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg relative z-10">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-400' : 'bg-white/[0.06]'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                {(() => {
                  const Icon = steps[step].icon;
                  return <Icon className="w-6 h-6 text-blue-400" strokeWidth={1.5} />;
                })()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{steps[step].title}</h2>
                <p className="text-sm text-slate-500">{steps[step].subtitle}</p>
              </div>
            </div>

            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-slate-400 leading-relaxed text-sm">
                  Athena Flow va t&apos;aider à optimiser ta vie étudiante grâce à l&apos;IA.
                  En quelques étapes, nous allons personnaliser ton expérience.
                </p>
                <div className="grid grid-cols-1 gap-2.5 mt-6">
                  {['📊 Dashboard de progression', '📅 Planificateur intelligent', '📚 Hub de ressources', '🤖 Assistant IA'].map((feature) => (
                    <div key={feature} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <span className="text-lg">{feature.split(' ')[0]}</span>
                      <span className="text-sm text-slate-400">{feature.split(' ').slice(1).join(' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Level */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-2.5">
                {levels.map((l) => (
                  <button key={l} onClick={() => setLevel(l)} className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    level === l ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}>{l}</button>
                ))}
              </div>
            )}

            {/* Step 2: Objectives */}
            {step === 2 && (
              <div className="space-y-2.5">
                {objectiveOptions.map((obj) => (
                  <button key={obj} onClick={() => toggleObjective(obj)} className={`w-full p-3 rounded-xl text-sm text-left transition-all flex items-center gap-3 ${
                    objectives.includes(obj) ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}>
                    {objectives.includes(obj) && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                    {obj}
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Subjects */}
            {step === 3 && (
              <div className="flex flex-wrap gap-2">
                {subjectSuggestions.map((subject) => (
                  <button key={subject} onClick={() => toggleSubject(subject)} className={`px-4 py-2 rounded-full text-sm transition-all ${
                    subjects.includes(subject) ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}>{subject}</button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0} className="text-slate-500 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>

          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !level} className="bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 rounded-xl">
              Suivant <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={completeOnboarding} disabled={loading || subjects.length === 0} className="bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 rounded-xl neon-glow-blue">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Commencer
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
