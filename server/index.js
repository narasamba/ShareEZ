const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 5001;


// ─── Directories ────────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const METADATA_FILE = path.join(__dirname, 'metadata.json');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, JSON.stringify({}));

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  exposedHeaders: ['Content-Disposition'],
}));
app.use(express.json());

// ─── Multer Storage ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ─── Helper: Load / Save Metadata ────────────────────────────────────────────
function loadMeta() {
  try {
    return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveMeta(meta) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(meta, null, 2));
}

function generate4DigitCode(existing) {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (existing[code]);
  return code;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/upload – upload a file, get a 4-digit code
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const meta = loadMeta();
  const code = generate4DigitCode(meta);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  meta[code] = {
    // Multer on Windows sometimes receives filenames in Latin-1 encoding.
    // Re-encoding from latin1→utf8 fixes garbled filenames with special chars.
    originalName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
    storedName: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    uploadedAt: Date.now(),
    expiresAt,
  };

  saveMeta(meta);

  res.json({
    code,
    originalName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
    size: req.file.size,
    expiresAt,
  });
});

// GET /api/info/:code – return file info for a code
app.get('/api/info/:code', (req, res) => {
  const meta = loadMeta();
  const entry = meta[req.params.code];

  if (!entry) return res.status(404).json({ error: 'Invalid code' });
  if (Date.now() > entry.expiresAt) return res.status(410).json({ error: 'Code expired' });

  res.json({
    originalName: entry.originalName,
    size: entry.size,
    mimetype: entry.mimetype,
    expiresAt: entry.expiresAt,
  });
});

// GET /api/download/:code – stream the file
app.get('/api/download/:code', (req, res) => {
  const meta = loadMeta();
  const entry = meta[req.params.code];

  if (!entry) return res.status(404).json({ error: 'Invalid code' });
  if (Date.now() > entry.expiresAt) return res.status(410).json({ error: 'Code expired' });

  const filePath = path.join(UPLOADS_DIR, entry.storedName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on server' });

  // res.download() sets Content-Disposition: attachment; filename="originalName"
  // This ensures the correct filename is used even for cross-origin downloads
  res.download(filePath, entry.originalName, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Failed to send file' });
    }
  });
});

// ─── Cleanup Job: every 30 minutes, delete expired files ─────────────────────
cron.schedule('*/30 * * * *', () => {
  const meta = loadMeta();
  const now = Date.now();
  let changed = false;

  for (const [code, entry] of Object.entries(meta)) {
    if (now > entry.expiresAt) {
      const filePath = path.join(UPLOADS_DIR, entry.storedName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      delete meta[code];
      changed = true;
      console.log(`[Cleanup] Deleted expired file for code ${code}`);
    }
  }

  if (changed) saveMeta(meta);
});

// ─── Production: serve built React app ──────────────────────────────────────
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  // Any route that is NOT /api/* → send the React index.html
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
  console.log('📦 Serving built React app from client/dist');
}

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ ShareEZ server running on http://localhost:${PORT}`);
});
