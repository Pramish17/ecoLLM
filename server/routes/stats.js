import { Router } from 'express';
import { getDb } from '../db/database.js';

const router = Router();

// GET /api/stats
router.get('/', (req, res) => {
  const db = getDb();

  // Monthly stats
  const monthly = db.prepare(`
    SELECT
      COUNT(*) as total_calls,
      SUM(carbon_grams) as total_carbon_grams,
      SUM(energy_wh) as total_energy_wh,
      AVG(carbon_grams) as avg_carbon_per_call
    FROM api_logs
    WHERE timestamp >= datetime('now', '-30 days')
  `).get();

  // Most used model this month
  const topModel = db.prepare(`
    SELECT model, COUNT(*) as count
    FROM api_logs
    WHERE timestamp >= datetime('now', '-30 days')
    GROUP BY model
    ORDER BY count DESC
    LIMIT 1
  `).get();

  // Daily CO2 for last 30 days
  const dailyCo2 = db.prepare(`
    SELECT
      date(timestamp) as day,
      SUM(carbon_grams) as carbon_grams,
      COUNT(*) as calls
    FROM api_logs
    WHERE timestamp >= datetime('now', '-30 days')
    GROUP BY date(timestamp)
    ORDER BY day ASC
  `).all();

  // CO2 per model (all time)
  const perModel = db.prepare(`
    SELECT
      model,
      COUNT(*) as calls,
      SUM(carbon_grams) as total_carbon,
      SUM(energy_wh) as total_energy,
      AVG(carbon_grams) as avg_carbon
    FROM api_logs
    GROUP BY model
    ORDER BY total_carbon DESC
  `).all();

  // Recent 10 logs
  const recentLogs = db.prepare(`
    SELECT * FROM api_logs
    ORDER BY timestamp DESC
    LIMIT 10
  `).all();

  // Optimisation potential: calls on expensive models that could use a cheaper model
  const optimisable = db.prepare(`
    SELECT COUNT(*) as count, SUM(carbon_grams) as carbon,
           SUM(input_tokens) as total_input, SUM(output_tokens) as total_output
    FROM api_logs
    WHERE model IN ('claude-opus-4', 'gpt-4o', 'gemini-1.5-pro')
      AND input_tokens < 800
      AND output_tokens < 500
  `).get();

  // What the same calls would cost on haiku
  const MODEL_ENERGY_HAIKU = { input: 0.0004, output: 0.0012 };
  const haikuCarbon = optimisable.count > 0
    ? ((optimisable.total_input / 1000) * MODEL_ENERGY_HAIKU.input +
       (optimisable.total_output / 1000) * MODEL_ENERGY_HAIKU.output) * (233 / 1000)
    : 0;

  const savings_pct = optimisable.carbon > 0
    ? Math.round(((optimisable.carbon - haikuCarbon) / optimisable.carbon) * 100)
    : 0;

  res.json({
    monthly: {
      ...monthly,
      top_model: topModel?.model ?? 'N/A',
    },
    daily_co2: dailyCo2,
    per_model: perModel,
    recent_logs: recentLogs,
    optimisation: {
      optimisable_calls: optimisable.count,
      potential_carbon_saving_grams: Math.max(0, (optimisable.carbon ?? 0) - haikuCarbon),
      savings_pct: Math.min(savings_pct, 92),
    },
  });
});

export default router;
