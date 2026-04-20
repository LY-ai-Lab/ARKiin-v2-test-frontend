const express = require('express');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'https://arkiin-api-189193911117.europe-west3.run.app';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check for Hostinger
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', service: 'arkiin-v2-test-frontend', timestamp: new Date().toISOString() });
});

// Proxy endpoint - avoids CORS issues in production
app.get('/api/proxy/*', async (req, res) => {
  const endpoint = req.params[0];
  const query = req.url.includes('?') ? req.url.split('?')[1] : '';
  const targetUrl = `${BACKEND_URL}/${endpoint}${query ? '?' + query : ''}`;
  try {
    const t0 = Date.now();
    const response = await fetch(targetUrl, {
      headers: { 'Accept': 'application/json' },
      timeout: 10000
    });
    const latency = Date.now() - t0;
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(response.status).json({ ...data, _meta: { status: response.status, latency, url: targetUrl } });
  } catch (err) {
    res.status(503).json({ error: err.message, url: targetUrl });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ARKiin v2 Test Frontend running on port ${PORT}`);
  console.log(`Backend: ${BACKEND_URL}`);
});
