import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PlusCircle, GitCompare, BrainCircuit, BookOpen, Leaf, FlaskConical } from 'lucide-react';
import { ModelsProvider } from './context/ModelsContext';
import Dashboard from './pages/Dashboard';
import LogCall from './pages/LogCall';
import Comparison from './pages/Comparison';
import Advisor from './pages/Advisor';
import Models from './pages/Models';
import About from './pages/About';

type Tab = 'dashboard' | 'log' | 'compare' | 'advisor' | 'models' | 'about';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard',      icon: <LayoutDashboard size={16} /> },
  { id: 'log',       label: 'Log Call',        icon: <PlusCircle size={16} /> },
  { id: 'compare',   label: 'Compare',         icon: <GitCompare size={16} /> },
  { id: 'advisor',   label: 'Advisor',         icon: <BrainCircuit size={16} /> },
  { id: 'models',    label: 'Custom Models',   icon: <FlaskConical size={16} /> },
  { id: 'about',     label: 'About',           icon: <BookOpen size={16} /> },
];

const PAGE_MAP: Record<Tab, React.ReactNode> = {
  dashboard: <Dashboard />,
  log:       <LogCall />,
  compare:   <Comparison />,
  advisor:   <Advisor />,
  models:    <Models />,
  about:     <About />,
};

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <ModelsProvider>
      <div className="min-h-screen bg-[#0a0f1e] text-white font-sans">
        {/* Top nav */}
        <header className="border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-6 h-14">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 flex-shrink-0 mr-2"
            >
              <div className="p-1.5 bg-[#00ff88]/10 rounded-lg">
                <Leaf size={16} className="text-[#00ff88]" />
              </div>
              <span className="font-bold text-white tracking-tight">
                Eco<span className="text-[#00ff88]">LLM</span>
              </span>
            </motion.div>

            {/* Tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {TABS.map(({ id, label, icon }, i) => (
                <motion.button
                  key={id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap relative ${
                    tab === id ? 'text-[#00ff88]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {tab === id && (
                    <motion.div
                      layoutId="tab-bg"
                      className="absolute inset-0 bg-[#00ff88]/8 border border-[#00ff88]/15 rounded-lg"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </motion.button>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-600 hidden md:block font-mono">v1.0.0</span>
              <div className="flex items-center gap-1.5 bg-[#00ff88]/5 border border-[#00ff88]/15 rounded-full px-2.5 py-1">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-[#00ff88] rounded-full"
                />
                <span className="text-xs text-[#00ff88] font-medium">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {PAGE_MAP[tab]}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ModelsProvider>
  );
}
