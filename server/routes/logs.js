import { Router } from 'express';
import { getDb } from '../db/database.js';
import { BUILTIN_MODELS } from './models.js';

const router = Router();

function resolveModel(modelId) {
  const builtin = BUILTIN_MODELS.find(m => m.model_id === modelId);
  if (builtin) return { input: builtin.input_wh_per_1k, output: builtin.output_wh_per_1k };

  const db = getDb();
  const custom = db.prepare('SELECT * FROM custom_models WHERE model_id = ?').get(modelId);
  if (custom) return { input: custom.input_wh_per_1k, output: custom.output_wh_per_1k };

  return null;
}

// POST /api/logs
router.post('/', (req, res) => {
  const { model, input_tokens, output_tokens, carbon_intensity, timestamp, notes } = req.body;

  if (!model || input_tokens == null || output_tokens == null) {
    return res.status(400).json({ error: 'model, input_tokens, and output_tokens are required' });
  }

  const e = resolveModel(model);
  if (!e) return res.status(400).json({ error: `Unknown model: "${model}". Add it via the Custom Models page first.` });

  const ci = carbon_intensity ?? 233;
  const energyWh = (input_tokens / 1000) * e.input + (output_tokens / 1000) * e.output;
  const carbonGrams = energyWh * (ci / 1000);

  const db = getDb();
  const ts = timestamp || new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO api_logs (model, input_tokens, output_tokens, energy_wh, carbon_grams, carbon_intensity, timestamp, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(model, input_tokens, output_tokens, energyWh, carbonGrams, ci, ts, notes ?? null);

  res.json({
    id: result.lastInsertRowid,
    model, input_tokens, output_tokens,
    energy_wh: energyWh,
    carbon_grams: carbonGrams,
    carbon_intensity: ci,
    timestamp: ts,
    notes,
  });
});

// GET /api/logs
router.get('/', (req, res) => {
  const db = getDb();
  const { days, model } = req.query;

  let query = 'SELECT * FROM api_logs WHERE 1=1';
  const params = [];

  if (days) query += ` AND timestamp >= datetime('now', '-${parseInt(days)} days')`;
  if (model) { query += ' AND model = ?'; params.push(model); }

  query += ' ORDER BY timestamp DESC LIMIT 1000';
  res.json(db.prepare(query).all(...params));
});

export default router;
