'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Sparkles, Loader2, X, CheckCircle2, Circle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

interface ScheduleBlock {
  id: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: string;
  color?: string;
}

interface RevisionSlot {
  id: string;
  subject: string;
  method: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  completed: boolean;
}

const methodLabels: Record<string, string> = {
  'pomodoro': '🍅 Pomodoro',
  'active-recall': '🧠 Active Recall',
  'spaced-repetition': '🔄 Espacée',
};

export default function SchedulerPage() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [revisions, setRevisions] = useState<RevisionSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [newBlock, setNewBlock] = useState({
    title: '', dayOfWeek: 0, startTime: '08:00', endTime: '10:00', type: 'course',
  });

  // Compute current week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const todayStr = new Date().toDateString();
  const monthYear = weekDates[0].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  useEffect(() => { fetchSchedule(); }, []);

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/schedule');
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.scheduleBlocks || []);
        setRevisions(data.revisionSlots || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addBlock = async () => {
    if (!newBlock.title) return;
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlock),
      });
      if (res.ok) {
        const data = await res.json();
        setBlocks((p) => [...p, data.block]);
        setShowAdd(false);
        setNewBlock({ title: '', dayOfWeek: 0, startTime: '08:00', endTime: '10:00', type: 'course' });
      }
    } catch (err) { console.error(err); }
  };

  const deleteBlock = async (id: string) => {
    try {
      await fetch('/api/schedule', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      setBlocks((p) => p.filter((b) => b.id !== id));
    } catch (err) { console.error(err); }
  };

  const generateRevisions = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      });
      if (res.ok) {
        const data = await res.json();
        setRevisions(data.revisionSlots || []);
      }
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  };

  const toggleRevision = async (id: string) => {
    try {
      const res = await fetch('/api/schedule/revision', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        setRevisions((p) => p.map((r) => (r.id === id ? data.slot : r)));
      }
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-72" />
        <div className="skeleton h-[600px] rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative space-y-6 pb-8 max-w-7xl">
      {/* Decorative orbs */}
      <div className="deco-orb deco-orb-blue" style={{ width: 400, height: 400, top: -120, right: -150 }} />
      <div className="deco-orb deco-orb-cyan" style={{ width: 250, height: 250, bottom: 200, left: -80 }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white tracking-tight capitalize">{monthYear}</h1>
            <div className="flex gap-1">
              <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setWeekOffset(0)} className="px-2.5 py-1 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors">
                Aujourd&apos;hui
              </button>
              <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-500">Emploi du temps optimisé par l&apos;IA</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAdd(true)} className="bg-white/5 hover:bg-white/8 text-slate-300 border border-white/[0.08] rounded-xl text-sm h-9">
            <Plus className="w-4 h-4 mr-1.5" /> Cours
          </Button>
          <Button onClick={generateRevisions} disabled={generating} className="bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 rounded-xl text-sm h-9 neon-glow-blue">
            {generating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
            Révisions IA
          </Button>
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Nouveau créneau</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs text-slate-500 mb-1 block">Titre</label>
                <input value={newBlock.title} onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })} className="glass-input w-full px-3 py-2 text-sm" placeholder="Maths" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Jour</label>
                <select value={newBlock.dayOfWeek} onChange={(e) => setNewBlock({ ...newBlock, dayOfWeek: parseInt(e.target.value) })} className="glass-input w-full px-3 py-2 text-sm bg-transparent">
                  {DAYS_SHORT.map((d, i) => <option key={i} value={i} className="bg-[#0d1321]">{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Début</label>
                <input type="time" value={newBlock.startTime} onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })} className="glass-input w-full px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Fin</label>
                <input type="time" value={newBlock.endTime} onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })} className="glass-input w-full px-3 py-2 text-sm" />
              </div>
            </div>
            <Button onClick={addBlock} disabled={!newBlock.title} className="mt-3 bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 rounded-xl text-sm h-8">
              Ajouter
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Grid */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day Headers */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.04]">
              <div className="p-3 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
              </div>
              {weekDates.map((date, i) => {
                const isToday = date.toDateString() === todayStr;
                return (
                  <div key={i} className={`p-3 text-center border-l border-white/[0.04] ${isToday ? 'bg-blue-500/[0.06]' : ''}`}>
                    <p className="text-[11px] font-medium text-slate-500 uppercase">{DAYS_SHORT[i]}</p>
                    <p className={`text-lg font-bold mt-0.5 ${isToday ? 'text-blue-400 bg-blue-500/15 w-9 h-9 rounded-xl flex items-center justify-center mx-auto' : 'text-slate-300'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-white/[0.03] last:border-b-0">
                <div className="p-2 text-[11px] text-slate-600 font-medium text-right pr-3 py-3">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {DAYS_SHORT.map((_, di) => {
                  const isToday = weekDates[di].toDateString() === todayStr;
                  const dayBlocks = blocks.filter((b) => b.dayOfWeek === di);
                  const dayRevisions = revisions.filter((r) => r.dayOfWeek === di);

                  const blockHere = dayBlocks.find((b) => {
                    const s = parseInt(b.startTime.split(':')[0]);
                    return hour === s;
                  });
                  const revHere = dayRevisions.find((r) => {
                    const s = parseInt(r.startTime.split(':')[0]);
                    return hour === s;
                  });

                  return (
                    <div
                      key={`${hour}-${di}`}
                      className={`schedule-cell p-1 border-l border-white/[0.04] relative group ${isToday ? 'bg-blue-500/[0.02]' : ''}`}
                    >
                      {blockHere && (
                        <div className="schedule-block course">
                          <p className="font-medium truncate">{blockHere.title}</p>
                          <p className="text-[10px] opacity-60">{blockHere.startTime} – {blockHere.endTime}</p>
                          <button onClick={() => deleteBlock(blockHere.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 transition-all">
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      )}
                      {revHere && (
                        <button onClick={() => toggleRevision(revHere.id)} className={`schedule-block w-full text-left ${revHere.completed ? 'completed' : 'revision'}`}>
                          <div className="flex items-center gap-1">
                            {revHere.completed ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> : <Circle className="w-3 h-3 flex-shrink-0" />}
                            <span className="truncate">{revHere.subject}</span>
                          </div>
                          <p className="text-[10px] opacity-60 mt-0.5">{methodLabels[revHere.method] || revHere.method}</p>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-l-2 border-l-blue-400 bg-blue-500/10" />
          Cours
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-l-2 border-l-violet-400 bg-violet-500/10" />
          Révision IA
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-l-2 border-l-green-400 bg-green-500/10" />
          Complété
        </div>
      </div>
    </motion.div>
  );
}
