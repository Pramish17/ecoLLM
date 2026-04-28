export const MODEL_ENERGY_TABLE: Record<string, { input: number; output: number }> = {
  'claude-opus-4':     { input: 0.0035, output: 0.0105 },
  'claude-sonnet-4-6': { input: 0.0018, output: 0.0054 },
  'claude-haiku-4-5':  { input: 0.0004, output: 0.0012 },
  'gpt-4o':            { input: 0.0030, output: 0.0090 },
  'gpt-4o-mini':       { input: 0.0006, output: 0.0018 },
  'gpt-3.5-turbo':     { input: 0.0005, output: 0.0015 },
  'gemini-1.5-pro':    { input: 0.0028, output: 0.0084 },
  'gemini-1.5-flash':  { input: 0.0005, output: 0.0015 },
};

export const UK_AVERAGE_CARBON_INTENSITY = 233;

export const MODELS = Object.keys(MODEL_ENERGY_TABLE);

export function calcCarbon(
  model: string,
  inputTokens: number,
  outputTokens: number,
  carbonIntensity = UK_AVERAGE_CARBON_INTENSITY,
) {
  const e = MODEL_ENERGY_TABLE[model];
  if (!e) return { energyWh: 0, carbonGrams: 0 };
  const energyWh = (inputTokens / 1000) * e.input + (outputTokens / 1000) * e.output;
  const carbonGrams = energyWh * (carbonIntensity / 1000);
  return { energyWh, carbonGrams };
}

export function getEquivalents(carbonGrams: number) {
  return {
    drivingKm: +(carbonGrams / 170).toFixed(3),
    phonesCharged: +(carbonGrams / 8.22).toFixed(1),
    netflixMinutes: +(carbonGrams / 0.6).toFixed(0),
    kettleBoils: +(carbonGrams / 25).toFixed(3),
  };
}

export function efficiencyScore(model: string): number {
  const e = MODEL_ENERGY_TABLE[model];
  if (!e) return 0;
  const totalPer1kTokens = e.input + e.output;
  const maxEnergy = 0.014;
  return Math.round((1 - totalPer1kTokens / maxEnergy) * 100);
}

export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'claude-opus-4':     'Claude Opus 4',
  'claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'claude-haiku-4-5':  'Claude Haiku 4.5',
  'gpt-4o':            'GPT-4o',
  'gpt-4o-mini':       'GPT-4o Mini',
  'gpt-3.5-turbo':     'GPT-3.5 Turbo',
  'gemini-1.5-pro':    'Gemini 1.5 Pro',
  'gemini-1.5-flash':  'Gemini 1.5 Flash',
};

export const MODEL_COLORS: Record<string, string> = {
  'claude-opus-4':     '#ff6b6b',
  'claude-sonnet-4-6': '#ffd93d',
  'claude-haiku-4-5':  '#00ff88',
  'gpt-4o':            '#4ecdc4',
  'gpt-4o-mini':       '#00d4ff',
  'gpt-3.5-turbo':     '#a29bfe',
  'gemini-1.5-pro':    '#fd79a8',
  'gemini-1.5-flash':  '#55efc4',
};
