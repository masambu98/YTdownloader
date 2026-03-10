const express = require('express');
const cors = require('cors');
const path = require('path');
const { Readable } = require('stream');
const app = express();

// ─── IN-MEMORY PROGRESS STORE ──────────────────────────────────────────────
// Keyed by downloadId sent from frontend's generateId() in app.js
const progressStore = {};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const RAPID_API_KEY = 'b7ff9f02b3msh948c9a7bc6b8a92p1c6972jsn168e11c023b2';

// ─── SHARED RAPIDAPI FETCHER ───────────────────────────────────────────────
async function fetchVideoData(videoId) {
  const response = await fetch(
    `https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${videoId}`,
    {
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': 'ytstream-download-youtube-videos.p.rapidapi.com'
      }
    }
  );
  return response.json();
}

// ─── EXTRACT VIDEO ID ──────────────────────────────────────────────────────
function extractVideoId(url) {
  return url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([^&\n?#]+)/)?.[1] || null;
}

// ─── /api/info ─────────────────────────────────────────────────────────────
app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const videoId = extractVideoId(url);
  if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

  try {
    const data = await fetchVideoData(videoId);
    if (!data.title) return res.status(500).json({ error: 'Video not found', details: data });

    return res.json({
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.lengthSeconds,
      uploader: data.author,
      channel: data.author,
      formats: [...(data.formats || []), ...(data.adaptiveFormats || [])]
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch info', details: err.message });
  }
});

// ─── /api/progress/:id ─────────────────────────────────────────────────────
// app.js polls this every 1s via startProgressPolling(downloadId)
// Returns safe default instead of 404 to guard against race condition
app.get('/api/progress/:id', (req, res) => {
  const entry = progressStore[req.params.id];
  return res.json(entry || { progress: 0, status: 'preparing' });
});

// ─── /api/download ─────────────────────────────────────────────────────────
app.post('/api/download', async (req, res) => {
  const { url, format, downloadId } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const videoId = extractVideoId(url);
  if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

  // Register immediately — frontend polls right after POST fires
  if (downloadId) progressStore[downloadId] = { progress: 0, status: 'preparing' };

  try {
    if (downloadId) progressStore[downloadId] = { progress: 5, status: 'preparing' };

    const data = await fetchVideoData(videoId);

    const audioFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'opus'];
    const isAudio = audioFormats.includes(format);
    const heightMap = {
      'mp4_4k': 2160, 'mp4_1080': 1080, 'mp4_720': 720,
      'mp4_480': 480, 'mp4_360': 360, 'mp4_240': 240, 'mp4_144': 144
    };
    const height = heightMap[format] || 1080;

    const allFormats = [...(data.formats || []), ...(data.adaptiveFormats || [])];
    let downloadUrl = null;

    if (isAudio) {
      const audioItem = allFormats.find(f => f.mimeType?.includes('audio'));
      downloadUrl = audioItem?.url;
    } else {
      // ✅ FIXED: Always prefer muxed streams (video+audio combined) for playable files
      const muxedFormats = allFormats.filter(f => 
        f.mimeType?.includes('video/mp4') && 
        (f.mimeType?.includes('audio') || f.audioQuality) && 
        f.height
      );
      
      // Sort by height (quality) and find best match <= requested height
      const bestMuxed = muxedFormats
        .sort((a, b) => b.height - a.height)
        .find(f => parseInt(f.height) <= height);
      
      if (bestMuxed) {
        downloadUrl = bestMuxed.url;
      } else {
        // Fallback to any video stream (may be video-only)
        const fallback = allFormats
          .filter(f => f.mimeType?.includes('video/mp4') && f.height)
          .sort((a, b) => b.height - a.height)
          .find(f => parseInt(f.height) <= height);
        downloadUrl = fallback?.url || allFormats.find(f => f.mimeType?.includes('video/mp4'))?.url;
      }
    }

    if (!downloadUrl) return res.status(404).json({ error: 'Format not available' });

    if (downloadId) progressStore[downloadId] = { progress: 20, status: 'downloading' };

    const fileResponse = await fetch(downloadUrl);
    if (!fileResponse.ok) {
      return res.status(502).json({ error: 'Failed to fetch file from source' });
    }

    const filename = isAudio ? `audio.${format}` : `video_${height}p.mp4`;
    const contentLength = parseInt(fileResponse.headers.get('content-length') || '0');
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';

    // Guard against providers returning JSON/HTML error pages while still using 200 OK.
    // This is what typically creates tiny "MP4" files that media players cannot open.
    const isMediaType = contentType.startsWith('video/') || contentType.startsWith('audio/');
    if (!isMediaType) {
      const errorBody = await fileResponse.text().catch(() => '');
      console.error('Unexpected upstream content-type for download:', {
        contentType,
        sample: errorBody.slice(0, 300)
      });
      if (downloadId) {
        progressStore[downloadId] = { progress: 0, status: 'error' };
      }
      return res
        .status(502)
        .json({ error: 'Source returned invalid data instead of media. Please try again or change format.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // ✅ STREAM FIX: Readable.fromWeb() bridges Web Stream → Node Stream
    const nodeStream = Readable.fromWeb(fileResponse.body);
    let downloaded = 0;

    nodeStream.on('data', (chunk) => {
      downloaded += chunk.length;
      if (downloadId && contentLength) {
        const pct = Math.min(95, Math.round(20 + (downloaded / contentLength) * 75));
        progressStore[downloadId] = { progress: pct, status: 'downloading' };
      }
    });

    nodeStream.on('end', () => {
      if (downloadId) progressStore[downloadId] = { progress: 100, status: 'completed' };
    });

    nodeStream.on('error', () => {
      if (downloadId) progressStore[downloadId] = { progress: 0, status: 'error' };
    });

    nodeStream.pipe(res);

  } catch (err) {
    console.error('[/api/download]', err);
    if (downloadId) progressStore[downloadId] = { progress: 0, status: 'error' };
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Download failed', details: err.message });
    }
  }
});

// ─── /api/formats (DEBUG) ───────────────────────────────────────────────────
app.post('/api/formats', async (req, res) => {
  const { url } = req.body;
  const videoId = extractVideoId(url);
  const data = await fetchVideoData(videoId);
  const all = [...(data.formats || []), ...(data.adaptiveFormats || [])];
  res.json(all.map(f => ({
    itag: f.itag,
    mimeType: f.mimeType,
    height: f.height,
    hasAudio: f.mimeType?.includes('audio') || !!f.audioQuality,
    audioQuality: f.audioQuality,
    quality: f.qualityLabel
  })));
});

// ─── /debug ────────────────────────────────────────────────────────────────
app.get('/debug', async (req, res) => {
  try {
    const data = await fetchVideoData('jNQXAC9IVRw');
    const all = [...(data.formats || []), ...(data.adaptiveFormats || [])];
    const muxedFormats = all.filter(f => 
      f.mimeType?.includes('video/mp4') && 
      (f.mimeType?.includes('audio') || f.audioQuality) && 
      f.height
    );
    return res.json({
      hasTitle: !!data.title,
      title: data.title || null,
      totalFormats: all.length,
      muxedFormats: muxedFormats.length,
      muxedQualities: muxedFormats.map(f => `${f.height}p (${f.qualityLabel})`),
      raw: data.title ? '✅ WORKING' : JSON.stringify(data).slice(0, 300)
    });
  } catch (err) {
    return res.json({ ok: false, error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
