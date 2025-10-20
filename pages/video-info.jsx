import { useState } from "react";
import { motion } from "framer-motion";

export default function VideoInfoPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function fetchInfo() {
    setError("");
    setData(null);
    if (!input.trim()) {
      setError("Please enter a YouTube URL or video ID.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://yt-search.vercel.app/api/video-info?url=${encodeURIComponent(input)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch video info");
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center px-4 py-12">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-6 text-center"
      >
        🎬 YouTube Video Info
      </motion.h1>

      <div className="w-full max-w-lg bg-gray-800/60 p-6 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Enter YouTube URL or video ID..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow p-3 rounded-xl bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
          />
          <button
            onClick={fetchInfo}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition font-semibold disabled:opacity-60"
          >
            {loading ? "Loading..." : "Get Info"}
          </button>
        </div>

        {error && <p className="text-red-400 mt-4 text-sm text-center">{error}</p>}
      </div>

      {data && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl mt-10 bg-gray-800/70 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row gap-6">
            <img
              src={data.thumbnail || ""}
              alt={data.title || "thumbnail"}
              className="w-full sm:w-64 rounded-xl shadow-md"
            />
            <div className="flex-1 space-y-3">
              <h2 className="text-2xl font-bold">{data.title}</h2>
              <p className="text-sm text-gray-400">by {data.author?.name || "Unknown"}</p>
              <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                {data.duration && (
                  <span className="bg-gray-700 px-3 py-1 rounded-full">⏱ {data.duration}</span>
                )}
                {data.views && (
                  <span className="bg-gray-700 px-3 py-1 rounded-full">
                    👁 {data.views.toLocaleString()} views
                  </span>
                )}
                {data.uploadDate && (
                  <span className="bg-gray-700 px-3 py-1 rounded-full">
                    📅 {data.uploadDate}
                  </span>
                )}
              </div>
              {data.description && (
                <p className="text-gray-300 text-sm whitespace-pre-line">
                  {data.description.length > 250
                    ? data.description.slice(0, 250) + "..."
                    : data.description}
                </p>
              )}
              <a
                href={data.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 font-semibold text-white transition"
              >
                Watch on YouTube
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
