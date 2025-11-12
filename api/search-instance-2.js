const { setCors, performSearch, getInstanceId } = require('./shared/search-core');
const instanceId = getInstanceId('instance-1');

module.exports = async function (req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  const q = (req.query.query || '').toString().trim();
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const sortBy = (req.query.sort || '').toLowerCase();

  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    const results = await performSearch(q, limit, page, sortBy, instanceId);
    res.json({ instance: instanceId, query: q, count: results.length, results });
  } catch (err) {
    res.status(500).json({ instance: instanceId, error: err.message });
  }
};
