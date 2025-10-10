// GET /api/search?query=some+text&limit=10
const ytSearch = require('yt-search');

module.exports = async function (req, res) {
  try {
    const q = (req.query.query || req.query.q || '').toString().trim();
    const limit = Math.min(50, parseInt(req.query.limit || req.query.l || '10', 10) || 10);

    if (!q) {
      res.status(400).json({ error: 'query parameter is required. Use ?query=...' });
      return;
    }

    const r = await ytSearch(q);
    const vids = (r.videos || []).slice(0, limit).map(v => ({
      id: v.videoId,
      title: v.title,
      description: v.description,
      timestamp: v.timestamp,
      duration: v.duration, // human readable
      seconds: v.seconds,
      views: v.views,
      author: v.author && v.author.name,
      url: v.url,
      thumbnail: v.thumbnail
    }));

    res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=30'); // CDN caching small
    res.json({ query: q, results: vids, limit });
  } catch (err) {
    console.error('search err', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
};