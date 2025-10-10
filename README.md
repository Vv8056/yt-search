YT Search & Stream API
======================

Files:
- api/search.js      -> GET /api/search?query=...&limit=...
- api/info.js        -> GET /api/info?url=... or ?id=...
- api/stream.js      -> GET /api/stream?url=... or ?id=... [&itag=...]

Install:
  npm install

Local dev (optional):
  npm i express
  node local-server.js
  Then open: http://localhost:3000/api/search?query=lofi

Vercel:
  1. Push repo to GitHub/GitLab/Bitbucket.
  2. Import repo to Vercel.
  3. Ensure Node 18 runtime (package.json engines set to 18.x).
  4. Deploy — endpoints are at /api/search, /api/info, /api/stream.

Notes & optimizations:
- Uses a 3-minute in-memory cache for video metadata to reduce calls.
- /api/stream selects audio-only format and pipes it directly. You can pass itag param to force a format.
- Set caching headers modestly (s-maxage for CDN); adjust as needed.
- For heavy traffic consider:
  - Adding a persistent cache (Redis) instead of in-memory (serverless instances are ephemeral).
  - Pre-generating signed, time-limited download URLs (not implemented here).
  - Respect TOS and usage limits.

Caveats for Vercel:
- Vercel serverless functions have execution time and memory limits. Long streaming sessions may be limited by platform constraints. If you expect long, high-bandwidth streams, consider using a dedicated server or edge functions that support streaming, or implement a proxy that returns location-based signed URLs.
