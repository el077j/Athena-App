'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Plus, Search, Link, FileText, StickyNote, Trash2, X, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Resource {
  id: string;
  title: string;
  type: 'url' | 'pdf' | 'note';
  content: string;
  subject: string;
  tags: string[];
  createdAt: string;
}

const typeIcons = {
  url: Link,
  pdf: FileText,
  note: StickyNote,
};

const typeColors = {
  url: 'text-sky-400 bg-sky-500/10',
  pdf: 'text-rose-400 bg-rose-500/10',
  note: 'text-blue-400 bg-blue-500/10',
};

export default function FlowHubPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    type: 'note' as 'url' | 'pdf' | 'note',
    content: '',
    subject: '',
    tags: '',
  });

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/resources');
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addResource = async () => {
    if (!newResource.title || !newResource.content || !newResource.subject) return;
    setSaving(true);
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newResource,
          tags: newResource.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResources((prev) => [data.resource, ...prev]);
        setShowForm(false);
        setNewResource({ title: '', type: 'note', content: '', subject: '', tags: '' });
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const deleteResource = async (id: string) => {
    try {
      await fetch('/api/resources', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const subjects = [...new Set(resources.map((r) => r.subject))];

  const filtered = resources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.content.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || r.subject === filter;
    return matchesSearch && matchesFilter;
  });

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative space-y-6 pb-8 max-w-7xl">
      {/* Decorative orbs */}
      <div className="deco-orb deco-orb-cyan" style={{ width: 350, height: 350, top: -80, right: -120 }} />
      <div className="deco-orb deco-orb-blue" style={{ width: 200, height: 200, bottom: 100, left: -60 }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Flow Hub</h1>
          <p className="text-sm text-slate-500">Tes ressources organisées par matière</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 rounded-xl text-sm h-9 neon-glow-blue">
          <Plus className="w-4 h-4 mr-1.5" /> Ajouter
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="glass-input w-full pl-10 pr-4 py-2.5 text-sm" />
        </div>
        {subjects.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setFilter('all')} className={`tag ${filter === 'all' ? 'active' : ''}`}>Tout</button>
            {subjects.map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`tag ${filter === s ? 'active' : ''}`}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Nouvelle ressource</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Titre</label>
                <input value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} className="glass-input w-full px-3 py-2 text-sm" placeholder="Titre de la ressource" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Matière</label>
                <input value={newResource.subject} onChange={(e) => setNewResource({ ...newResource, subject: e.target.value })} className="glass-input w-full px-3 py-2 text-sm" placeholder="Ex: Mathématiques" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Type</label>
                <Tabs value={newResource.type} onValueChange={(v) => setNewResource({ ...newResource, type: v as 'url' | 'pdf' | 'note' })}>
                  <TabsList className="bg-white/5 border border-white/[0.08] rounded-lg">
                    <TabsTrigger value="note" className="text-xs data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">Note</TabsTrigger>
                    <TabsTrigger value="url" className="text-xs data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-300">URL</TabsTrigger>
                    <TabsTrigger value="pdf" className="text-xs data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300">PDF</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Tags (virgules)</label>
                <input value={newResource.tags} onChange={(e) => setNewResource({ ...newResource, tags: e.target.value })} className="glass-input w-full px-3 py-2 text-sm" placeholder="tag1, tag2" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500 mb-1 block">
                  {newResource.type === 'url' ? 'URL' : newResource.type === 'pdf' ? 'Lien du PDF' : 'Contenu'}
                </label>
                {newResource.type === 'note' ? (
                  <textarea value={newResource.content} onChange={(e) => setNewResource({ ...newResource, content: e.target.value })} className="glass-input w-full px-3 py-2 text-sm min-h-[80px] resize-none" placeholder="Écris ta note ici..." />
                ) : (
                  <input value={newResource.content} onChange={(e) => setNewResource({ ...newResource, content: e.target.value })} className="glass-input w-full px-3 py-2 text-sm" placeholder={newResource.type === 'url' ? 'https://...' : 'Lien du PDF'} />
                )}
              </div>
            </div>
            <Button onClick={addResource} disabled={saving} className="mt-3 bg-blue-500/15 hover:bg-blue-500/20 text-blue-300 border border-blue-500/25 rounded-xl text-sm h-8">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Sauvegarder
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resources Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((resource) => {
          const Icon = typeIcons[resource.type] || StickyNote;
          const colorClass = typeColors[resource.type] || typeColors.note;
          return (
            <motion.div key={resource.id} variants={item} className="glass-card p-5 group hover:border-white/[0.12] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {resource.type === 'url' && (
                    <a href={resource.content} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-blue-400 transition-all">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={() => deleteResource(resource.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5 line-clamp-1">{resource.title}</h3>
              <p className="text-[11px] text-blue-400/50 mb-2.5 font-medium">{resource.subject}</p>
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-3">{resource.content}</p>
              {resource.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {resource.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-2 py-0 border-white/[0.08] text-slate-500">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
            <FolderOpen className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-slate-300 mb-1">Aucune ressource</h3>
          <p className="text-sm text-slate-600 max-w-xs">
            Commence à ajouter tes cours, liens et notes pour les organiser.
          </p>
        </div>
      )}
    </motion.div>
  );
}
