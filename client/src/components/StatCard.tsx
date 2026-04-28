import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  label: string;
  children: ReactNode;
  icon: ReactNode;
  accent?: 'green' | 'cyan' | 'yellow' | 'red';
  delay?: number;
}

const accentMap = {
  green: 'border-[#00ff88]/30 shadow-[#00ff88]/5',
  cyan: 'border-[#00d4ff]/30 shadow-[#00d4ff]/5',
  yellow: 'border-yellow-400/30 shadow-yellow-400/5',
  red: 'border-red-400/30 shadow-red-400/5',
};

const iconAccentMap = {
  green: 'bg-[#00ff88]/10 text-[#00ff88]',
  cyan: 'bg-[#00d4ff]/10 text-[#00d4ff]',
  yellow: 'bg-yellow-400/10 text-yellow-400',
  red: 'bg-red-400/10 text-red-400',
};

export default function StatCard({ label, children, icon, accent = 'green', delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
      className={`bg-[#0d1426] border ${accentMap[accent]} rounded-2xl p-5 shadow-lg flex flex-col gap-3 cursor-default`}
    >
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium tracking-wide uppercase">{label}</span>
        <div className={`p-2 rounded-lg ${iconAccentMap[accent]}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold font-mono text-white">{children}</div>
    </motion.div>
  );
}
