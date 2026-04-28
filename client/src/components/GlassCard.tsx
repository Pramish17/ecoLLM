import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  title?: string;
  subtitle?: string;
}

export default function GlassCard({ children, className = '', delay = 0, title, subtitle }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className={`bg-[#0d1426] border border-white/5 rounded-2xl p-6 shadow-xl ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-5">
          {title && <h3 className="text-white font-semibold text-lg">{title}</h3>}
          {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </motion.div>
  );
}
