import { motion, AnimatePresence } from 'framer-motion';
import { useCarbonIntensity } from '../hooks/useCarbonIntensity';
import { Zap, RefreshCw } from 'lucide-react';

const INDEX_COLORS: Record<string, string> = {
  'very low': '#00ff88',
  low: '#55efc4',
  moderate: '#ffd93d',
  high: '#fd79a8',
  'very high': '#ff6b6b',
};

const INDEX_BG: Record<string, string> = {
  'very low': 'bg-[#00ff88]/10 border-[#00ff88]/20',
  low: 'bg-[#55efc4]/10 border-[#55efc4]/20',
  moderate: 'bg-[#ffd93d]/10 border-[#ffd93d]/20',
  high: 'bg-[#fd79a8]/10 border-[#fd79a8]/20',
  'very high': 'bg-[#ff6b6b]/10 border-[#ff6b6b]/20',
};

export default function LiveCarbonWidget() {
  const { data, loading, refetch } = useCarbonIntensity();

  const idx = (data?.index ?? 'moderate').toLowerCase();
  const color = INDEX_COLORS[idx] ?? '#ffd93d';
  const bg = INDEX_BG[idx] ?? INDEX_BG.moderate;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className={`border rounded-2xl p-5 ${bg} flex items-center gap-4`}
    >
      <div className="relative flex-shrink-0">
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute inset-0 rounded-full"
          style={{ background: color }}
        />
        <div className="w-3 h-3 rounded-full relative" style={{ background: color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Zap size={12} style={{ color }} />
          <span className="text-xs text-slate-400 uppercase tracking-wider">Live UK Grid</span>
          {data?.fallback && <span className="text-xs text-slate-500">(fallback)</span>}
        </div>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" className="h-6 w-20 bg-white/5 rounded animate-pulse" />
          ) : (
            <motion.div
              key={data?.intensity}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-baseline gap-1.5"
            >
              <span className="text-xl font-bold font-mono" style={{ color }}>
                {data?.intensity ?? 233}
              </span>
              <span className="text-xs text-slate-400">gCO₂/kWh</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ml-1"
                style={{ background: `${color}20`, color }}
              >
                {data?.index ?? 'moderate'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={refetch}
        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-500 hover:text-slate-300"
      >
        <RefreshCw size={13} />
      </button>
    </motion.div>
  );
}
