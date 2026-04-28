import { getDb } from './database.js';

const MODELS = [
  'claude-opus-4',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
];

const MODEL_ENERGY = {
  'claude-opus-4':     { input: 0.0035, output: 0.0105 },
  'claude-sonnet-4-6': { input: 0.0018, output: 0.0054 },
  'claude-haiku-4-5':  { input: 0.0004, output: 0.0012 },
  'gpt-4o':            { input: 0.0030, output: 0.0090 },
  'gpt-4o-mini':       { input: 0.0006, output: 0.0018 },
  'gpt-3.5-turbo':     { input: 0.0005, output: 0.0015 },
  'gemini-1.5-pro':    { input: 0.0028, output: 0.0084 },
  'gemini-1.5-flash':  { input: 0.0005, output: 0.0015 },
};

const MODEL_WEIGHTS = [3, 5, 12, 6, 10, 8, 4, 8]; // weighted random, haiku heaviest

const NOTES_POOL = [
  'Code completion task', 'Summarisation pipeline', 'Chat assistant response',
  'Document classification', 'Sentiment analysis batch', 'Translation job',
  'SQL generation', 'Email drafting', 'Data extraction', 'QA evaluation',
  null, null, null, null, // mostly no notes
];

function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function calcCarbon(model, inputTokens, outputTokens, carbonIntensity = 233) {
  const e = MODEL_ENERGY[model];
  const energyWh = (inputTokens / 1000) * e.input + (outputTokens / 1000) * e.output;
  const carbonGrams = energyWh * (carbonIntensity / 1000);
  return { energyWh, carbonGrams };
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function seedIfEmpty() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM api_logs').get().c;
  if (count > 0) return;

  console.log('🌱 Seeding database with 60 days of demo data...');

  const insert = db.prepare(`
    INSERT INTO api_logs (model, input_tokens, output_tokens, energy_wh, carbon_grams, carbon_intensity, timestamp, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;

  const seedMany = db.transaction(() => {
    // ~8-15 calls per day for 60 days = ~600-900 rows
    for (let day = 0; day < 60; day++) {
      const dayStart = now - SIXTY_DAYS + day * 24 * 60 * 60 * 1000;
      const callsThisDay = randInt(6, 18);

      for (let i = 0; i < callsThisDay; i++) {
        const model = weightedRandom(MODELS, MODEL_WEIGHTS);
        const carbonIntensity = randInt(150, 380);

        // Vary token counts by model type
        // ~30% of heavy-model calls are short (realistic: devs misusing large models for small tasks)
        let inputTokens, outputTokens;
        const isShortCall = Math.random() < 0.30;
        if (model.includes('opus') || model.includes('pro')) {
          if (isShortCall) {
            inputTokens = randInt(80, 450);
            outputTokens = randInt(60, 280);
          } else {
            inputTokens = randInt(800, 8000);
            outputTokens = randInt(400, 3000);
          }
        } else if (model.includes('haiku') || model.includes('flash') || model.includes('mini')) {
          inputTokens = randInt(50, 1500);
          outputTokens = randInt(50, 800);
        } else {
          inputTokens = randInt(200, 4000);
          outputTokens = randInt(100, 1500);
        }

        const { energyWh, carbonGrams } = calcCarbon(model, inputTokens, outputTokens, carbonIntensity);
        const timestamp = new Date(dayStart + randInt(0, 86400000)).toISOString();
        const notes = NOTES_POOL[randInt(0, NOTES_POOL.length - 1)];

        insert.run(model, inputTokens, outputTokens, energyWh, carbonGrams, carbonIntensity, timestamp, notes);
      }
    }
  });

  seedMany();
  const final = db.prepare('SELECT COUNT(*) as c FROM api_logs').get().c;
  console.log(`✅ Seeded ${final} API call records.`);
}
