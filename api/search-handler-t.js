// /api/search-handler.js

// ✅ CORS Helper
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ✅ Available worker instances
const INSTANCES = [
  '/api/search-instance-1',
  '/api/search-instance-2',
  '/api/search-instance-3'
];

module.exports = async function (req, res) {
  setCors(res);

  // ✅ Handle preflight
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { query, limit = 10, page = 1, sort = '' } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query parameter' });

  try {
    // ✅ Ensure base URL works both locally & on production
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.BASE_URL || 'http://localhost:3000';

    // ✅ Pick a random instance for load balancing
    const chosenInstance = INSTANCES[Math.floor(Math.random() * INSTANCES.length)];

    console.log(`⚙️ Using internal instance: ${chosenInstance}`);

    // 🧠 Use internal function call instead of network fetch
    const instanceHandler = require(`./${chosenInstance.replace('/api/', '')}`);

    const mockReq = {
      ...req,
      query: { query, limit, page, sort },
      method: 'GET',
    };

    let jsonData;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          jsonData = data;
          return mockRes;
        },
        end: () => {},
      }),
      setHeader: () => {},
      json: (data) => {
        jsonData = data;
      },
    };

    // 🧩 Call the instance function directly
    await instanceHandler(mockReq, mockRes);

    if (!jsonData) throw new Error('Instance returned no data');

    // ✅ Return final combined response
    res.status(200).json({
      success: true,
      distributed: true,
      handledBy: chosenInstance,
      internal: true,
      baseUrl,
      results: jsonData,
    });

  } catch (err) {
    console.error('❌ Handler Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Handler failed',
    });
  }
};