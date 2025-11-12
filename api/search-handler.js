const fetch = require('node-fetch');

// Simulated load balancer (random distribution)
const INSTANCES = [
  '/api/search-instance-1',
  '/api/search-instance-2',
  '/api/search-instance-3',
];

module.exports = async function (req, res) {
  const { query, limit, page, sort } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  // Pick a random instance (you could improve this with load metrics later)
  const chosen = INSTANCES[Math.floor(Math.random() * INSTANCES.length)];
  const url = `${process.env.VERCEL_URL || 'http://localhost:3000'}${chosen}?query=${encodeURIComponent(query)}&limit=${limit || 10}&page=${page || 1}&sort=${sort || ''}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    res.json({
      handledBy: chosen,
      master: true,
      data
    });
  } catch (err) {
    console.error('Handler error:', err.message);
    res.status(500).json({ error: 'Handler failed', details: err.message });
  }
};
