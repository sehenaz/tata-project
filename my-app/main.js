const { app, BrowserWindow, Menu } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let serverProcess;

function startServer() {
  serverProcess = spawn("node", [path.join(__dirname, "server.js")], {
    cwd: __dirname,
    detached: false
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  setTimeout(() => {
   win.loadURL("http://127.0.0.1:3000/my-app/index.html"); 
  }, 3000);
}

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});