// api/video-info.js
// GET /api/video-info?url=https://youtu.be/xxxxxxx OR ?id=xxxxxxx

const axios = require('axios');

// Minimal production-safe CORS helper
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const API_BASE_URL = 'https://ytdl.socialplug.io/api/video-info';

// Extract a valid YouTube video ID from URL or raw ID
function extractVideoID(urlOrId) {
  try {
    if (/^[\w-]{11}$/.test(urlOrId)) return urlOrId;

    const url = new URL(urlOrId);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1);
    } else if (url.hostname.includes('youtube.com')) {
      return url.searchParams.get('v');
    }
    return null;
  } catch {
    return null;
  }
}

// Simple in-memory cache (resets on Vercel cold start)
const cache = new Map();

module.exports = async function (req, res) {
  setCors(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const send = (status, data) => res.status(status).json(data);

  const urlParam = req.query.url;
  const idParam = req.query.id;

  if (!urlParam && !idParam) {
    return send(400, { error: 'Provide either ?url= or ?id= parameter' });
  }

  const videoId = extractVideoID(urlParam || idParam);
  if (!videoId) {
    return send(400, { error: 'Invalid YouTube URL or ID' });
  }

  // Cache check
  if (cache.has(videoId)) {
    return send(200, cache.get(videoId));
  }

  try {
    const apiUrl = `${API_BASE_URL}?url=https://youtu.be/${videoId}`;
    const response = await axios.get(apiUrl, { timeout: 10000 });

    const data = response.data;
    cache.set(videoId, data);

    // Short-term CDN caching
    res.setHeader('Cache-Control', 'public, s-maxage=300, max-age=120');

    send(200, data);
  } catch (error) {
    console.error('Error fetching video info:', error.message);
    send(500, { error: 'Failed to fetch video info' });
  }
};
