'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace(user.onboardingComplete ? '/dashboard' : '/onboarding');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen app-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center neon-glow-blue border border-blue-500/30">
          <Sparkles className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold text-white">
          Athena <span className="text-blue-400 text-glow-blue">Flow</span>
        </h1>
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-sm">Chargement...</span>
        </div>
      </motion.div>
    </div>
  );
}
