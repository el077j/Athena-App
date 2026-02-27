'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Trash2, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/* ─────────────────────────────────────────────────────────────
   AiSidePanel — fixed right sidebar on desktop, slide-in
   drawer on mobile (controlled by layout).
───────────────────────────────────────────────────────────── */
export function AiSidePanel({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialised) {
      setInitialised(true);
      loadHistory();
    }
  }, [initialised]);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('[AiSidePanel] loadHistory error:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    const tempId = Date.now().toString();
    setMessages((prev) => [...prev, { role: 'user', content: text, id: tempId }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempId);
          return [...filtered, data.userMessage, data.aiMessage];
        });
      } else {
        throw new Error(data.error || 'Erreur API');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${msg}`, id: 'error-' + Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch('/api/chat', { method: 'DELETE' });
      setMessages([]);
    } catch (err) {
      console.error('[AiSidePanel] clearHistory error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">Athena IA</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Assistante intelligente</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={clearHistory}
            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Effacer la conversation"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5 transition-all md:hidden"
          >
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 select-none">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
            </div>
            <h4 className="font-semibold text-slate-300 mb-1.5 text-sm">Salut ! Je suis Athena</h4>
            <p className="text-xs text-slate-500 max-w-[220px] leading-relaxed">
              Pose-moi des questions sur tes cours, tes révisions ou ton organisation.
            </p>
            <div className="mt-6 grid gap-2 w-full">
              {[
                '📚 Aide-moi à réviser',
                '📅 Organise ma semaine',
                '💡 Explique-moi un concept',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s.slice(3).trim())}
                  className="text-xs text-left px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:bg-blue-500/8 hover:border-blue-500/20 hover:text-blue-300 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 text-blue-50 border border-blue-500/20 rounded-br-sm'
                  : 'bg-white/[0.04] text-slate-200 border border-white/[0.07] rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start items-end gap-2"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
              </div>
              <div className="bg-white/[0.04] rounded-2xl rounded-bl-sm px-4 py-3 border border-white/[0.07] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input ── */}
      <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
        <div className="flex items-end gap-2 bg-white/[0.03] rounded-xl border border-white/[0.07] focus-within:border-blue-500/30 focus-within:bg-white/[0.05] transition-all p-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envoie un message..."
            rows={1}
            className="flex-1 bg-transparent px-2.5 py-2 text-sm text-white placeholder:text-slate-600 resize-none focus:outline-none max-h-32"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-8 w-8 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white border-0 disabled:opacity-30 flex-shrink-0 transition-all"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" strokeWidth={2} />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-2">
          Entrée pour envoyer · Maj+Entrée pour saut de ligne
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop: grid column (sticky) ── */}
      <aside className="hidden md:flex sticky top-0 h-screen ai-side-panel flex-col z-20">
        {panelContent}
      </aside>

      {/* ── Mobile: slide-in drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[320px] ai-side-panel flex flex-col md:hidden"
            >
              {panelContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* Legacy export so old imports don't break */
export function AIAssistant() {
  return null;
}
