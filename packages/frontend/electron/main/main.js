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

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Load from frontend dist folder: electron/main -> ../../dist
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
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
      console.log('Raw printers from Electron:', printers);

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
      console.error('Error getting printers:', error);
      return [];
    }
  });

  ipcMain.handle('print-receipt', async (_event, { printerName, receiptData, companyInfo }) => {
    try {
      if (!receiptData) {
        throw new Error('Receipt data is required');
      }

      if (!companyInfo) {
        throw new Error('Company info is required');
      }

      // Get paper size configuration based on invoice type
      const invoiceType = companyInfo.invoiceType || 'roll-80';
      const paperSizeConfigs = {
        'roll-58': { widthMM: 58, heightMM: 297, margins: { marginType: 'none' } },
        'roll-80': { widthMM: 80, heightMM: 297, margins: { marginType: 'none' } },
        'roll-88': { widthMM: 88, heightMM: 297, margins: { marginType: 'none' } },
        a4: { widthMM: 210, heightMM: 297, margins: { marginType: 'default' } },
        a5: { widthMM: 148, heightMM: 210, margins: { marginType: 'default' } },
      };

      const paperConfig = paperSizeConfigs[invoiceType] || paperSizeConfigs['roll-80'];

      console.log('Printing with config:', { printerName, invoiceType, paperConfig });
      console.log('Receipt data length:', receiptData?.length);

      // Generate HTML content from receipt data
      const htmlContent = generateReceiptHtml(receiptData, invoiceType);

      // Create a hidden window for printing
      const printWindow = new BrowserWindow({
        show: false,
        width: Math.round(paperConfig.widthMM * 3.78), // Convert mm to pixels (approximate)
        height: Math.round(paperConfig.heightMM * 3.78),
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Load the HTML content
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // Wait for content to be ready
      await new Promise((resolve) => setTimeout(resolve, 500));

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

      console.log('Print options:', printOptions);

      // Print the content
      return new Promise((resolve) => {
        printWindow.webContents.print(printOptions, (success, errorType) => {
          printWindow.close();

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
      console.error('Print error details:', error);
      return {
        success: false,
        error: error.message || 'فشل في الطباعة',
      };
    }
  });

  ipcMain.handle('preview-receipt', async (_event, { receiptData, companyInfo }) => {
    try {
      if (!receiptData) {
        throw new Error('Receipt data is required');
      }

      if (!companyInfo) {
        throw new Error('Company info is required');
      }

      const invoiceType = companyInfo.invoiceType || 'roll-80';
      const isThermal = invoiceType.startsWith('roll-');

      // Paper size configurations for window dimensions
      const paperSizeConfigs = {
        'roll-58': { width: 380, height: 750, paperWidth: '58mm' },
        'roll-80': { width: 450, height: 800, paperWidth: '80mm' },
        'roll-88': { width: 480, height: 800, paperWidth: '88mm' },
        a4: { width: 700, height: 950, paperWidth: '210mm' },
        a5: { width: 600, height: 850, paperWidth: '148mm' },
      };

      const windowConfig = paperSizeConfigs[invoiceType] || paperSizeConfigs['roll-80'];
      const receiptStyles = getReceiptStyles(isThermal, windowConfig.paperWidth);
      const receiptBody = generateReceiptBodyHtml(receiptData);

      // Create a preview window
      const previewWindow = new BrowserWindow({
        width: windowConfig.width,
        height: windowConfig.height,
        autoHideMenuBar: true,
        title: 'معاينة الفاتورة - Receipt Preview',
        icon: isDev ? join(__dirname, '../../build/icon.png') : join(__dirname, '../build/icon.png'),
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Build preview HTML with toolbar
      const previewHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>معاينة الفاتورة - Receipt Preview</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    html, body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #1a1a2e;
      min-height: 100vh;
    }
    
    /* Toolbar */
    .toolbar {
      position: sticky;
      top: 0;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      padding: 14px 24px;
      display: flex;
      justify-content: center;
      gap: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
      z-index: 100;
      border-bottom: 1px solid #2a2a4a;
    }
    
    .toolbar button {
      padding: 12px 28px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.25s ease;
      font-family: 'Cairo', sans-serif;
    }
    
    .btn-print {
      background: linear-gradient(135deg, #00c853 0%, #00a844 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(0, 200, 83, 0.3);
    }
    
    .btn-print:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0, 200, 83, 0.4);
    }
    
    .btn-close {
      background: linear-gradient(135deg, #546E7A 0%, #455A64 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(84, 110, 122, 0.3);
    }
    
    .btn-close:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(84, 110, 122, 0.4);
    }
    
    /* Preview Container */
    .preview-container {
      display: flex;
      justify-content: center;
      padding: 30px;
      min-height: calc(100vh - 70px);
    }
    
    /* Receipt Paper */
    .receipt-paper {
      background: white;
      width: ${windowConfig.paperWidth};
      max-width: 100%;
      box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
      border-radius: ${isThermal ? '4px' : '8px'};
      overflow: hidden;
      padding: 20px 10px;
      padding-top: 50px;
    }
    
    /* Receipt Content Styles */
    ${receiptStyles}
    
    /* Print Media */
    @media print {
      .toolbar { display: none !important; }
      html, body { background: white !important; }
      .preview-container { padding: 0 !important; min-height: auto; }
      .receipt-paper { 
        box-shadow: none !important; 
        border-radius: 0 !important;
        width: 100% !important;
        padding-top: 50px !important;
      }
    }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="receipt-paper">
      ${receiptBody}
    </div>
  </div>
</body>
</html>`;

      // Load the preview HTML content
      await previewWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`);
      previewWindow.show();

      return { success: true };
    } catch (error) {
      logger.error('Error showing receipt preview:', error);
      console.error('Preview error details:', error);
      return {
        success: false,
        error: error.message || 'فشل في عرض المعاينة',
      };
    }
  });







  ipcMain.handle('cut-paper', async () => {
    try {
      console.log('Cutting paper command received');
      return { success: true };
    } catch (error) {
      console.error('Error cutting paper:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('kick-drawer', async () => {
    try {
      console.log('Kicking cash drawer command received');
      return { success: true };
    } catch (error) {
      console.error('Error kicking cash drawer:', error);
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

  activationWindow.loadFile(
    isDev
      ? path.join(__dirname, '../../activation.html')
      : path.join(__dirname, '../../dist/activation.html')
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

  splashWindow.loadFile(
    isDev ? path.join(__dirname, '../../splash.html') : path.join(__dirname, '../../dist/splash.html')
  );

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
    await backendManager.StartBackend();
    backendReady = true;
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



