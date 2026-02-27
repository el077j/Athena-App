'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { TrendingUp, BookOpen, Clock, Sparkles, ExternalLink, Activity, Target, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface Skill {
  id: string;
  name: string;
  score: number;
  maxScore: number;
}

interface DashboardData {
  user: { name: string; level: string };
  skills: Skill[];
  recentResources: { id: string; title: string; subject: string; type: string }[];
  stats: {
    totalResources: number;
    completedRevisions: number;
    totalRevisions: number;
    completionRate: number;
  };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const radarData = data?.skills.map((s) => ({
    subject: s.name,
    score: s.score,
    fullMark: 100,
  })) || [];

  const statCards = [
    { label: 'Complétion', value: `${data?.stats.completionRate || 0}%`, icon: TrendingUp, color: 'blue' },
    { label: 'Révisions', value: `${data?.stats.completedRevisions || 0}/${data?.stats.totalRevisions || 0}`, icon: Clock, color: 'cyan' },
    { label: 'Ressources', value: `${data?.stats.totalResources || 0}`, icon: BookOpen, color: 'purple' },
    { label: 'Matières', value: `${data?.skills.length || 0}`, icon: Target, color: 'white' },
  ];

  const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'neon-glow-blue' },
    cyan: { bg: 'bg-sky-500/10', text: 'text-sky-400', glow: 'neon-glow-cyan' },
    purple: { bg: 'bg-violet-500/10', text: 'text-violet-400', glow: 'neon-glow-purple' },
    white: { bg: 'bg-white/5', text: 'text-white/70', glow: 'neon-glow-white' },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-8 max-w-7xl relative">
      {/* Decorative orbs */}
      <div className="deco-orb deco-orb-blue" style={{ width: 500, height: 500, top: -100, right: -200 }} />
      <div className="deco-orb deco-orb-cyan" style={{ width: 300, height: 300, bottom: 100, left: -100 }} />
      <div className="deco-grid" />

      {/* Header */}
      <motion.div variants={item} className="space-y-1 relative z-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center neon-border-blue">
            <Zap className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Bonjour, <span className="text-blue-400 text-glow-blue">{user?.name}</span>
            </h1>
            <p className="text-slate-500 text-sm">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {statCards.map((stat) => {
          const c = colorMap[stat.color];
          return (
            <div key={stat.label} className="stat-card group relative overflow-hidden">
              {/* Decorative corner accent */}
              <div className={`absolute top-0 right-0 w-20 h-20 ${c.bg} rounded-bl-[40px] opacity-50`} />
              <div className="relative flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
                  <stat.icon className={`w-4.5 h-4.5 ${c.text}`} strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white relative">{stat.value}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Revision Progress Bar */}
      {data && data.stats.totalRevisions > 0 && (
        <motion.div variants={item} className="glass-card p-5 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
              <span className="text-sm font-medium text-slate-300">Progression des révisions</span>
            </div>
            <span className="text-sm font-semibold text-blue-400">{data.stats.completionRate}%</span>
          </div>
          <Progress value={data.stats.completionRate} className="h-2 bg-white/5" />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10">
        {/* Radar Chart — takes 3 cols */}
        <motion.div variants={item} className="lg:col-span-3 glass-card p-6 relative overflow-hidden">
          {/* Deco in card */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px]" />
          <div className="flex items-center gap-2.5 mb-5 relative">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center neon-border-blue">
              <Sparkles className="w-4.5 h-4.5 text-blue-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-base font-semibold text-white">Radar de compétences</h2>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-center">
              <Sparkles className="w-10 h-10 text-slate-700 mb-3" strokeWidth={1} />
              <p className="text-sm text-slate-500">Complète l&apos;onboarding pour voir tes compétences</p>
            </div>
          )}
        </motion.div>

        {/* Recent Resources — takes 2 cols */}
        <motion.div variants={item} className="lg:col-span-2 glass-card p-6 relative overflow-hidden">
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-violet-500/5 rounded-full blur-[50px]" />
          <div className="flex items-center gap-2.5 mb-5 relative">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center neon-border-purple">
              <BookOpen className="w-4.5 h-4.5 text-violet-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-base font-semibold text-white">Ressources récentes</h2>
          </div>
          {data?.recentResources && data.recentResources.length > 0 ? (
            <div className="space-y-2 relative">
              {data.recentResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-blue-500/15 hover:bg-white/[0.05] transition-all cursor-pointer group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">{resource.title}</p>
                    <p className="text-xs text-blue-400/50 mt-0.5">{resource.subject}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center text-center relative">
              <BookOpen className="w-10 h-10 text-slate-700 mb-3" strokeWidth={1} />
              <p className="text-sm text-slate-500">Aucune ressource ajoutée</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
