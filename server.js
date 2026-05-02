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
