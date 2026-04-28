import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '../db/database.js';

const router = Router();

// POST /api/advisor
router.post('/', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const db = getDb();

  // Gather aggregated usage data to send to Claude
  const perModel = db.prepare(`
    SELECT model, COUNT(*) as calls,
           SUM(carbon_grams) as total_carbon,
           AVG(input_tokens) as avg_input,
           AVG(output_tokens) as avg_output,
           SUM(CASE WHEN input_tokens < 500 AND output_tokens < 300 THEN 1 ELSE 0 END) as short_calls
    FROM api_logs
    WHERE timestamp >= datetime('now', '-30 days')
    GROUP BY model
    ORDER BY total_carbon DESC
  `).all();

  const totals = db.prepare(`
    SELECT COUNT(*) as total_calls, SUM(carbon_grams) as total_carbon
    FROM api_logs WHERE timestamp >= datetime('now', '-30 days')
  `).get();

  const usageSummary = perModel.map(r =>
    `- ${r.model}: ${r.calls} calls, ${r.total_carbon.toFixed(2)}g CO₂ total, ` +
    `avg ${Math.round(r.avg_input)} input / ${Math.round(r.avg_output)} output tokens, ` +
    `${r.short_calls} short calls (<500 in / <300 out)`
  ).join('\n');

  const prompt = `You are an AI carbon footprint optimisation advisor for developers using LLM APIs.

Here is the user's API usage data for the last 30 days:
Total: ${totals.total_calls} calls, ${totals.total_carbon?.toFixed(2) ?? 0}g CO₂

Per model breakdown:
${usageSummary}

Analyse this usage and return EXACTLY a JSON array of recommendation objects. Each object must have:
- "title": short action title (max 8 words)
- "description": specific, data-driven recommendation (2-3 sentences, include concrete numbers)
- "impact": one of "High Impact", "Medium Impact", "Low Impact"
- "co2_saving_grams": estimated monthly CO₂ saving in grams (number)
- "icon": one of "zap", "cpu", "leaf", "trending-down", "clock", "shield"

Return between 3 and 6 recommendations. Focus on:
1. Model downgrading opportunities (using lighter models for short tasks)
2. Batching similar calls
3. Prompt optimisation to reduce tokens
4. Time-of-day shifting to lower carbon intensity periods
5. Caching repeated queries

Respond ONLY with valid JSON, no markdown, no explanation.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    // Strip markdown code fences if Claude added them
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const recommendations = JSON.parse(cleaned);

    res.json({ recommendations, usage_summary: perModel, totals });
  } catch (err) {
    console.error('Advisor error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
