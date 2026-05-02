# 🚀 Running the Tata Memorial Hospital Server

## Quick Start (Easiest)

### Option 1: Using the Batch File (Windows)
1. Double-click `server.bat` 
2. The server will start automatically on `http://127.0.0.1:5000`
3. Open your browser and navigate to the address shown

### Option 2: Using Command Prompt/PowerShell
1. Open Command Prompt or PowerShell in this folder
2. Run: `npm start`
3. Server will run on `http://127.0.0.1:5000`

---

## Prerequisites

- **Node.js** installed (download from https://nodejs.org/)
- NPM (comes with Node.js)

### Install Dependencies
```bash
npm install
```

---

## Creating server.exe (Standalone Executable)

If you want a true executable file without needing Node.js installed:

### Step 1: Install pkg globally
```bash
npm install -g pkg
```

### Step 2: Build the executable
```bash
pkg server.js -o server.exe
```

### Step 3: Run the executable
Just double-click `server.exe` - no Node.js installation needed!

---

## Default Credentials

```
Admin:
  Username: admin
  Password: admin123

Users:
  Username: user1 or user2
  Password: user123
```

---

## API Endpoints

- **POST** `/api/login` - User authentication
- **GET** `/api/status` - Check server status
- **POST** `/api/upload` - Upload files
- **GET** `/api/files` - List uploaded files

---

## Troubleshooting

### "npm: command not found"
- Node.js is not installed or not in PATH
- Install from https://nodejs.org/

### "Cannot find module"
- Run `npm install` in the project folder

### Port already in use
- Change PORT in `server.js` to a different number (e.g., 5001)

---

## File Structure
```
tata-project/
├── server.js          # Main server file
├── server.bat         # Windows batch launcher
├── server.exe         # (Optional) Compiled executable
├── package.json       # Dependencies
├── my-app/            # Frontend files
│   ├── index.html
│   └── main.js
└── uploads/           # (Auto-created) Uploaded files location
```

✅ You're all set! The server is ready to run.
