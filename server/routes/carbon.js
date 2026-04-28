import { Router } from 'express';

const router = Router();

let cache = { data: null, fetchedAt: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GET /api/carbon/live
router.get('/live', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && (now - cache.fetchedAt) < CACHE_TTL) {
      return res.json({ ...cache.data, cached: true });
    }

    const response = await fetch('https://api.carbonintensity.org.uk/intensity', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`Carbon API returned ${response.status}`);

    const json = await response.json();
    const entry = json?.data?.[0];

    if (!entry) throw new Error('Unexpected API response shape');

    const data = {
      intensity: entry.intensity?.actual ?? entry.intensity?.forecast ?? 233,
      forecast: entry.intensity?.forecast ?? 233,
      index: entry.intensity?.index ?? 'moderate',
      from: entry.from,
      to: entry.to,
    };

    cache = { data, fetchedAt: now };
    res.json({ ...data, cached: false });
  } catch (err) {
    // Return fallback so the UI still works
    res.json({
      intensity: 233,
      forecast: 233,
      index: 'moderate',
      from: new Date().toISOString(),
      to: new Date().toISOString(),
      cached: false,
      fallback: true,
      error: err.message,
    });
  }
});

export default router;
