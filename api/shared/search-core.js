const ytSearch = require('yt-search');
const os = require('os');

// Basic CORS helper
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Instance identity (helps you know which handled the request)
function getInstanceId(label = '') {
  return `${os.hostname()}-${label}-${Math.random().toString(36).slice(2, 6)}`;
}

// Core search function
async function performSearch(q, limit, page, sortBy, instanceId) {
  const r = await ytSearch(q);
  let videos = r.videos || [];

  // Sorting
  if (sortBy) {
    const sorters = {
      views: (a, b) => (b.views || 0) - (a.views || 0),
      duration: (a, b) => (b.seconds || 0) - (a.seconds || 0),
      title: (a, b) => a.title.localeCompare(b.title),
    };
    if (sorters[sortBy]) videos.sort(sorters[sortBy]);
  }

  // Pagination
  const start = (page - 1) * limit;
  const paged = videos.slice(start, start + limit);

  return paged.map(v => ({
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
    uploadDate: v.ago,
    handledBy: instanceId
  }));
}

module.exports = { setCors, performSearch, getInstanceId };
