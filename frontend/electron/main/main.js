import { fileURLToPath } from 'node:url';
import path, { dirname, join } from 'node:path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
global.__dirname = __dirname;
global.__filename = __filename;

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { promises as fs } from 'fs-extra';
import logger from '../scripts/logger.js';
import BackendManager from '../scripts/backendManager.js';
import { getMachineId, saveLicenseString, verifyLicense } from '../scripts/licenseManager.js';
import { setupAutoUpdater, checkForUpdates, startDownload } from '../scripts/autoUpdater.js';
import { autoUpdater } from 'electron-updater';
import { createLockFile } from '../scripts/firstRun.js';
import { generateReceiptHtml, generateReceiptBodyHtml, getReceiptStyles } from '../scripts/receiptBuilder.js';

// --- المتغيرات العامة ---
const isDev = !app.isPackaged;

let mainWindow = null;
let activationWindow = null;
let splashWindow = null; // splash screen window
let isQuitting = false;
let backendReady = false;
let splashTimeout = null; // timeout for showing main window after splash

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

  // Add error handlers for debugging
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logger.error(`Main window failed to load: ${errorCode} - ${errorDescription} - ${validatedURL}`);
    // Path resolution is handled in the main load logic above
  });

  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('Main window finished loading');
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Try multiple path resolution strategies for production
    // Note: In packaged apps, extraResources are in process.resourcesPath, not app.asar
    const tryLoadIndex = async () => {
      // Strategy 1: Try resources path first (for extraResources - most reliable in packaged apps)
      try {
        const resourcesPath = process.resourcesPath;
        const indexPath = path.join(resourcesPath, 'dist-electron', 'dist', 'index.html');
        logger.info(`Trying to load from resources path: ${indexPath}`);
        await mainWindow.loadFile(indexPath);
        logger.info('Successfully loaded from resources path');
        return;
      } catch (err) {
        logger.warn(`Failed to load from resources path: ${err.message}`);
      }

      // Strategy 2: Relative path from main.js location (works if files are in app.asar)
      try {
        const relativePath = path.join(__dirname, '../../dist/index.html');
        logger.info(`Trying to load from relative path: ${relativePath}`);
        await mainWindow.loadFile(relativePath);
        logger.info('Successfully loaded from relative path');
        return;
      } catch (err) {
        logger.warn(`Failed to load from relative path: ${err.message}`);
      }

      // Strategy 3: Using app.getAppPath() (for unpacked apps)
      let lastError;
      try {
        const appPath = app.getAppPath();
        const indexPath = path.join(appPath, 'dist-electron', 'dist', 'index.html');
        logger.info(`Trying to load from app path: ${indexPath}`);
        await mainWindow.loadFile(indexPath);
        logger.info('Successfully loaded from app path');
        return;
      } catch (err) {
        lastError = err;
        logger.warn(`Failed to load from app path: ${err.message}`);
      }

      // All strategies failed
      logger.error(`All path resolution strategies failed. Last error: ${lastError?.message || 'unknown'}`);
      throw new Error('Failed to locate index.html file');
    };

    tryLoadIndex().catch((err) => {
      logger.error(`Failed to load index.html after all attempts: ${err.message}`);
    });
  }

  // Handle window close with confirmation
  mainWindow.on('close', async (event) => {
    // If already quitting (user confirmed), allow close
    if (isQuitting) {
      return;
    }

    // Prevent default close behavior
    event.preventDefault();

    // Show confirmation dialog
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['إلغاء', 'إغلاق'],
      defaultId: 0, // Cancel is default
      cancelId: 0,
      title: 'تأكيد الإغلاق',
      message: 'هل أنت متأكد من إغلاق التطبيق؟',
      detail: 'قد يكون الإغلاق عن طريق الخطأ. هل تريد المتابعة؟',
      noLink: true,
    });

    // If user clicked "إغلاق" (Close), proceed with quit
    if (response === 1) {
      isQuitting = true;
      await backendManager.CleanupBackendProcess();
      // Close the window (this will trigger the 'closed' event)
      mainWindow.close();
    }
    // If user clicked "إلغاء" (Cancel), do nothing - window stays open
  });

  mainWindow.on('closed', async () => {
    logger.info('Main window closed');
    mainWindow = null;
    await backendManager.CleanupBackendProcess();
  });

  // IPC: Install update
  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle('getPrinters', async () => {
    try {
      // Try to get printers from main window first
      let targetWindow = mainWindow;
      
      // If main window is not available, try to get any available window
      if (!targetWindow || targetWindow.isDestroyed()) {
        const allWindows = BrowserWindow.getAllWindows();
        if (allWindows.length > 0) {
          targetWindow = allWindows[0];
        } else {
          logger.warn('No windows available for getting printers');
          return [];
        }
      }

      // Ensure webContents is ready
      if (!targetWindow.webContents) {
        logger.warn('WebContents not available');
        return [];
      }

      // Ensure the window is ready - getPrinters() might need the window to be shown
      // Try to get printers - this is a synchronous method
      let printers;
      try {
        printers = await targetWindow.webContents.getPrintersAsync();
      } catch (getPrintersError) {
        logger.error('Error calling getPrinters():', getPrintersError);
        // If getPrinters fails, it might be because the window needs to be shown
        // Try showing it temporarily (if not already shown)
        if (!targetWindow.isVisible()) {
          logger.info('Window not visible, attempting to show temporarily');
          targetWindow.show();
          // Wait a bit for the window to be ready
          await new Promise((resolve) => setTimeout(resolve, 100));
          printers = await targetWindow.webContents.getPrintersAsync();
          // Hide again if it wasn't the main window
          if (targetWindow !== mainWindow) {
            targetWindow.hide();
          }
        } else {
          throw getPrintersError;
        }
      }

      logger.info(`Found ${printers.length} printers`);
      logger.debug('Printers from Electron', { printers });

      if (!printers || printers.length === 0) {
        logger.warn('No printers found on system');
        return [];
      }

      const formattedPrinters = printers.map((printer) => ({
        name: printer.name,
        displayName: printer.displayName || printer.name,
        description: printer.description || '',
        status: printer.status || 0,
        isDefault: printer.isDefault || false,
      }));

      return formattedPrinters;
    } catch (error) {
      logger.error('Error getting printers:', error);
      return [];
    }
  });

  ipcMain.handle('print-receipt', async (_event, { printerName, receiptData, companyInfo }) => {
    try {
      if (!receiptData) throw new Error('Receipt data is required');
      if (!companyInfo) throw new Error('Company info is required');

      // Constants
      const PIXELS_PER_MM = 3.78;
      const PAPER_SIZE_CONFIGS = {
        'roll-58': { widthMM: 58, heightMM: 297, margins: { marginType: 'none' } },
        'roll-80': { widthMM: 80, heightMM: 297, margins: { marginType: 'none' } },
        'roll-88': { widthMM: 88, heightMM: 297, margins: { marginType: 'none' } },
        a4: { widthMM: 210, heightMM: 297, margins: { marginType: 'default' } },
        a5: { widthMM: 148, heightMM: 210, margins: { marginType: 'default' } },
      };

      // Get paper size configuration based on invoice type
      const invoiceType = companyInfo.invoiceType || 'roll-80';
      const invoiceTheme = companyInfo.invoiceTheme || 'classic';
      const paperConfig = PAPER_SIZE_CONFIGS[invoiceType] || PAPER_SIZE_CONFIGS['roll-80'];

      logger.debug('Printing receipt', { printerName, invoiceType, invoiceTheme, paperConfig, receiptDataLength: receiptData?.length });

      // Generate HTML content from receipt data
      const htmlContent = generateReceiptHtml(receiptData, invoiceType, invoiceTheme);

      // Create a hidden window for printing
      const printWindow = new BrowserWindow({
        show: false,
        width: Math.round(paperConfig.widthMM * PIXELS_PER_MM),
        height: Math.round(paperConfig.heightMM * PIXELS_PER_MM),
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Load the HTML content
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // Wait for fonts and content to be legally ready
      try {
        await printWindow.webContents.executeJavaScript('document.fonts.ready');
      } catch (err) {
        logger.warn('Error waiting for fonts:', err);
        // Fallback to small timeout if font check fails
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Print options
      const printOptions = {
        silent: true,
        printBackground: true,
        deviceName: printerName || undefined,
        pageSize: {
          width: paperConfig.widthMM * 1000, // Convert mm to microns
          height: paperConfig.heightMM * 1000,
        },
        margins: paperConfig.margins,
      };

      // Print the content
      return new Promise((resolve) => {
        printWindow.webContents.print(printOptions, (success, errorType) => {
          // Close window after print attempt
          // Use setTimeout to ensure print job is sent to spooler before closing
          setTimeout(() => {
            if (!printWindow.isDestroyed()) {
              printWindow.close();
            }
          }, 100);

          if (success) {
            logger.info('Receipt printed successfully');
            resolve({ success: true, message: 'تمت الطباعة بنجاح' });
          } else {
            logger.error('Print failed:', errorType);
            resolve({
              success: false,
              error: `فشل في الطباعة: ${errorType || 'خطأ غير معروف'}`,
            });
          }
        });
      });
    } catch (error) {
      logger.error('Error printing receipt:', error);
      return {
        success: false,
        error: error.message || 'فشل في الطباعة',
      };
    }
  });

  ipcMain.handle('preview-receipt', async (_event, { receiptData, companyInfo }) => {
    try {
      if (!receiptData) throw new Error('Receipt data is required');
      if (!companyInfo) throw new Error('Company info is required');

      // Constants
      const PIXELS_PER_MM = 3.78;
      const PAPER_SIZE_CONFIGS = {
        'roll-58': { widthMM: 58, heightMM: 297, margins: { marginType: 'none' } },
        'roll-80': { widthMM: 80, heightMM: 297, margins: { marginType: 'none' } },
        'roll-88': { widthMM: 88, heightMM: 297, margins: { marginType: 'none' } },
        a4: { widthMM: 210, heightMM: 297, margins: { marginType: 'default' } },
        a5: { widthMM: 148, heightMM: 210, margins: { marginType: 'default' } },
      };

      // Get paper size configuration based on invoice type
      const invoiceType = companyInfo.invoiceType || 'roll-80';
      const invoiceTheme = companyInfo.invoiceTheme || 'classic';
      const paperConfig = PAPER_SIZE_CONFIGS[invoiceType] || PAPER_SIZE_CONFIGS['roll-80'];

      logger.debug('Previewing receipt', { invoiceType, invoiceTheme, paperConfig, receiptDataLength: receiptData?.length });

      // Generate HTML content from receipt data
      const htmlContent = generateReceiptHtml(receiptData, invoiceType, invoiceTheme);

      // Create a hidden window for printing
      const printWindow = new BrowserWindow({
        show: true,
        width: Math.round(paperConfig.widthMM * PIXELS_PER_MM),
        height: Math.round(paperConfig.heightMM * PIXELS_PER_MM),
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Load the HTML content
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // Wait for fonts and content to be legally ready
      try {
        await printWindow.webContents.executeJavaScript('document.fonts.ready');
      } catch (err) {
        logger.warn('Error waiting for fonts:', err);
        // Fallback to small timeout if font check fails
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      return {
        success: true,
        message: 'تمت الطباعة بنجاح',
      };
    } catch (error) {
      logger.error('Error printing receipt:', error);
      return {
        success: false,
        error: error.message || 'فشل في الطباعة',
      };
    }
  });







  ipcMain.handle('cut-paper', async () => {
    try {
      logger.debug('Cutting paper command received');
      return { success: true };
    } catch (error) {
      logger.error('Error cutting paper:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('kick-drawer', async () => {
    try {
      logger.debug('Kicking cash drawer command received');
      return { success: true };
    } catch (error) {
      logger.error('Error kicking cash drawer:', error);
      return { success: false, error: error.message };
    }
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
    skipTaskbar: true,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      devTools: false, // ← أهم شيء
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/preload.mjs'),
    },
  });

  // Add error handlers for debugging
  activationWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logger.error(`Activation window failed to load: ${errorCode} - ${errorDescription} - ${validatedURL}`);
  });

  activationWindow.webContents.on('did-finish-load', () => {
    logger.info('Activation window finished loading');
  });

  if (isDev) {
    activationWindow.loadFile(path.join(__dirname, '../../activation.html'));
  } else {
    // Try multiple path resolution strategies for production
    const tryLoadActivation = async () => {
      // Strategy 1: Try resources path first (for extraResources - most reliable in packaged apps)
      try {
        const resourcesPath = process.resourcesPath;
        const activationPath = path.join(resourcesPath, 'dist-electron', 'dist', 'activation.html');
        logger.info(`Trying to load activation from resources path: ${activationPath}`);
        await activationWindow.loadFile(activationPath);
        logger.info('Successfully loaded activation from resources path');
        return;
      } catch (err) {
        logger.warn(`Failed to load activation from resources path: ${err.message}`);
      }

      // Strategy 2: Relative path from main.js location
      try {
        const relativePath = path.join(__dirname, '../../dist/activation.html');
        logger.info(`Trying to load activation from relative path: ${relativePath}`);
        await activationWindow.loadFile(relativePath);
        logger.info('Successfully loaded activation from relative path');
        return;
      } catch (err) {
        logger.warn(`Failed to load activation from relative path: ${err.message}`);
      }

      // Strategy 3: Using app.getAppPath()
      let lastError;
      try {
        const appPath = app.getAppPath();
        const activationPath = path.join(appPath, 'dist-electron', 'dist', 'activation.html');
        logger.info(`Trying to load activation from app path: ${activationPath}`);
        await activationWindow.loadFile(activationPath);
        logger.info('Successfully loaded activation from app path');
        return;
      } catch (err) {
        lastError = err;
        logger.warn(`Failed to load activation from app path: ${err.message}`);
      }

      // All strategies failed
      logger.error(`All activation path resolution strategies failed. Last error: ${lastError?.message || 'unknown'}`);
      throw new Error('Failed to locate activation.html file');
    };

    tryLoadActivation().catch((err) => {
      logger.error(`Failed to load activation.html after all attempts: ${err.message}`);
    });
  }

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
    resizable: false,
    frame: false,
    center: true,
    transparent: true,
    show: false,
    skipTaskbar: true,
    icon: isDev ? join(__dirname, '../../build/icon.png') : join(__dirname, '../build/icon.png'),
    webPreferences: {
      devTools: false, // ← أهم شيء
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, '../preload/preload.mjs'),
    },
  });

  // Add error handlers for debugging
  splashWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logger.error(`Splash window failed to load: ${errorCode} - ${errorDescription} - ${validatedURL}`);
  });

  splashWindow.webContents.on('did-finish-load', () => {
    logger.info('Splash window finished loading');
  });

  if (isDev) {
    splashWindow.loadFile(path.join(__dirname, '../../splash.html'));
  } else {
    // Try multiple path resolution strategies for production
    const tryLoadSplash = async () => {
      // Strategy 1: Try resources path first (for extraResources - most reliable in packaged apps)
      try {
        const resourcesPath = process.resourcesPath;
        const splashPath = path.join(resourcesPath, 'dist-electron', 'dist', 'splash.html');
        logger.info(`Trying to load splash from resources path: ${splashPath}`);
        await splashWindow.loadFile(splashPath);
        logger.info('Successfully loaded splash from resources path');
        return;
      } catch (err) {
        logger.warn(`Failed to load splash from resources path: ${err.message}`);
      }

      // Strategy 2: Relative path from main.js location
      try {
        const relativePath = path.join(__dirname, '../../dist/splash.html');
        logger.info(`Trying to load splash from relative path: ${relativePath}`);
        await splashWindow.loadFile(relativePath);
        logger.info('Successfully loaded splash from relative path');
        return;
      } catch (err) {
        logger.warn(`Failed to load splash from relative path: ${err.message}`);
      }

      // Strategy 3: Using app.getAppPath()
      let lastError;
      try {
        const appPath = app.getAppPath();
        const splashPath = path.join(appPath, 'dist-electron', 'dist', 'splash.html');
        logger.info(`Trying to load splash from app path: ${splashPath}`);
        await splashWindow.loadFile(splashPath);
        logger.info('Successfully loaded splash from app path');
        return;
      } catch (err) {
        lastError = err;
        logger.warn(`Failed to load splash from app path: ${err.message}`);
      }

      // All strategies failed
      logger.error(`All splash path resolution strategies failed. Last error: ${lastError?.message || 'unknown'}`);
      throw new Error('Failed to locate splash.html file');
    };

    tryLoadSplash().catch((err) => {
      logger.error(`Failed to load splash.html after all attempts: ${err.message}`);
    });
  }

  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
    // Track when splash is actually shown for minimum display time
    splashWindow.__shownAt = Date.now();
  });

  splashWindow.on('closed', () => (splashWindow = null));
}

function tryToShowMainWindowAfterSplash() {
  if (!mainWindow) return;
  if (!mainWindow.__readyToShow) return;
  if (!backendReady) return;

  // Clear any existing timeout to prevent multiple calls
  if (splashTimeout) {
    clearTimeout(splashTimeout);
    splashTimeout = null;
  }

  const showMainWindow = () => {
    // Clear timeout reference
    splashTimeout = null;
    
    if (splashWindow) {
      try {
        splashWindow.destroy();
      } catch (err) {
        logger.warn('Error destroying splash window', err);
      }
      splashWindow = null;
    }
    if (mainWindow) {
      mainWindow.show();
    }
  };

  if (splashWindow && splashWindow.__shownAt) {
    // Ensure splash is shown for at least 7 seconds
    const minSplashTime = 7000;
    const timeSinceShown = Date.now() - splashWindow.__shownAt;
    const timeLeft = minSplashTime - timeSinceShown;

    if (timeLeft > 0) {
      logger.info(`Splash shown. Waiting ${timeLeft}ms before showing main window`);
      splashTimeout = setTimeout(showMainWindow, timeLeft);
    } else {
      logger.info('Splash minimum time already reached, showing main window');
      showMainWindow();
    }
  } else {
    // Fallback: show main window immediately if splash timing not available
    logger.warn('Splash timing not available, showing main window immediately');
    showMainWindow();
  }
}

app.whenReady().then(async () => {
  if (isQuitting) return;

  // Create splash immediately and show it
  createSplashWindow();

  const result = await verifyLicense();

  if (result.ok) {
    createWindow();
    try {
      await backendManager.StartBackend();
      backendReady = true;
    } catch (error) {
      logger.error('Failed to start backend, but continuing with UI:', error);
      // Set backendReady to true anyway so UI can show
      // Backend errors will be handled by the UI itself
      backendReady = true;
    }
    tryToShowMainWindowAfterSplash();
  } else {
    createActivationWindow();
    // For activation window, hide splash and show activation after minimum splash time
    if (activationWindow && splashWindow && splashWindow.__shownAt) {
      const minSplashTime = 7000;
      const timeSinceShown = Date.now() - splashWindow.__shownAt;
      const timeLeft = minSplashTime - timeSinceShown;

      setTimeout(
        () => {
          if (splashWindow) {
            try {
              splashWindow.destroy();
            } catch (err) {
              logger.warn('Error destroying splash window', err);
            }
            splashWindow = null;
          }
          if (activationWindow && !activationWindow.isDestroyed()) {
            activationWindow.show();
          }
        },
        timeLeft > 0 ? timeLeft : 0
      );
    } else if (activationWindow) {
      // Fallback: show activation window immediately
      setTimeout(() => {
        if (splashWindow) {
          try {
            splashWindow.destroy();
          } catch (err) {
            logger.warn('Error destroying splash window', err);
          }
          splashWindow = null;
        }
        if (activationWindow && !activationWindow.isDestroyed()) {
          activationWindow.show();
        }
      }, 2000); // Small delay to let splash show
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

  // Clear splash timeout if exists
  if (splashTimeout) {
    clearTimeout(splashTimeout);
    splashTimeout = null;
  }

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

// ---- First Run Setup ----
ipcMain.handle('firstRun:createLock', () => {
  try {
    createLockFile();
    logger.info('Lock file created successfully');
    return { success: true };
  } catch (error) {
    logger.error('Failed to create lock file:', error);
    return { success: false, error: error.message };
  }
});



