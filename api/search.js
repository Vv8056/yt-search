// GET /api/search?query=some+text&limit=10
// const ytSearch = require('yt-search');

// module.exports = async function (req, res) {
//   try {
//     const q = (req.query.query || req.query.q || '').toString().trim();
//     const limit = Math.min(50, parseInt(req.query.limit || req.query.l || '10', 10) || 10);

//     if (!q) {
//       res.status(400).json({ error: 'query parameter is required. Use ?query=...' });
//       return;
//     }

//     const r = await ytSearch(q);
//     const vids = (r.videos || []).slice(0, limit).map(v => ({
//       id: v.videoId,
//       title: v.title,
//       description: v.description,
//       timestamp: v.timestamp,
//       duration: v.duration, // human readable
//       seconds: v.seconds,
//       views: v.views,
//       author: v.author && v.author.name,
//       url: v.url,
//       thumbnail: v.thumbnail
//     }));

//     res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=30'); // CDN caching small
//     res.json({ query: q, results: vids, limit });
//   } catch (err) {
//     console.error('search err', err);
//     res.status(500).json({ error: 'Search failed', details: err.message });
//   }

// };


// GET /api/search?query=some+text&limit=10&page=1&sort=views
const ytSearch = require('yt-search');

// CORS helper (minimal and production-safe)
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function (req, res) {
  setCors(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  const send = (status, data) => res.status(status).json(data);

  const q = (req.query.query || req.query.q || '').toString().trim();
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || req.query.l || '10', 10)));
  const page = Math.max(1, parseInt(req.query.page || req.query.p || '1', 10));
  const sortBy = (req.query.sort || '').toLowerCase();

  if (!q) return send(400, { error: 'Query parameter is required. Use ?query=...' });

  const r = await ytSearch(q);
  let videos = r.videos || [];

  // Optional sorting
  if (sortBy) {
    const sorters = {
      views: (a, b) => (b.views || 0) - (a.views || 0),
      duration: (a, b) => (b.seconds || 0) - (a.seconds || 0),
      title: (a, b) => a.title.localeCompare(b.title)
    };
    if (sorters[sortBy]) videos.sort(sorters[sortBy]);
  }

  // Pagination
  const start = (page - 1) * limit;
  const paged = videos.slice(start, start + limit);

  const results = paged.map(v => ({
    id: v.videoId,
    title: v.title,
    description: v.description,
    timestamp: v.timestamp,
    duration: v.duration,
    seconds: v.seconds,
    views: v.views,
    author: v.author && v.author.name,
    url: v.url,
    thumbnail: v.thumbnail,
    uploadedAgo: v.agoMs,
  }));

  res.setHeader('Cache-Control', 'public, s-maxage=120, max-age=60');
  send(200, {
    query: q,
    totalResults: videos.length,
    page,
    limit,
    totalPages: Math.ceil(videos.length / limit),
    sortBy: sortBy || null,
    results
  });
};


