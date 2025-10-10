const ytdl = require('ytdl-core');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const id = req.query.id || null;
  const url = req.query.url || (id ? `https://www.youtube.com/watch?v=${id}` : null);
  const metaOnly = req.query.meta === 'true'; // ?meta=true → get info only

  if (!url) return res.status(400).json({ error: 'Missing ?id or ?url parameter' });

  try {
    // Fetch video info
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });

    if (metaOnly) {
      // Return metadata only
      return res.json({
        id: info.videoDetails.videoId,
        title: info.videoDetails.title,
        author: info.videoDetails.author?.name,
        lengthSeconds: info.videoDetails.lengthSeconds,
        viewCount: info.videoDetails.viewCount,
        thumbnails: info.videoDetails.thumbnails,
        url: info.videoDetails.video_url,
        formats: info.formats
          .filter(f => f.mimeType?.startsWith('video/'))
          .map(f => ({
            quality: f.qualityLabel,
            mimeType: f.mimeType,
            bitrate: f.bitrate,
            url: f.url,
          })),
      });
    }

    // Stream video (optimized for browser player)
    res.writeHead(200, {
      'Content-Type': format.mimeType || 'video/mp4',
      'Cache-Control': 'no-cache',
    });

    ytdl(url, { format }).pipe(res);
  } catch (err) {
    console.error('Stream error:', err);
    res.status(500).json({ error: 'Failed to fetch or stream video', details: err.message });
  }
};
