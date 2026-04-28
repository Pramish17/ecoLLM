import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Leaf, Zap, Car, Smartphone, Tv, Coffee } from 'lucide-react';
import { getEquivalents } from '../utils/carbonCalc';
import { useCarbonIntensity } from '../hooks/useCarbonIntensity';
import { useModelsContext } from '../context/ModelsContext';

const inputClass =
  'w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/20 transition-all';
const labelClass = 'block text-sm text-slate-400 mb-1.5 font-medium';

interface ResultData {
  model: string;
  inputTokens: number;
  outputTokens: number;
  energyWh: number;
  carbonGrams: number;
  equivalents: ReturnType<typeof getEquivalents>;
}

export default function LogCall() {
  const { data: ci } = useCarbonIntensity();
  const { data: models, loading: modelsLoading, getEnergy } = useModelsContext();
  // Use only active (non-hidden) models in the dropdown
  const activeModels = models.active;

  const [form, setForm] = useState({
    model: '',
    inputTokens: '',
    outputTokens: '',
    notes: '',
    timestamp: new Date().toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState('');

  // Set default model once models load
  const selectedModel = form.model || activeModels[0]?.model_id || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const inputTokens = parseInt(form.inputTokens);
    const outputTokens = parseInt(form.outputTokens);
    if (!inputTokens || !outputTokens) return setError('Please enter valid token counts.');

    const e_ = getEnergy(selectedModel);
    if (!e_) return setError(`Unknown model. Add it on the Custom Models page first.`);

    setLoading(true);
    const carbonIntensity = ci?.intensity ?? 233;
    const energyWh = (inputTokens / 1000) * e_.input + (outputTokens / 1000) * e_.output;
    const carbonGrams = energyWh * (carbonIntensity / 1000);

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          carbon_intensity: carbonIntensity,
          timestamp: new Date(form.timestamp).toISOString(),
          notes: form.notes || null,
        }),
      });

      setResult({ model: selectedModel, inputTokens, outputTokens, energyWh, carbonGrams, equivalents: getEquivalents(carbonGrams) });
    } catch {
      setError('Failed to save. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Log API Call</h1>
        <p className="text-slate-400 text-sm mt-1">Track an LLM API call and calculate its carbon footprint</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="bg-[#0d1426] border border-white/5 rounded-2xl p-6 space-y-5"
      >
        <div>
          <label className={labelClass}>Model</label>
          {modelsLoading ? (
            <div className="h-11 bg-white/5 rounded-xl animate-pulse" />
          ) : (
            <select
              value={selectedModel}
              onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
              className={inputClass + ' cursor-pointer'}
            >
              {activeModels.filter(m => m.builtin).length > 0 && (
                <optgroup label="Built-in (research-backed)">
                  {activeModels.filter(m => m.builtin).map(m => (
                    <option key={m.model_id} value={m.model_id}>{m.display_name}</option>
                  ))}
                </optgroup>
              )}
              {activeModels.filter(m => !m.builtin).length > 0 && (
                <optgroup label="Custom Models">
                  {activeModels.filter(m => !m.builtin).map(m => (
                    <option key={m.model_id} value={m.model_id}>{m.display_name} ⚗</option>
                  ))}
                </optgroup>
              )}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Input Tokens</label>
            <input type="number" min="1" placeholder="e.g. 1500"
              value={form.inputTokens} onChange={e => setForm(f => ({ ...f, inputTokens: e.target.value }))}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Output Tokens</label>
            <input type="number" min="1" placeholder="e.g. 400"
              value={form.outputTokens} onChange={e => setForm(f => ({ ...f, outputTokens: e.target.value }))}
              className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Timestamp</label>
          <input type="datetime-local" value={form.timestamp}
            onChange={e => setForm(f => ({ ...f, timestamp: e.target.value }))} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Notes <span className="text-slate-600">(optional)</span></label>
          <input type="text" placeholder="e.g. Code completion task"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputClass} />
        </div>

        {ci && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] inline-block" />
            Live UK grid: <span className="text-slate-300 font-mono ml-0.5">{ci.intensity} gCO₂/kWh</span>
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 bg-[#00ff88] hover:bg-[#00e87a] text-[#0a0f1e] font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
          {loading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-[#0a0f1e]/40 border-t-[#0a0f1e] rounded-full" />
          ) : <><Send size={16} /> Calculate &amp; Log</>}
        </motion.button>
      </motion.form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-[#0d1426] border border-[#00ff88]/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 bg-[#00ff88]/10 rounded-lg"><Leaf size={16} className="text-[#00ff88]" /></div>
              <h3 className="font-semibold text-white">Carbon Footprint Result</h3>
              {models.custom.find(m => m.model_id === result.model) && (
                <span className="text-xs px-2 py-0.5 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 rounded-full ml-auto">custom model</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-[#0a0f1e] rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-1"><Zap size={13} className="text-[#00d4ff]" /><span className="text-xs text-slate-400">Energy Used</span></div>
                <p className="text-[#00d4ff] font-mono font-bold text-xl">{result.energyWh.toFixed(6)}</p>
                <p className="text-slate-500 text-xs">Wh</p>
              </div>
              <div className="bg-[#0a0f1e] rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-1"><Leaf size={13} className="text-[#00ff88]" /><span className="text-xs text-slate-400">Carbon Output</span></div>
                <p className="text-[#00ff88] font-mono font-bold text-xl">{result.carbonGrams.toFixed(6)}</p>
                <p className="text-slate-500 text-xs">gCO₂</p>
              </div>
            </div>

            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Real-world equivalents</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Car size={14} />, label: 'Driving', value: `${result.equivalents.drivingKm} km`, color: '#ffd93d' },
                { icon: <Smartphone size={14} />, label: 'Phone charges', value: `${result.equivalents.phonesCharged}×`, color: '#a29bfe' },
                { icon: <Tv size={14} />, label: 'Netflix', value: `${result.equivalents.netflixMinutes} min`, color: '#fd79a8' },
                { icon: <Coffee size={14} />, label: 'Kettle boils', value: `${result.equivalents.kettleBoils}×`, color: '#00d4ff' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-2.5 bg-[#0a0f1e] rounded-xl p-3">
                  <span style={{ color }}>{icon}</span>
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-mono text-sm font-semibold" style={{ color }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-slate-600 mt-4">Saved to dashboard ✓</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
