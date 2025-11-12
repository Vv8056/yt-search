// const fetch = require('node-fetch');

// // Lightweight CORS helper
// function setCors(res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
// }

// // List of available search instances
// const INSTANCES = [
//   '/api/search-instance-1',
//   '/api/search-instance-2',
//   '/api/search-instance-3',
// ];

// module.exports = async function (req, res) {
//   setCors(res);

//   if (req.method === 'OPTIONS') return res.status(204).end();

//   const { query, limit = 10, page = 1, sort = '' } = req.query;
//   if (!query) return res.status(400).json({ error: 'Missing query parameter' });

//   // Build base URL correctly for local or production
//   const baseUrl =
//     process.env.VERCEL_ENV === 'production'
//       ? `https://${process.env.VERCEL_URL}`
//       : 'http://localhost:3000';

//   // Randomly pick an instance
//   const pickRandomInstance = () => INSTANCES[Math.floor(Math.random() * INSTANCES.length)];

//   // Try up to 3 times in case one instance fails
//   let lastError = null;

//   for (let attempt = 0; attempt < INSTANCES.length; attempt++) {
//     const chosen = pickRandomInstance();
//     const url = `${baseUrl}${chosen}?query=${encodeURIComponent(query)}&limit=${limit}&page=${page}&sort=${sort}`;

//     try {
//       const response = await fetch(url);
//       if (!response.ok) throw new Error(`Instance ${chosen} returned ${response.status}`);
//       const data = await response.json();

//       return res.json({
//         handledBy: chosen,
//         baseUrl,
//         master: true,
//         data,
//       });
//     } catch (err) {
//       console.error(`⚠️ Instance failed: ${err.message}`);
//       lastError = err;
//     }
//   }

//   // If all instances failed
//   res.status(500).json({
//     error: 'All instances failed to respond',
//     details: lastError?.message,
//   });
// };



// /api/search-handler.js

// Lazy dynamic import of node-fetch (compatible with Node 22 on Vercel)
const fetchFn = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// CORS helper
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Available worker instances
const INSTANCES = [
  '/api/search-instance-1',
  '/api/search-instance-2',
  '/api/search-instance-3'
];

module.exports = async function (req, res) {
  try {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(204).end();

    const { query, limit = 10, page = 1, sort = '' } = req.query;
    if (!query) return res.status(400).json({ error: 'Missing query parameter' });

    // ✅ Ensure we have a proper base URL
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // ✅ Pick random worker
    const chosen = INSTANCES[Math.floor(Math.random() * INSTANCES.length)];
    const targetUrl = `${baseUrl}${chosen}?query=${encodeURIComponent(query)}&limit=${limit}&page=${page}&sort=${sort}`;

    console.log('🔁 Forwarding search to:', targetUrl);

    // ✅ Use dynamic fetch (fix for node-fetch@3)
    const response = await fetchFn(targetUrl);

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`);
    }

    const data = await response.json();

    res.status(200).json({
      master: true,
      handledBy: chosen,
      baseUrl,
      data
    });
  } catch (err) {
    console.error('❌ Handler error:', err);
    res.status(500).json({
      error: 'Handler failed',
      message: err.message || 'Unknown error'
    });
  }
};
