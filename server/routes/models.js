import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// Built-in models — source of truth on the server side too
const BUILTIN_MODELS = [
  { model_id: 'claude-opus-4',     display_name: 'Claude Opus 4',      input_wh_per_1k: 0.0035, output_wh_per_1k: 0.0105, builtin: true },
  { model_id: 'claude-sonnet-4-6', display_name: 'Claude Sonnet 4.6',  input_wh_per_1k: 0.0018, output_wh_per_1k: 0.0054, builtin: true },
  { model_id: 'claude-haiku-4-5',  display_name: 'Claude Haiku 4.5',   input_wh_per_1k: 0.0004, output_wh_per_1k: 0.0012, builtin: true },
  { model_id: 'gpt-4o',            display_name: 'GPT-4o',              input_wh_per_1k: 0.0030, output_wh_per_1k: 0.0090, builtin: true },
  { model_id: 'gpt-4o-mini',       display_name: 'GPT-4o Mini',         input_wh_per_1k: 0.0006, output_wh_per_1k: 0.0018, builtin: true },
  { model_id: 'gpt-3.5-turbo',     display_name: 'GPT-3.5 Turbo',      input_wh_per_1k: 0.0005, output_wh_per_1k: 0.0015, builtin: true },
  { model_id: 'gemini-1.5-pro',    display_name: 'Gemini 1.5 Pro',     input_wh_per_1k: 0.0028, output_wh_per_1k: 0.0084, builtin: true },
  { model_id: 'gemini-1.5-flash',  display_name: 'Gemini 1.5 Flash',   input_wh_per_1k: 0.0005, output_wh_per_1k: 0.0015, builtin: true },
];

// GET /api/models — return built-in + custom models merged
router.get('/', (req, res) => {
  const db = getDb();
  const custom = db.prepare('SELECT * FROM custom_models ORDER BY created_at ASC').all()
    .map(r => ({ ...r, builtin: false }));

  res.json({ builtin: BUILTIN_MODELS, custom, all: [...BUILTIN_MODELS, ...custom] });
});

// POST /api/models — add a custom model
router.post('/', (req, res) => {
  const { model_id, display_name, input_wh_per_1k, output_wh_per_1k, source_url, notes } = req.body;

  if (!model_id || !display_name || input_wh_per_1k == null || output_wh_per_1k == null) {
    return res.status(400).json({ error: 'model_id, display_name, input_wh_per_1k, output_wh_per_1k are required' });
  }

  if (input_wh_per_1k <= 0 || output_wh_per_1k <= 0) {
    return res.status(400).json({ error: 'Energy values must be positive numbers' });
  }

  const isBuiltin = BUILTIN_MODELS.some(m => m.model_id === model_id);
  if (isBuiltin) {
    return res.status(409).json({ error: `"${model_id}" is a built-in model and cannot be overridden` });
  }

  const db = getDb();
  try {
    const result = db.prepare(`
      INSERT INTO custom_models (model_id, display_name, input_wh_per_1k, output_wh_per_1k, source_url, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(model_id, display_name, input_wh_per_1k, output_wh_per_1k, source_url ?? null, notes ?? null);

    res.json({
      id: result.lastInsertRowid,
      model_id, display_name, input_wh_per_1k, output_wh_per_1k,
      source_url: source_url ?? null,
      notes: notes ?? null,
      builtin: false,
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: `Model ID "${model_id}" already exists` });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/models/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM custom_models WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Model not found' });
  res.json({ deleted: true });
});

export { BUILTIN_MODELS };
export default router;
