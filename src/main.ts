import { app, shell, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../resources/icon.png?asset';
import path from 'node:path';
import { scanCollection } from './directoryScanner';


async function handleDirectoryOpen(): Promise<string | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (!canceled) {
    return filePaths[0];
  }
  return null;
}


async function handleScanCollection(_event: IpcMainInvokeEvent, collectionPath: string): Promise<any> {
  console.log(`[Main] Received path to scan: ${collectionPath}`);
  // Call our new scanner function and return its result directly to the UI
  const state = await scanCollection(collectionPath);
  return state;
}


function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      // Corrected path for the flat structure
      preload: join(__dirname, 'preload.js'),
      sandbox: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.handle('dialog:openDirectory', handleDirectoryOpen);
  ipcMain.handle('scan-collection', handleScanCollection);

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});