import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, Zap, Cpu, Leaf, TrendingDown, Clock, Shield, AlertTriangle } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  zap: <Zap size={16} />,
  cpu: <Cpu size={16} />,
  leaf: <Leaf size={16} />,
  'trending-down': <TrendingDown size={16} />,
  clock: <Clock size={16} />,
  shield: <Shield size={16} />,
};

const IMPACT_STYLES: Record<string, { badge: string; border: string; glow: string }> = {
  'High Impact':   { badge: 'bg-red-500/10 text-red-400 border-red-500/20',   border: 'border-red-500/20',   glow: '#ef444430' },
  'Medium Impact': { badge: 'bg-[#ffd93d]/10 text-[#ffd93d] border-[#ffd93d]/20', border: 'border-[#ffd93d]/20', glow: '#ffd93d30' },
  'Low Impact':    { badge: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20', border: 'border-[#00ff88]/20', glow: '#00ff8830' },
};

interface Recommendation {
  title: string;
  description: string;
  impact: string;
  co2_saving_grams: number;
  icon: string;
}

export default function Advisor() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState('');

  const fetch = async () => {
    setLoading(true);
    setError('');
    setRecommendations(null);

    try {
      const res = await window.fetch('/api/advisor', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Unknown error');
      setRecommendations(data.recommendations);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const chartData = recommendations?.map(r => ({
    name: r.title.slice(0, 22) + (r.title.length > 22 ? '…' : ''),
    saving: +r.co2_saving_grams.toFixed(2),
  })) ?? [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">AI Optimisation Advisor</h1>
          <p className="text-slate-400 text-sm mt-1">
            Powered by Claude Haiku — analyses your usage and suggests high-impact carbon reductions
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={fetch}
          disabled={loading}
          className="flex items-center gap-2 bg-[#00ff88] hover:bg-[#00e87a] text-[#0a0f1e] font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <motion.div
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={loading ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : {}}
          >
            <RefreshCw size={15} />
          </motion.div>
          {loading ? 'Analysing...' : 'Run Analysis'}
        </motion.button>
      </motion.div>

      {/* Placeholder state */}
      <AnimatePresence>
        {!recommendations && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border border-dashed border-white/10 rounded-2xl p-12 text-center"
          >
            <div className="w-16 h-16 bg-[#00ff88]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Leaf size={28} className="text-[#00ff88]" />
            </div>
            <p className="text-white font-semibold mb-1">Ready to optimise</p>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Click "Run Analysis" to let Claude analyse your 30-day API usage and generate personalised carbon reduction recommendations.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeleton */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#0d1426] border border-white/5 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-white/5 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-white/5 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-white/5 rounded w-1/6" />
                  </div>
                </div>
                <div className="h-3 bg-white/5 rounded w-full mb-1.5" />
                <div className="h-3 bg-white/5 rounded w-3/4" />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex items-start gap-3"
        >
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Analysis failed</p>
            <p className="text-slate-400 text-sm mt-0.5">{error}</p>
            {error.includes('ANTHROPIC_API_KEY') && (
              <p className="text-slate-500 text-xs mt-2">Add your key to a <code className="text-slate-300">.env</code> file in the project root: <code className="text-slate-300">ANTHROPIC_API_KEY=sk-ant-...</code></p>
            )}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      <AnimatePresence>
        {recommendations && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0d1426] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold font-mono text-white">{recommendations.length}</p>
                <p className="text-slate-400 text-xs mt-0.5">Recommendations</p>
              </div>
              <div className="bg-[#0d1426] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold font-mono text-[#00ff88]">
                  {recommendations.reduce((a, r) => a + r.co2_saving_grams, 0).toFixed(1)}g
                </p>
                <p className="text-slate-400 text-xs mt-0.5">Potential CO₂ saving</p>
              </div>
              <div className="bg-[#0d1426] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold font-mono text-red-400">
                  {recommendations.filter(r => r.impact === 'High Impact').length}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">High-impact actions</p>
              </div>
            </div>

            {/* Projected saving chart */}
            {chartData.length > 0 && (
              <div className="bg-[#0d1426] border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-1">Projected CO₂ Savings</h3>
                <p className="text-slate-400 text-sm mb-4">Monthly CO₂ reduction per recommendation (grams)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }) => active && payload?.length ? (
                        <div className="bg-[#1a2540] border border-white/10 rounded-xl p-3 text-sm shadow-xl">
                          <p className="text-[#00ff88] font-mono">{payload[0].value}g CO₂ saved</p>
                        </div>
                      ) : null}
                    />
                    <Bar dataKey="saving" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={['#00ff88', '#00d4ff', '#ffd93d', '#fd79a8', '#a29bfe', '#55efc4'][i % 6]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recommendation cards */}
            <div className="space-y-3">
              {recommendations.map((r, i) => {
                const styles = IMPACT_STYLES[r.impact] ?? IMPACT_STYLES['Low Impact'];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.005, transition: { duration: 0.15 } }}
                    className={`bg-[#0d1426] border ${styles.border} rounded-2xl p-5`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl flex-shrink-0 mt-0.5"
                        style={{ background: styles.glow }}>
                        <span style={{ color: styles.glow.replace('30', '') }}>
                          {ICON_MAP[r.icon] ?? <Zap size={16} />}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-semibold text-white">{r.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles.badge}`}>
                              {r.impact}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">{r.description}</p>
                        <div className="mt-3 flex items-center gap-1.5">
                          <TrendingDown size={12} className="text-[#00ff88]" />
                          <span className="text-xs text-slate-500">
                            Est. saving: <span className="text-[#00ff88] font-mono">{r.co2_saving_grams.toFixed(1)}g</span> CO₂/month
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
