'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { AIAssistant, AiSidePanel } from '@/components/AiAssistant';
import { LayoutDashboard, Calendar, FolderOpen, LogOut, Menu, X, ChevronLeft, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/scheduler', icon: Calendar, label: 'Planificateur' },
  { path: '/flowhub', icon: FolderOpen, label: 'Flow Hub' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const RAIL_W = 68;
const PANEL_W = 220;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, fetchUser, logout } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiMobileOpen, setAiMobileOpen] = useState(false);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const navigate = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="space-y-4 w-80">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-64" />
          <div className="skeleton h-4 w-56" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="app-background min-h-screen md:grid md:grid-cols-[68px_1fr_350px]">
      {/* ══════ DESKTOP: Icon Rail — Grid Col 1 ══════ */}
      <nav
        className="hidden md:flex sticky top-0 h-screen sidebar-rail flex-col items-center py-5 select-none z-20"
      >
        {/* Avatar */}
        <div className="sidebar-rail-avatar mb-4" onClick={() => setExpanded(!expanded)}>
          <div className="sidebar-rail-avatar-inner">
            {getInitials(user.name || 'U')}
          </div>
        </div>

        {/* Section label */}
        <span className="sidebar-rail-label mb-1">Menu</span>

        {/* Nav icons */}
        <div className="flex flex-col items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`sidebar-rail-btn ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-[20px] h-[20px]" strokeWidth={1.8} />
                <span className="rail-tooltip">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-rail-sep mt-3 mb-3" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout */}
        <button onClick={handleLogout} className="sidebar-rail-btn logout">
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} />
          <span className="rail-tooltip">Déconnexion</span>
        </button>
      </nav>

      {/* ══════ DESKTOP: Expanded Panel (slides from rail) ══════ */}
      <AnimatePresence>
        {expanded && (
          <>
            {/* Click-away overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="hidden md:block fixed inset-0 z-40"
            />

            <motion.aside
              initial={{ x: -(PANEL_W) }}
              animate={{ x: 0 }}
              exit={{ x: -(PANEL_W) }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="hidden md:flex fixed top-0 bottom-0 z-45 sidebar-panel flex-col overflow-y-auto"
              style={{ left: RAIL_W, width: PANEL_W }}
            >
              {/* Header */}
              <div className="px-4 pt-5 pb-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="sidebar-rail-avatar" style={{ width: 36, height: 36 }}>
                    <div className="sidebar-rail-avatar-inner" style={{ fontSize: '0.7rem' }}>
                      {getInitials(user.name || 'U')}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-blue-400/60">{greetingTime()},</p>
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  </div>
                </div>
                {/* Collapse btn */}
                <button
                  onClick={() => setExpanded(false)}
                  className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              {/* Section */}
              <p className="sidebar-panel-section mt-2">Menu</p>

              {/* Nav items */}
              <div className="px-3 space-y-0.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setExpanded(false); }}
                      className={`sidebar-panel-item ${isActive ? 'active' : ''}`}
                    >
                      <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom */}
              <div className="mt-auto px-3 pb-5 pt-3 border-t border-white/[0.05]">
                <p className="text-[10px] text-slate-600 truncate px-2 mb-2">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="sidebar-panel-item text-red-400/70 hover:!text-red-400 hover:!bg-red-500/8"
                >
                  <LogOut className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
                  <span>Déconnexion</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════ MOBILE: Hamburger (left nav) ══════ */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 rounded-xl bg-[#0a1628]/90 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white shadow-lg transition-colors"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5" strokeWidth={1.8} />
      </button>

      {/* ══════ MOBILE: AI toggle (right) ══════ */}
      <button
        onClick={() => setAiMobileOpen(true)}
        className="fixed top-4 right-4 z-50 md:hidden w-10 h-10 rounded-xl bg-[#0a1628]/90 border border-blue-500/25 flex items-center justify-center text-blue-400 hover:text-blue-300 shadow-lg transition-colors"
        aria-label="Assistant IA"
      >
        <Bot className="w-5 h-5" strokeWidth={1.8} />
      </button>

      {/* ══════ MOBILE: Overlay ══════ */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ══════ MOBILE: Full Sidebar ══════ */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] z-50 md:hidden sidebar-panel overflow-y-auto"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 z-10 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.8} />
            </button>

            <div className="flex flex-col items-center pt-8 pb-5">
              <div className="sidebar-rail-avatar" style={{ width: 56, height: 56 }}>
                <div className="sidebar-rail-avatar-inner" style={{ fontSize: '1rem' }}>
                  {getInitials(user.name || 'U')}
                </div>
              </div>
              <p className="text-[11px] text-blue-400/60 mt-3">{greetingTime()},</p>
              <p className="text-sm font-semibold text-white truncate max-w-[200px]">{user.name}</p>
            </div>

            <p className="sidebar-panel-section">Menu</p>
            <nav className="px-4 space-y-0.5">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`sidebar-panel-item ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto px-4 pt-6 pb-6 border-t border-white/[0.06] mt-8">
              <p className="text-[10px] text-slate-600 truncate px-3 mb-2">{user.email}</p>
              <button
                onClick={handleLogout}
                className="sidebar-panel-item text-red-400/70 hover:!text-red-400 hover:!bg-red-500/8"
              >
                <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} />
                <span>Déconnexion</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ══════ MAIN CONTENT — Grid Col 2 ══════ */}
      <main className="p-4 md:px-8 md:py-8 pt-16 md:pt-8 relative z-10 min-h-screen overflow-x-hidden">
        {children}
      </main>

      {/* ══════ AI SIDE PANEL — Grid Col 3 ══════ */}
      <AiSidePanel mobileOpen={aiMobileOpen} setMobileOpen={setAiMobileOpen} />
      <AIAssistant />
    </div>
  );
}
