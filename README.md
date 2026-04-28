# EcoLLM — LLM Carbon Footprint Dashboard

A production-grade web application that tracks, estimates, and visualises the carbon footprint of AI API usage across Claude, OpenAI, and Gemini models.

## Features

- **Dashboard** — Live stats, CO₂ trends, model comparison charts, recent activity
- **Log Call** — Manually log API calls with instant carbon calculation and real-world equivalents
- **Model Comparison** — Side-by-side carbon/energy efficiency comparison across all models
- **AI Advisor** — Claude Haiku analyses your usage and generates personalised optimisation recommendations
- **Live UK Carbon Intensity** — Real-time data from the National Grid ESO API
- **60-day seed data** — Dashboard is pre-populated and looks great on first load

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| AI | Anthropic Claude Haiku |
| Carbon data | UK National Grid ESO API |

## Setup

### Prerequisites
- Node.js v18+
- An Anthropic API key (only needed for the AI Advisor page)

### 1. Clone and install

```bash
git clone <repo-url>
cd ecoLLM
npm install
cd client && npm install && cd ..
```

### 2. Add your API key (optional — required for Advisor page only)

```bash
cp .env.example .env
# Edit .env and add your key:
# ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run (development)

In two terminals:

```bash
# Terminal 1 — API server (port 3001)
npm run dev:server

# Terminal 2 — Frontend (port 5174)
cd client && npm run dev
```

Or use `concurrently`:

```bash
npm run dev
```

Then open http://localhost:5174

### 4. First run

On first start the server automatically seeds the SQLite database with 733 rows of realistic demo data spanning 60 days. The dashboard will be populated immediately.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | No* | Claude API key for the AI Advisor feature |
| `PORT` | No | API server port (default: 3001) |

*The app works fully without it — only the Advisor page requires a key.

## Carbon Calculation

```
energyWh    = (inputTokens / 1000 × model.inputWh) + (outputTokens / 1000 × model.outputWh)
carbonGrams = energyWh × (carbonIntensity / 1000)
```

Carbon intensity is fetched live from the [National Grid ESO API](https://carbonintensity.org.uk) (UK, gCO₂/kWh). Falls back to 233 gCO₂/kWh (UK 2023 average) if the API is unavailable.

## References

- Patterson et al. 2021 — [Carbon and the Cloud](https://arxiv.org/abs/2104.10350)
- Luccioni et al. 2023 — [Power Hungry Processing](https://arxiv.org/abs/2311.16863)
- Samsi et al. 2023 — [Words into Watts](https://arxiv.org/abs/2310.03003)
- [National Grid ESO Carbon Intensity API](https://carbonintensity.org.uk)
