import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db/database.js';
import { seedIfEmpty } from './db/seed.js';
import logsRouter from './routes/logs.js';
import statsRouter from './routes/stats.js';
import carbonRouter from './routes/carbon.js';
import advisorRouter from './routes/advisor.js';
import modelsRouter from './routes/models.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json());

// Init DB and seed
initDb();
seedIfEmpty();

// Routes
app.use('/api/logs', logsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/carbon', carbonRouter);
app.use('/api/advisor', advisorRouter);
app.use('/api/models', modelsRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`🚀 EcoLLM API server running on http://localhost:${PORT}`);
});
