import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let splashWindow;
let serverProcess;

function startBackend() {
  const isDev = !app.isPackaged;

  const desktopLog = path.join(os.homedir(), 'Desktop', 'nexopos-debug-log.txt');
  const writeLog = (text) => {
    try {
      fs.appendFileSync(desktopLog, `[${new Date().toLocaleTimeString()}] ${text}\n`);
    } catch (e) {}
  };

  const backendDir = isDev
    ? path.join(__dirname, 'backend')
    : path.join(app.getAppPath(), 'backend');

  const backendScript = path.join(backendDir, 'src', 'server.js');

  const dbDataDir = isDev
    ? path.join(__dirname, 'backend')
    : path.join(app.getPath('userData'), 'data');

  if (!fs.existsSync(dbDataDir)) {
    fs.mkdirSync(dbDataDir, { recursive: true });
  }

  writeLog(`Lanzando backend en: ${backendScript}`);

  try {
    const envVars = {
      ...process.env,
      PORT: '4000',
      NODE_ENV: isDev ? 'development' : 'production',
      DB_PATH: dbDataDir,
      ELECTRON_RUN_AS_NODE: '1'
    };

    serverProcess = spawn(process.execPath, [backendScript], {
      cwd: backendDir,
      env: envVars,
      windowsHide: true
    });

    serverProcess.stdout.on('data', (data) => {
      writeLog(`[BACKEND STDOUT]: ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (data) => {
      writeLog(`[BACKEND STDERR]: ${data.toString().trim()}`);
    });

    serverProcess.on('error', (err) => {
      writeLog(`[ERROR SPAWN]: ${err.message}`);
    });
  } catch (err) {
    writeLog(`[EXCEPCION]: ${err.message}`);
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 380,
    height: 240,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 700,
    title: 'NexoPOS',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createSplashWindow();
  startBackend();
  setTimeout(createWindow, 1500);
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});