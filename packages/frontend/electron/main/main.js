import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import { promises as fs } from 'fs-extra';
import logger from '../scripts/logger.js';
import BackendManager from '../scripts/backendManager.js';
import { getMachineId, saveLicenseString, verifyLicense } from '../scripts/licenseManager.js';
import { setupAutoUpdater, checkForUpdates, startDownload } from '../scripts/autoUpdater.js';
import { autoUpdater } from 'electron-updater';

// --- المتغيرات العامة ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isDev = !app.isPackaged;

let mainWindow = null;
let activationWindow = null;
let splashWindow = null; // splash screen window
let isQuitting = false;

const backendManager = new BackendManager();

// --- منع تشغيل أكثر من نسخة ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// --- نافذة البرنامج الرئيسية ---
function createWindow() {
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 600,
    minHeight: 700,
    autoHideMenuBar: true,
    show: false,
    icon: isDev ? join(__dirname, '../../build/icon.png') : join(__dirname, '../build/icon.png'),
    webPreferences: {
      devTools: isDev,
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/preload.mjs'),
    },
  });

  // Do not automatically show the main window here; we'll control showing it
  mainWindow.once('ready-to-show', () => {
    setupAutoUpdater(mainWindow);
    // mark as ready — actual show will be handled by the startup flow when backend is ready and after the splash delay
    mainWindow.__readyToShow = true;
    tryToShowMainWindowAfterSplash();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', async () => {
    logger.info('Main window closed');
    mainWindow = null;
    await backendManager.CleanupBackendProcess();
  });

  // IPC: Install update
  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall();
  });
}

// --- نافذة التفعيل ---
function createActivationWindow() {
  if (activationWindow) return;

  activationWindow = new BrowserWindow({
    width: 550,
    height: 700,
    autoHideMenuBar: true,
    frame: true,
    show: false,
    resizable: false,
    fullscreen: false,
    fullscreenable: false,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      devTools: false, // ← أهم شيء
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/preload.mjs'),
    },
  });

  activationWindow.loadFile(
    isDev
      ? path.join(__dirname, '../../activation.html')
      : path.join(__dirname, '../dist/activation.html')
  );

  activationWindow.on('closed', () => {
    logger.info('Activation window closed');
    activationWindow = null;
  });

  activationWindow.webContents.on('before-input-event', (event, input) => {
    if (
      (input.control && input.shift && input.key.toLowerCase() === 'i') || // Ctrl+Shift+I
      input.key === 'F12' // F12
    ) {
      event.preventDefault();
    }
  });

  activationWindow.webContents.on('devtools-opened', () => {
    activationWindow.webContents.closeDevTools();
  });
}

// --- نافذة الـ Splash ---
function createSplashWindow() {
  if (splashWindow) return;

  splashWindow = new BrowserWindow({
    width: 1200,
    height: 650,
    resizable: true,
    frame: false,
    center: true,
    transparent: true,
    show: false,
    icon: isDev ? join(__dirname, '../../build/icon.png') : join(__dirname, '../build/icon.png'),
    webPreferences: {
      devTools: false, // ← أهم شيء
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/preload.mjs'),
    },
  });

  const splashPath = isDev
    ? path.join(__dirname, '../../splash.html')
    : path.join(__dirname, '../dist/splash.html');

  splashWindow.loadFile(splashPath);

  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });

  splashWindow.on('closed', () => (splashWindow = null));
}

let backendReady = false;
let showScheduled = false;

function tryToShowMainWindowAfterSplash() {
  if (!mainWindow) return;
  if (!mainWindow.__readyToShow) return;
  if (!backendReady) return;

  // Show mainWindow and hide the splash after 10 seconds
  if (showScheduled) return;
  showScheduled = true;
  setTimeout(() => {
    if (splashWindow) {
      try {
        splashWindow.destroy();
      } catch (err) {
        logger.warn('Error destroying splash window', err);
      }
      splashWindow = null;
    }

    if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
  }, 10000);
}

app.whenReady().then(async () => {
  if (isQuitting) return;

  // Create splash immediately and show it
  createSplashWindow();

  const result = await verifyLicense();

  if (result.ok) {
    createWindow();
    await backendManager.StartBackend();
    backendReady = true;
    tryToShowMainWindowAfterSplash();
  } else {
    createActivationWindow();
    // For activation window, do not show until we hide the splash to avoid two visible windows
    if (activationWindow) {
      // make sure activation window is hidden on creation; then show after splash + 10s
      activationWindow.hide();
      activationWindow.once('ready-to-show', () => {
        setTimeout(() => {
          if (splashWindow) {
            try {
              splashWindow.destroy();
            } catch (err) {
              logger.warn('Error destroying splash window', err);
            }
            splashWindow = null;
          }
          if (activationWindow && !activationWindow.isVisible()) activationWindow.show();
        }, 10000);
      });
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && !isQuitting) {
      createWindow();
    }
  });
});

// --- عند إغلاق جميع النوافذ ---
app.on('window-all-closed', async () => {
  isQuitting = true;
  await backendManager.CleanupBackendProcess();
  app.quit();
});

// --- before quit ---
app.on('before-quit', async (event) => {
  if (isQuitting) return;

  isQuitting = true;
  event.preventDefault();

  await backendManager.CleanupBackendProcess();
  app.quit();
});

// --- will quit ---
app.on('will-quit', async () => {
  await backendManager.CleanupBackendProcess();
});

// --- IPC: معلومات التطبيق ---
ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('app:getPlatform', () => process.platform);

// --- Dialog ---
ipcMain.handle('dialog:showSaveDialog', async (_e, options) =>
  dialog.showSaveDialog(mainWindow, options)
);

ipcMain.handle('dialog:showOpenDialog', async (_e, options) =>
  dialog.showOpenDialog(mainWindow, options)
);

// --- File System ---
ipcMain.handle('file:saveFile', async (_e, filePath, data) => {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  await fs.writeFile(filePath, buffer);
  return { success: true };
});

ipcMain.handle('file:readFile', async (_e, filePath) => {
  return await fs.readFile(filePath);
});

// --- التحكم في backend (يدوي فقط) ---
ipcMain.handle('backend:start', async () => {
  await backendManager.StartBackend();
  return { ok: true };
});

// --- إيقاف backend ---
ipcMain.handle('backend:stop', async () => {
  await backendManager.CleanupBackendProcess();
  return { ok: true };
});

// --- إعادة تشغيل backend ---
ipcMain.handle('backend:restart', async () => {
  await backendManager.CleanupBackendProcess();
  await backendManager.StartBackend();
  return { ok: true };
});

// --- فتح رابط خارجي ---
ipcMain.handle('shell:openExternal', async (_e, url) => {
  await shell.openExternal(url);
  return { success: true };
});

// --- License IPC ---
ipcMain.handle('license:getMachineId', () => getMachineId());

ipcMain.handle('license:activateString', async (_e, licenseString) => {
  saveLicenseString(licenseString);
  return await verifyLicense();
});

ipcMain.handle('license:activateFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'اختيار ملف التفعيل',
    filters: [{ name: 'License File', extensions: ['lic'] }],
    properties: ['openFile'],
  });

  if (canceled || !filePaths.length) return { ok: false, reason: 'no_license_file' };

  const content = (await fs.readFile(filePaths[0], 'utf8')).trim();

  saveLicenseString(content);
  return await verifyLicense();
});

ipcMain.handle('license:closeActivation', async () => {
  if (activationWindow) {
    activationWindow.close();
    activationWindow = null;
  }

  createWindow();

  if (!backendManager.isRunning()) {
    await backendManager.StartBackend();
    backendReady = true;
    tryToShowMainWindowAfterSplash();
  }

  return { ok: true };
});

ipcMain.handle('license:closeActivationWindow', async () => {
  if (activationWindow) {
    activationWindow.close();
    activationWindow = null;
  }
});

// auto width of activationWindow
ipcMain.handle('window:auto-resize', async (_e, { width, height }) => {
  if (activationWindow) {
    const newWidth = Math.ceil(width) + 20; // إضافة بعض الحشو
    const newHeight = Math.ceil(height) + 20; // إضافة بعض الحشو

    activationWindow.setSize(newWidth, newHeight);
  }
});

ipcMain.handle('update:check', () => {
  checkForUpdates(true); // ⭐ فحص يدوي فقط
});

ipcMain.handle('update:download', () => {
  startDownload();
});
