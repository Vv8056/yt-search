// api/video-info.js
import axios from 'axios';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  origin: '*', // Allow all origins (adjust if needed)
  methods: ['GET', 'HEAD']
});

// Helper to run middleware in Vercel serverless functions
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Simple per-instance cache (resets on cold start)
const cache = new Map();

const API_BASE_URL = 'https://ytdl.socialplug.io/api/video-info';

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

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);

  const { url, id } = req.query;

  if (!url && !id) {
    return res.status(400).json({ error: 'Provide either url or id parameter' });
  }

  const videoId = extractVideoID(url || id);
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL or ID' });
  }

  // Check per-instance cache
  if (cache.has(videoId)) {
    return res.json(cache.get(videoId));
  }

  try {
    const response = await axios.get(`${API_BASE_URL}?url=https://youtu.be/${videoId}`, {
      timeout: 10000
    });

    // Cache result
    cache.set(videoId, response.data);

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching video info:', error.message);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
}
