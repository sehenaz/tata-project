<<<<<<< HEAD
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ extended: true, limit: '2gb' }));

// ==================== CREATE DIRECTORIES ====================
const UPLOAD_DIR = path.join(__dirname, 'pdf_uploads');
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ==================== MULTER CONFIG - NO SIZE LIMIT ====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '.pdf');
    }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

// ==================== JSON DATABASE ====================
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const UPLOADS_FILE = path.join(DATA_DIR, 'uploads.json');

function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }
    } catch (e) {}
    
    const defaultUsers = {
        admin: { password: bcrypt.hashSync('admin123', 10), role: 'admin', enabled: true, displayName: 'Administrator' },
        user1: { password: bcrypt.hashSync('user123', 10), role: 'user', enabled: true, displayName: 'User One' },
        user2: { password: bcrypt.hashSync('user123', 10), role: 'user', enabled: true, displayName: 'User Two' }
    };
    saveUsers(defaultUsers);
    return defaultUsers;
}

function saveUsers(users) {
    const toSave = {};
    for (const [key, value] of Object.entries(users)) {
        toSave[key] = { ...value };
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(toSave, null, 2));
}

function loadUploads() {
    try {
        if (fs.existsSync(UPLOADS_FILE)) {
            return JSON.parse(fs.readFileSync(UPLOADS_FILE, 'utf8'));
        }
    } catch (e) {}
    return [];
}

function saveUploads(uploads) {
    fs.writeFileSync(UPLOADS_FILE, JSON.stringify(uploads, null, 2));
}

let USERS = loadUsers();
let uploads = loadUploads();

// ==================== SERVE STATIC FILES ====================
app.use(express.static(__dirname));
app.use('/my-app', express.static(path.join(__dirname, 'my-app')));

// ==================== API ENDPOINTS ====================

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/login', (req, res) => {
    const { username, password, role } = req.body;
    const user = USERS[username];
    
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid password' });
    if (user.role !== role) return res.status(401).json({ error: `This account is not a ${role}` });
    if (!user.enabled && role !== 'admin') return res.status(401).json({ error: 'Account disabled' });
    
    res.json({ username, role: user.role, enabled: user.enabled, displayName: user.displayName });
});

app.get('/api/data', (req, res) => {
    const safeUploads = uploads.map(u => ({
        id: u.id, userId: u.userId, fileName: u.fileName, fileSize: u.fileSize,
        pages: u.pages, uploadDate: u.uploadDate, uploadTime: u.uploadTime,
        uploadDateTime: u.uploadDateTime, pdfData: null
    }));
    
    const safeUsers = {};
    for (const [key, value] of Object.entries(USERS)) {
        safeUsers[key] = { password: '***', displayName: value.displayName, role: value.role, enabled: value.enabled };
    }
    
    res.json({ uploads: safeUploads, users: safeUsers });
});

app.get('/api/get-pdf/:id', (req, res) => {
    const upload = uploads.find(u => u.id === req.params.id);
    if (!upload) return res.status(404).json({ error: 'PDF not found' });
    
    if (upload.filePath && fs.existsSync(upload.filePath)) {
        const pdfBuffer = fs.readFileSync(upload.filePath);
        res.json({ pdfData: pdfBuffer.toString('base64') });
    } else {
        res.status(404).json({ error: 'PDF file not found' });
    }
});

app.post('/api/upload-pdf', upload.single('pdf'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const { id, userId, fileName, fileSize, pages, uploadDate, uploadTime, uploadDateTime } = req.body;
    
    uploads.push({
        id, userId, fileName, fileSize: parseInt(fileSize), pages: parseInt(pages),
        uploadDate, uploadTime, uploadDateTime, filePath: req.file.path
    });
    saveUploads(uploads);
    
    console.log(`✅ Uploaded: ${fileName} by ${userId}`);
    res.json({ success: true, id });
});

app.post('/api/sync-uploads', (req, res) => {
    const { uploads: clientUploads } = req.body;
    const existingIds = new Set(uploads.map(u => u.id));
    
    for (const upload of clientUploads) {
        if (!existingIds.has(upload.id)) {
            uploads.push(upload);
        }
    }
    saveUploads(uploads);
    res.json({ success: true, uploads: uploads.map(u => ({ ...u, pdfData: null })) });
});

app.post('/api/save-pdf', (req, res) => {
    const { id, pdfData } = req.body;
    if (!pdfData) return res.status(400).json({ error: 'No PDF data' });
    
    const filePath = path.join(UPLOAD_DIR, `${id}.pdf`);
    fs.writeFileSync(filePath, Buffer.from(pdfData, 'base64'));
    
    const upload = uploads.find(u => u.id === id);
    if (upload) upload.filePath = filePath;
    saveUploads(uploads);
    res.json({ success: true });
});

app.post('/api/delete-upload', (req, res) => {
    const { id } = req.body;
    const upload = uploads.find(u => u.id === id);
    
    if (upload && upload.filePath && fs.existsSync(upload.filePath)) {
        fs.unlinkSync(upload.filePath);
    }
    
    uploads = uploads.filter(u => u.id !== id);
    saveUploads(uploads);
    res.json({ success: true });
});

app.post('/api/save-users', (req, res) => {
    const newUsers = req.body;
    for (const [username, userData] of Object.entries(newUsers)) {
        if (USERS[username]) {
            USERS[username].displayName = userData.displayName;
            USERS[username].role = userData.role;
            USERS[username].enabled = userData.enabled;
            if (userData.password && userData.password !== '***') {
                USERS[username].password = bcrypt.hashSync(userData.password, 10);
            }
        }
    }
    saveUsers(USERS);
    res.json({ success: true });
});

function getLocalIp() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) return net.address;
        }
    }
    return 'localhost';
}
app.get('/', (req, res) => {
   res.send('Tata HRMS Server Running Successfully');
});

app.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIp();
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║     🚀 TMH PDF UTILITY SERVER STARTED                    ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  📍 Local Access:    http://localhost:${PORT}              ║`);
    console.log(`║  🌐 Network Access:  http://${localIp}:${PORT}              ║`);
    console.log(`║  🔐 Admin: admin / admin123                               ║`);
    console.log(`║  👤 Users: user1/user123, user2/user123                   ║`);
    console.log(`║  📁 Uploads: ${UPLOAD_DIR}                                  ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);
});
=======
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'my-app')));

// Sample user database (in production, use a real database)
const users = {
  'admin': 'admin123',
  'user1': 'user123',
  'user2': 'user123'
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'my-app', 'index.html'));
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password are required' 
    });
  }

  if (users[username] && users[username] === password) {
    return res.json({ 
      success: true, 
      message: 'Login successful',
      user: username,
      role: username === 'admin' ? 'Administrator' : 'User'
    });
  }

  res.status(401).json({ 
    success: false, 
    message: 'Invalid username or password' 
  });
});

// Server status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// File upload endpoint
app.post('/api/upload', (req, res) => {
  const { filename, filedata } = req.body;

  if (!filename || !filedata) {
    return res.status(400).json({ 
      success: false, 
      message: 'Filename and file data are required' 
    });
  }

  try {
    // Save uploaded file to uploads folder
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(filedata, 'base64');
    fs.writeFileSync(filePath, buffer);

    res.json({ 
      success: true, 
      message: 'File uploaded successfully',
      filename: filename,
      size: buffer.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading file: ' + error.message 
    });
  }
});

// Get uploaded files list
app.get('/api/files', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ success: true, files: [] });
    }

    const files = fs.readdirSync(uploadsDir).map(file => ({
      name: file,
      size: fs.statSync(path.join(uploadsDir, file)).size
    }));

    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error reading files: ' + error.message 
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`
╔════════════════════════════════════════════╗
║  Tata Memorial Hospital Server Running    ║
╚════════════════════════════════════════════╝
  
  📍 Server Address: http://127.0.0.1:${PORT}
  ⏰ Started: ${new Date().toLocaleString()}
  
  🔐 Default Credentials:
     Admin: admin / admin123
     User:  user1 or user2 / user123
  
  ✅ Server is ready to accept connections!
  
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✋ Shutting down server...');
  process.exit(0);
});
>>>>>>> 9e87fc9764fb33a127c3ce98656d272de3028189
