// GET /api/info?url=... OR /api/info?id=VIDEO_ID

// const ytdl = require('ytdl-core');
// const cache = require('./_cache');

// function videoIdFrom(req) {
//   if (req.query.id) return req.query.id;
//   if (req.query.url) {
//     try {
//       return ytdl.getURLVideoID(req.query.url);
//     } catch (e) {
//       return null;
//     }
//   }
//   return null;
// }

// module.exports = async function (req, res) {
//   try {
//     const id = videoIdFrom(req);
//     if (!id) {
//       res.status(400).json({ error: 'Provide ?url=VIDEO_URL or ?id=VIDEO_ID' });
//       return;
//     }

//     // ✅ Correct way to build cache key
//     const cacheKey = `info:${id}`;

//     const cached = cache.get(cacheKey);
//     if (cached) {
//       res.setHeader('X-Cache', 'HIT');
//       res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=30'); // 30s browser, 60s CDN
//       res.json(cached);
//       return;
//     }

//     const info = await ytdl.getInfo(id);
//     const videoDetails = info.videoDetails || {};

//     // Collect audio-only formats (useful for streaming clients)
//     const audioFormats = ytdl.filterFormats(info.formats, 'audioonly').map(f => ({
//       itag: f.itag,
//       mimeType: f.mimeType,
//       container: f.container,
//       bitrate: f.bitrate || null,
//       audioBitrate: f.audioBitrate || null,
//       approxDurationMs: f.approxDurationMs || null,
//       contentLength: f.contentLength || null,
//       qualityLabel: f.qualityLabel || null,
//       url: f.url || null
//     }));

//     const out = {
//       id: videoDetails.videoId,
//       title: videoDetails.title,
//       description: videoDetails.description,
//       lengthSeconds: parseInt(videoDetails.lengthSeconds || '0', 10),
//       viewCount: parseInt(videoDetails.viewCount || '0', 10),
//       author: videoDetails.author ? {
//         name: videoDetails.author.name,
//         channelId: videoDetails.author.id,
//         url: videoDetails.author.channel_url
//       } : null,
//       thumbnails: videoDetails.thumbnails || [],
//       audioFormats,
//       raw: {
//         formatsCount: (info.formats || []).length
//       }
//     };

//     cache.set(cacheKey, out, 1000 * 60 * 3); // 3 minute TTL
//     res.setHeader('X-Cache', 'MISS');
//     res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=30');
//     res.json(out);
//   } catch (err) {
//     console.error('info err', err);
//     res.status(500).json({ error: 'Could not get info', details: err.message });
//   }

// };

import ytdl from "ytdl-core";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Video ID is required" });

    // Build URL from videoId
    const url = `https://www.youtube.com/watch?v=${id}`;

    // Get video info
    const info = await ytdl.getInfo(url);

    const videoDetails = info.videoDetails;
    const formats = info.formats
      .filter(f => f.mimeType?.includes("audio")) // only audio formats
      .map(f => ({
        itag: f.itag,
        mimeType: f.mimeType,
        audioQuality: f.audioQuality,
        bitrate: f.bitrate,
        url: f.url
      }));

    res.status(200).json({
      title: videoDetails.title,
      videoId: videoDetails.videoId,
      url: videoDetails.video_url,
      lengthSeconds: videoDetails.lengthSeconds,
      views: videoDetails.viewCount,
      author: videoDetails.author?.name,
      thumbnails: videoDetails.thumbnails,
      formats
    });
  } catch (err) {
    res.status(500).json({ error: "Could not get info", details: err.message });
  }
}
