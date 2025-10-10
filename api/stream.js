// GET /api/stream?url=... [&itag=140]
// Streams an audio-only format by default itag priority fallback
const ytdl = require('ytdl-core');

function videoIdFrom(req) {
  if (req.query.id) return req.query.id;
  if (req.query.url) {
    try {
      return ytdl.getURLVideoID(req.query.url);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Common good audio itags prioritized (may change over time)
const PREFERRED_ITAGS = [251, 250, 250, 140, 249];

module.exports = async function (req, res) {
  try {
    const id = videoIdFrom(req);
    if (!id) {
      res.status(400).json({ error: 'Provide ?url=VIDEO_URL or ?id=VIDEO_ID' });
      return;
    }

    // Validate
    if (!(await ytdl.validateID(id))) {
      res.status(400).json({ error: 'Invalid video id' });
      return;
    }

    // Read ranges header (optional). For ytdl piping we let ytdl handle ranges.
    const itagParam = req.query.itag ? parseInt(req.query.itag, 10) : null;

    // Get info to choose format
    const info = await ytdl.getInfo(id);
    let chosenFormat;

    if (itagParam) {
      chosenFormat = info.formats.find(f => f.itag === itagParam && f.hasAudio);
    }

    if (!chosenFormat) {
      // pick first audioonly format from preferred list or fallback to top audio
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
      chosenFormat = audioFormats.find(f => PREFERRED_ITAGS.includes(f.itag)) || audioFormats[0];
    }

    if (!chosenFormat) {
      res.status(404).json({ error: 'No audio format available' });
      return;
    }

    // Set headers for streaming — content-type from chosen format if available
    const mime = chosenFormat.mimeType ? chosenFormat.mimeType.split(';')[0] : 'audio/mpeg';
    res.setHeader('Content-Type', mime);
    res.setHeader('Accept-Ranges', 'bytes');
    // Let clients and CDN cache short-term
    res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=30');

    // Use ytdl stream with the chosen format (itag)
    const stream = ytdl.downloadFromInfo(info, { quality: chosenFormat.itag, highWaterMark: 1 << 25 });

    // Handle errors
    stream.on('error', (err) => {
      console.error('stream error', err);
      try { if (!res.headersSent) res.status(500).end('Stream error'); else res.destroy(); } catch(e) {}
    });

    // Pipe to response
    stream.pipe(res);

    // Close stream if client aborts
    req.on('close', () => {
      try { stream.destroy(); } catch (e) {}
    });
  } catch (err) {
    console.error('stream endpoint err', err);
    if (!res.headersSent) res.status(500).json({ error: 'Streaming failed', details: err.message });
    else res.destroy();
  }
};