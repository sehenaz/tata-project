<<<<<<< HEAD
﻿const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

function startServer() {
  try {
    require("./server.js");
    console.log("Server started!");
  } catch (err) {
    console.error("Server error:", err);
  }
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
  app.quit();
});
=======
const {app,BrowserWindow} = require('electron');

function createWindow(){

const win = new BrowserWindow({
width:1200,
height:800
});

win.loadURL("http://localhost:3000");

}

app.whenReady().then(createWindow);
>>>>>>> 9e87fc9764fb33a127c3ce98656d272de3028189
