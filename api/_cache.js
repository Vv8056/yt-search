// Simple in-memory cache with TTL. Good for metadata caching in serverless runs
const cache = new Map();

function set(key, value, ttl = 1000 * 60 * 5) { // default 5 minutes
  const expires = Date.now() + ttl;
  cache.set(key, { value, expires });
}

function get(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function del(key) {
  cache.delete(key);
}

module.exports = { get, set, del };