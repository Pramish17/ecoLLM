import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Zap, Leaf, Star, FlaskConical } from 'lucide-react';
import { MODEL_COLORS, efficiencyScore } from '../utils/carbonCalc';
import { useCarbonIntensity } from '../hooks/useCarbonIntensity';
import { useModelsContext } from '../context/ModelsContext';
import { ModelEntry } from '../hooks/useModels';

const inputClass =
  'w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono focus:outline-none focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/20 transition-all';

// Assign a colour for any model, falling back to a palette for custom ones
const CUSTOM_PALETTE = ['#c084fc', '#f472b6', '#34d399', '#fb923c', '#60a5fa', '#a78bfa'];
function modelColor(model: ModelEntry, customIndex: number): string {
  return MODEL_COLORS[model.model_id] ?? CUSTOM_PALETTE[customIndex % CUSTOM_PALETTE.length];
}

interface ModelResult {
  model: ModelEntry;
  energyWh: number;
  carbonGrams: number;
  efficiency: number;
  color: string;
}

export default function Comparison() {
  const { data: ci } = useCarbonIntensity();
  const { data: models, loading: modelsLoading } = useModelsContext();
  const [inputTokens, setInputTokens] = useState('1000');
  const [outputTokens, setOutputTokens] = useState('500');
  const [results, setResults] = useState<ModelResult[] | null>(null);

  const calculate = () => {
    const inp = parseInt(inputTokens) || 1000;
    const out = parseInt(outputTokens) || 500;
    const carbonIntensity = ci?.intensity ?? 233;

    let customIdx = 0;
    const calculated = models.all.map(m => {
      const energyWh = (inp / 1000) * m.input_wh_per_1k + (out / 1000) * m.output_wh_per_1k;
      const carbonGrams = energyWh * (carbonIntensity / 1000);
      const color = modelColor(m, m.builtin ? 0 : customIdx++);
      return { model: m, energyWh, carbonGrams, efficiency: efficiencyScore(m.model_id), color };
    }).sort((a, b) => a.carbonGrams - b.carbonGrams);

    setResults(calculated);
  };

  const greenest = results?.[0];
  const worst = results?.[results.length - 1];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Model Comparison</h1>
        <p className="text-slate-400 text-sm mt-1">Compare carbon efficiency across all models — built-in and custom</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-[#0d1426] border border-white/5 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Configure Token Counts</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Input Tokens</label>
            <input type="number" value={inputTokens} onChange={e => setInputTokens(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Output Tokens</label>
            <input type="number" value={outputTokens} onChange={e => setOutputTokens(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {ci && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full" />
                Live grid: <span className="text-slate-300 font-mono ml-0.5">{ci.intensity} gCO₂/kWh</span>
              </span>
            )}
            <span>{models.all.length} models available ({models.custom.length} custom)</span>
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={calculate}
            disabled={modelsLoading}
            className="bg-[#00d4ff] hover:bg-[#00bde8] text-[#0a0f1e] font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            Compare All Models
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Greenest badge */}
            {greenest && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="border border-[#00ff88]/30 bg-[#00ff88]/5 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-2 bg-[#00ff88]/15 rounded-xl"><Trophy size={20} className="text-[#00ff88]" /></div>
                <div>
                  <p className="text-[#00ff88] font-semibold flex items-center gap-2">
                    Greenest: {greenest.model.display_name}
                    {!greenest.model.builtin && <FlaskConical size={13} className="text-[#00d4ff]" />}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {greenest.carbonGrams.toFixed(6)}g CO₂ —{' '}
                    {worst && Math.round((1 - greenest.carbonGrams / worst.carbonGrams) * 100)}% less carbon than the least efficient
                  </p>
                </div>
              </motion.div>
            )}

            {/* Bar chart */}
            <div className="bg-[#0d1426] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-1">Carbon Efficiency Ranking</h3>
              <p className="text-slate-400 text-sm mb-5">Lower is greener — CO₂ grams per call</p>
              <ResponsiveContainer width="100%" height={Math.max(240, results.length * 34)}>
                <BarChart data={results.map(r => ({ name: r.model.display_name, carbonGrams: r.carbonGrams, color: r.color, builtin: r.model.builtin }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={140} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      const r = results.find(r => r.model.display_name === d.name);
                      if (!r) return null;
                      return (
                        <div className="bg-[#1a2540] border border-white/10 rounded-xl p-3 text-sm shadow-xl">
                          <p className="font-semibold text-white mb-2 flex items-center gap-2">
                            {r.model.display_name}
                            {!r.model.builtin && <span className="text-xs text-[#00d4ff]">custom</span>}
                          </p>
                          <p className="text-[#00ff88] font-mono">CO₂: {r.carbonGrams.toFixed(6)}g</p>
                          <p className="text-[#00d4ff] font-mono">Energy: {r.energyWh.toFixed(6)} Wh</p>
                          <p className="text-slate-400">Efficiency: {r.efficiency}/100</p>
                          {!r.model.builtin && r.model.notes && (
                            <p className="text-slate-500 text-xs mt-1 italic">{r.model.notes}</p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="carbonGrams" radius={[0, 4, 4, 0]}>
                    {results.map((r, i) => (
                      <Cell key={r.model.model_id} fill={i === 0 ? '#00ff88' : r.color} opacity={r.model.builtin ? 1 : 0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {results.map((r, i) => (
                <motion.div key={r.model.model_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-[#0d1426] rounded-xl p-4 border transition-colors ${i === 0 ? 'border-[#00ff88]/40' : 'border-white/5'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-slate-400">#{i + 1}</span>
                    <div className="flex items-center gap-1">
                      {i === 0 && <Star size={12} className="text-[#00ff88]" />}
                      {!r.model.builtin && <FlaskConical size={11} className="text-[#00d4ff]" />}
                    </div>
                  </div>
                  <p className="font-semibold text-white text-sm mb-3 leading-tight">{r.model.display_name}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Leaf size={11} className="text-[#00ff88]" />
                      <span className="font-mono text-xs" style={{ color: i === 0 ? '#00ff88' : '#94a3b8' }}>
                        {r.carbonGrams.toFixed(6)}g
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap size={11} className="text-[#00d4ff]" />
                      <span className="font-mono text-xs text-slate-400">{r.energyWh.toFixed(6)} Wh</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Efficiency</span>
                      <span className="font-mono">{r.efficiency}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${r.efficiency}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                        className="h-full rounded-full" style={{ background: i === 0 ? '#00ff88' : r.color }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Full table */}
            <div className="bg-[#0d1426] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Full Energy Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase border-b border-white/5">
                      {['Model', 'Type', 'In Wh/1k', 'Out Wh/1k', 'Call Energy', 'Call CO₂', 'Score'].map(h => (
                        <th key={h} className="text-left py-2 pr-4 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={r.model.model_id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                        <td className="py-2.5 pr-4">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${r.color}18`, color: r.color }}>
                            {r.model.display_name}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          {r.model.builtin
                            ? <span className="text-xs text-slate-600">built-in</span>
                            : <span className="text-xs text-[#00d4ff] flex items-center gap-1"><FlaskConical size={10} />custom</span>
                          }
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-slate-400 text-xs">{r.model.input_wh_per_1k}</td>
                        <td className="py-2.5 pr-4 font-mono text-slate-400 text-xs">{r.model.output_wh_per_1k}</td>
                        <td className="py-2.5 pr-4 font-mono text-[#00d4ff] text-xs">{r.energyWh.toFixed(6)} Wh</td>
                        <td className="py-2.5 pr-4 font-mono text-xs" style={{ color: i === 0 ? '#00ff88' : '#94a3b8' }}>
                          {r.carbonGrams.toFixed(6)} g
                        </td>
                        <td className="py-2.5 font-mono text-xs" style={{ color: i === 0 ? '#00ff88' : r.color }}>
                          {r.efficiency}/100
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
