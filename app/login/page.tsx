'use client';

// Static shell — revalidate every hour (ISR)
export const revalidate = 3600;

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const { login, register, user, fetchUser, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(user.onboardingComplete ? '/dashboard' : '/onboarding');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const u = await login(loginData.email, loginData.password);
      router.replace(u.onboardingComplete ? '/dashboard' : '/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(registerData.name, registerData.email, registerData.password);
      router.replace('/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    } finally { setLoading(false); }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen app-background flex relative overflow-hidden">
      {/* Global decorative grid */}
      <div className="deco-grid" />
      {/* Left - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] via-transparent to-cyan-500/[0.04]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/[0.08] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute top-[10%] right-[15%] w-64 h-64 bg-blue-400/[0.05] rounded-full blur-[80px] animate-pulse" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center px-12">
          <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-8 neon-glow-blue border border-blue-500/25">
            <Sparkles className="w-10 h-10 text-blue-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Athena <span className="text-blue-400 text-glow-blue">Flow</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
            Optimise ta vie étudiante avec l&apos;intelligence artificielle. Planifie, révise et excelle.
          </p>
        </motion.div>
      </div>

      {/* Right - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          <div className="glass-panel rounded-2xl p-8">
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Sparkles className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
              </div>
              <span className="font-bold text-xl text-blue-300">Athena Flow</span>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="w-full mb-6 bg-white/5 border border-white/[0.08] rounded-xl p-1">
                <TabsTrigger value="login" className="flex-1 rounded-lg data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-300 text-slate-500 transition-all">
                  Connexion
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1 rounded-lg data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-300 text-slate-500 transition-all">
                  Inscription
                </TabsTrigger>
              </TabsList>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
              )}

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="my-4">
                    <Label className="text-slate-500 text-xs mb-1.5 block">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input type="email" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} className="glass-input w-full pl-10 pr-4 py-2.5 text-sm" placeholder="ton@email.com" required />
                    </div>
                  </div>
                  <div className="my-4">
                    <Label className="text-slate-500 text-xs mb-1.5 block">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input type={showPassword ? 'text' : 'password'} value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} className="glass-input w-full pl-10 pr-10 py-2.5 text-sm" placeholder="••••••••" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 rounded-xl transition-all neon-glow-blue">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Se connecter
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label className="text-slate-500 text-xs mb-1.5 block">Nom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input type="text" value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} className="glass-input w-full pl-10 pr-4 py-2.5 text-sm" placeholder="Ton nom" required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-xs mb-1.5 block">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input type="email" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} className="glass-input w-full pl-10 pr-4 py-2.5 text-sm" placeholder="ton@email.com" required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-xs mb-1.5 block">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input type={showPassword ? 'text' : 'password'} value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} className="glass-input w-full pl-10 pr-10 py-2.5 text-sm" placeholder="Min. 6 caractères" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 rounded-xl transition-all neon-glow-blue">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Créer mon compte
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
