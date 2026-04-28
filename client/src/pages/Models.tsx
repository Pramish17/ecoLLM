import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ExternalLink, Lock, FlaskConical, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useModelsContext } from '../context/ModelsContext';
import { ModelEntry } from '../hooks/useModels';

const inputClass =
  'w-full bg-[#0a0f1e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/20 transition-all';

const EMPTY_FORM = {
  model_id: '',
  display_name: '',
  input_wh_per_1k: '',
  output_wh_per_1k: '',
  source_url: '',
  notes: '',
};

// Preset suggestions to help users fill in known-but-unresearched models
const PRESETS: Partial<typeof EMPTY_FORM>[] = [
  { model_id: 'claude-opus-4-7', display_name: 'Claude Opus 4.7', input_wh_per_1k: '0.0038', output_wh_per_1k: '0.0114', notes: 'Estimated — ~8% higher than Opus 4 based on capability increase' },
  { model_id: 'gpt-4o-2025',     display_name: 'GPT-4o (2025)',    input_wh_per_1k: '0.0028', output_wh_per_1k: '0.0084', notes: 'Estimated — extrapolated from OpenAI efficiency trend' },
  { model_id: 'gemini-2.0-pro',  display_name: 'Gemini 2.0 Pro',  input_wh_per_1k: '0.0025', output_wh_per_1k: '0.0075', notes: 'Estimated — based on Google efficiency claims' },
];

export default function Models() {
  const { data, loading, addModel, deleteModel } = useModelsContext();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const applyPreset = (preset: Partial<typeof EMPTY_FORM>) => {
    setForm(f => ({ ...f, ...preset }));
    setFormError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    const inp = parseFloat(form.input_wh_per_1k);
    const out = parseFloat(form.output_wh_per_1k);

    if (!form.model_id.trim() || !form.display_name.trim()) {
      return setFormError('Model ID and display name are required.');
    }
    if (isNaN(inp) || isNaN(out) || inp <= 0 || out <= 0) {
      return setFormError('Energy values must be positive numbers (e.g. 0.0035).');
    }

    setSubmitting(true);
    try {
      await addModel({
        model_id: form.model_id.trim(),
        display_name: form.display_name.trim(),
        input_wh_per_1k: inp,
        output_wh_per_1k: out,
        source_url: form.source_url.trim() || null,
        notes: form.notes.trim() || null,
      });
      setSuccess(`"${form.display_name}" added successfully.`);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add model');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (model: ModelEntry) => {
    if (!model.id) return;
    setDeleting(model.id);
    try {
      await deleteModel(model.id);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Custom Models</h1>
        <p className="text-slate-400 text-sm mt-1">
          Add any LLM with its published energy figures — GPT-5, Gemini 3, Opus 4.7, or any internal model.
        </p>
      </motion.div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-start gap-3 bg-[#00d4ff]/5 border border-[#00d4ff]/15 rounded-xl p-4"
      >
        <Info size={15} className="text-[#00d4ff] flex-shrink-0 mt-0.5" />
        <p className="text-slate-400 text-sm">
          Energy values should come from the provider's published benchmarks or peer-reviewed research.
          Estimated values are supported — just add a note so future-you remembers the source.
          The <span className="text-white">Wh per 1,000 tokens</span> figure represents data-centre-level energy including PUE.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Add form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 bg-[#0d1426] border border-white/5 rounded-2xl p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Plus size={16} className="text-[#00d4ff]" />
            Add New Model
          </h3>

          {/* Presets */}
          <div className="mb-5">
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Quick presets (estimated)</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.model_id}
                  onClick={() => applyPreset(p)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#00d4ff]/8 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/15 transition-colors font-medium"
                >
                  {p.display_name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Model ID <span className="text-slate-600">(unique slug)</span></label>
                <input
                  value={form.model_id}
                  onChange={e => setForm(f => ({ ...f, model_id: e.target.value }))}
                  placeholder="gpt-5-turbo"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Display Name</label>
                <input
                  value={form.display_name}
                  onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  placeholder="GPT-5 Turbo"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Input Wh / 1k tokens</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={form.input_wh_per_1k}
                  onChange={e => setForm(f => ({ ...f, input_wh_per_1k: e.target.value }))}
                  placeholder="0.0030"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Output Wh / 1k tokens</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={form.output_wh_per_1k}
                  onChange={e => setForm(f => ({ ...f, output_wh_per_1k: e.target.value }))}
                  placeholder="0.0090"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Source URL <span className="text-slate-600">(optional but recommended)</span></label>
              <input
                value={form.source_url}
                onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
                placeholder="https://arxiv.org/abs/..."
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Notes <span className="text-slate-600">(optional)</span></label>
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Estimated based on provider efficiency trends"
                className={inputClass}
              />
            </div>

            <AnimatePresence>
              {formError && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={14} /> {formError}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[#00ff88] text-sm">
                  <CheckCircle size={14} /> {success}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-[#00d4ff] hover:bg-[#00bde8] text-[#0a0f1e] font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-[#0a0f1e]/40 border-t-[#0a0f1e] rounded-full" />
              ) : <Plus size={15} />}
              {submitting ? 'Adding...' : 'Add Model'}
            </motion.button>
          </form>
        </motion.div>

        {/* Right panel: energy reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 bg-[#0d1426] border border-white/5 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold mb-3 text-sm">Built-in Reference</h3>
          <p className="text-slate-500 text-xs mb-3">Use these as a baseline when estimating new models:</p>
          <div className="space-y-2">
            {data.builtin.map(m => (
              <div key={m.model_id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/3">
                <span className="text-slate-300 font-medium">{m.display_name}</span>
                <span className="font-mono text-slate-500">
                  {m.input_wh_per_1k} / {m.output_wh_per_1k}
                </span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-xs mt-3">Format: input Wh / output Wh per 1k tokens</p>
        </motion.div>
      </div>

      {/* Built-in models list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#0d1426] border border-white/5 rounded-2xl p-6"
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Lock size={14} className="text-slate-500" />
          Built-in Models
          <span className="text-xs text-slate-500 font-normal ml-1">— research-backed, read-only</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.builtin.map((m, i) => (
            <motion.div
              key={m.model_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              className="bg-[#0a0f1e] rounded-xl p-3 border border-white/5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Lock size={10} className="text-slate-600" />
                <span className="text-xs text-slate-500">built-in</span>
              </div>
              <p className="text-white text-sm font-medium leading-tight mb-2">{m.display_name}</p>
              <p className="font-mono text-xs text-slate-400">in: {m.input_wh_per_1k} Wh/1k</p>
              <p className="font-mono text-xs text-slate-400">out: {m.output_wh_per_1k} Wh/1k</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Custom models list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-[#0d1426] border border-white/5 rounded-2xl p-6"
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <FlaskConical size={14} className="text-[#00d4ff]" />
          Your Custom Models
          {!loading && (
            <span className="text-xs text-slate-500 font-normal ml-1">— {data.custom.length} added</span>
          )}
        </h3>

        {loading && (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-16 bg-white/3 rounded-xl animate-pulse" />)}
          </div>
        )}

        {!loading && data.custom.length === 0 && (
          <div className="text-center py-10 border border-dashed border-white/8 rounded-xl">
            <FlaskConical size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No custom models yet.</p>
            <p className="text-slate-600 text-xs mt-1">Add one above — it will appear in Log Call and Compare pages.</p>
          </div>
        )}

        {!loading && data.custom.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {data.custom.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4 bg-[#0a0f1e] border border-[#00d4ff]/10 rounded-xl p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">{m.display_name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-[#00d4ff]/10 text-[#00d4ff] rounded-full border border-[#00d4ff]/20 font-medium">
                        custom
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-500 mb-1">{m.model_id}</p>
                    <div className="flex gap-4 text-xs font-mono">
                      <span className="text-slate-400">in: <span className="text-white">{m.input_wh_per_1k}</span> Wh/1k</span>
                      <span className="text-slate-400">out: <span className="text-white">{m.output_wh_per_1k}</span> Wh/1k</span>
                    </div>
                    {m.notes && <p className="text-slate-600 text-xs mt-1.5 italic">{m.notes}</p>}
                    {m.source_url && (
                      <a href={m.source_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#00d4ff] hover:text-[#00ff88] transition-colors flex items-center gap-1 mt-1">
                        <ExternalLink size={10} /> Source
                      </a>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(m)}
                    disabled={deleting === m.id}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-30 flex-shrink-0"
                    title="Delete model"
                  >
                    {deleting === m.id ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border border-red-400/40 border-t-red-400 rounded-full" />
                    ) : <Trash2 size={15} />}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
