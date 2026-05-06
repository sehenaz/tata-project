/**
 * ═══════════════════════════════════════════════════════════════
 *   TATA MEMORIAL HOSPITAL – PDF Utility Tool – CENTRAL SERVER
 *   Run this on ONE computer. All other PCs connect via LAN IP.
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;

// ── Data directory (same folder as server.exe / server.js) ──
const DATA_DIR = path.join(process.execPath ? path.dirname(process.execPath) : __dirname, 'tmh_data');
const UPLOADS_META_FILE = path.join(DATA_DIR, 'uploads_meta.json');
const USERS_FILE        = path.join(DATA_DIR, 'users.json');
const PDFS_DIR          = path.join(DATA_DIR, 'pdfs');

// Create dirs if missing
[DATA_DIR, PDFS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── Default data ──
const DEFAULT_USERS = {
  admin: { password: 'admin123', role: 'admin', enabled: true, displayName: 'Admin' },
  user1: { password: 'user123',  role: 'user',  enabled: true, displayName: 'User One' },
  user2: { password: 'user123',  role: 'user',  enabled: true, displayName: 'User Two' }
};

// Init files if not present
if (!fs.existsSync(UPLOADS_META_FILE)) fs.writeFileSync(UPLOADS_META_FILE, '[]');
if (!fs.existsSync(USERS_FILE))        fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2));

// ── Helpers ──
function readUploads() {
  try { return JSON.parse(fs.readFileSync(UPLOADS_META_FILE, 'utf8')) || []; } catch { return []; }
}
function saveUploads(data) {
  fs.writeFileSync(UPLOADS_META_FILE, JSON.stringify(data, null, 2));
}
function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || DEFAULT_USERS; } catch { return DEFAULT_USERS; }
}
function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'TMH PDF Utility Server', time: new Date().toISOString() });
});

// ── LOGIN ──
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
  const users = readUsers();
  const user = users[username];
  if (!user) return res.status(401).json({ error: 'User not found' });
  if (user.password !== password) return res.status(401).json({ error: 'Wrong password' });
  if (user.role !== role) return res.status(401).json({ error: `This account is not a ${role}` });
  if (!user.enabled && role !== 'admin') return res.status(401).json({ error: 'Account disabled' });
  res.json({ role: user.role, displayName: user.displayName, enabled: user.enabled });
});

// ── GET ALL DATA ──
app.get('/api/data', (req, res) => {
  res.json({ uploads: readUploads(), users: readUsers() });
});

// ── SYNC UPLOADS METADATA ──
app.post('/api/sync-uploads', (req, res) => {
  const { uploads: incoming = [] } = req.body;
  let stored = readUploads();

  // Merge: keep stored records, add any new from client
  const storedIds = new Set(stored.map(u => u.id));
  incoming.forEach(u => {
    if (!storedIds.has(u.id)) {
      stored.push(u);
      storedIds.add(u.id);
    } else {
      // Update metadata (not pdfData which is stored separately)
      const idx = stored.findIndex(s => s.id === u.id);
      if (idx !== -1) stored[idx] = { ...stored[idx], ...u };
    }
  });

  saveUploads(stored);
  res.json({ uploads: stored });
});

// ── SAVE PDF DATA ──
app.post('/api/save-pdf', (req, res) => {
  const { id, pdfData, fileName } = req.body;
  if (!id || !pdfData) return res.status(400).json({ error: 'Missing id or pdfData' });

  const pdfFile = path.join(PDFS_DIR, `${id}.b64`);
  fs.writeFileSync(pdfFile, pdfData);

  // Also ensure metadata exists
  let stored = readUploads();
  const existing = stored.find(u => u.id === id);
  if (!existing) {
    stored.push({ id, fileName: fileName || id, uploadDateTime: new Date().toISOString() });
    saveUploads(stored);
  }

  console.log(`[PDF SAVED] ${fileName} (${id})`);
  res.json({ success: true });
});

// ── GET PDF DATA ──
app.get('/api/get-pdf/:id', (req, res) => {
  const { id } = req.params;
  const pdfFile = path.join(PDFS_DIR, `${id}.b64`);
  if (!fs.existsSync(pdfFile)) return res.status(404).json({ error: 'PDF not found' });
  const pdfData = fs.readFileSync(pdfFile, 'utf8');
  res.json({ pdfData });
});

// ── SAVE USERS ──
app.post('/api/save-users', (req, res) => {
  try { saveUsers(req.body); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE UPLOAD ──
app.post('/api/delete-upload', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  let stored = readUploads();
  stored = stored.filter(u => u.id !== id);
  saveUploads(stored);

  const pdfFile = path.join(PDFS_DIR, `${id}.b64`);
  if (fs.existsSync(pdfFile)) fs.unlinkSync(pdfFile);

  console.log(`[DELETED] Upload ${id}`);
  res.json({ success: true });
});

// ── Serve the HTML app itself ──
app.get('/', (req, res) => {
  const htmlFile = path.join(__dirname, 'TMH_PDF_Tool.html');
  if (fs.existsSync(htmlFile)) {
    // Inject auto-connect script
    let html = fs.readFileSync(htmlFile, 'utf8');
    const serverOrigin = req.protocol + '://' + req.hostname + ':' + PORT;
    const inject = `<script>
      // Auto-connect to this server
      if(!localStorage.getItem('mv_server_url')) {
        localStorage.setItem('mv_server_url', '' + serverOrigin + '');
      }
    </script>`;
    html = html.replace('</head>', inject + '</head>');
    res.send(html);
  } else {
    // Redirect to download page
    res.send(`<html><body style="font-family:Arial;background:#1a3a6e;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center">
      <div>
        <h2>✅ TMH Server is Running!</h2>
        <p>Server IP: <b style="color:#93c5fd">' + req.hostname + ':' + PORT + '</b></p>
        <p style="color:#fbbf24">⚠️ Place <b>TMH_PDF_Tool.html</b> in the same folder as server.js</p>
        <p style="font-size:13px;color:#93c5fd">Then refresh this page to open the app.</p>
      </div>
    </body></html>`);
  }
});

// ── START ──
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   TATA MEMORIAL HOSPITAL – PDF Utility Server        ║');
  console.log('╠══════════════════════════════════════════════════════╣');

  // Get all local IPs
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }

  console.log(`║  Server running on port: ${PORT}                       ║`);
  console.log('║                                                      ║');
  console.log('║  THIS COMPUTER\'s IPs (use any in the HTML app):     ║');
  ips.forEach(ip => {
    const padded = ip.padEnd(20);
    console.log(`║    👉  ${padded}                             ║`);
  });
  console.log('║                                                      ║');
  console.log('║  Data stored in: tmh_data/ folder (same directory)  ║');
  console.log('║                                                      ║');
  console.log('║  ⚠️  Keep this window OPEN while using the app!      ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server stopped] Data has been saved safely.\n');
  process.exit(0);
});
