import { app, shell, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import icon from '../resources/icon.png?asset';
import path from 'node:path';
import { scanCollection } from './directoryScanner';
import { spawn, ChildProcess } from 'child_process';


let pythonProcess: ChildProcess | null = null;

// Function to get the path to the bundled Python executable
function getPythonExecutablePath(): string {
  // process.resourcesPath is the path to the 'resources' folder inside the packaged app
  // In development, it will be in the project root.
  const isDev = !app.isPackaged;
  const rootPath = isDev ? process.cwd() : process.resourcesPath;
  const platform = process.platform;

  if (platform === 'win32') {
    return join(rootPath, 'dist/python/pysaga.exe');
  }
  // Add paths for macOS and Linux if needed
  if (platform === 'darwin') { return join(rootPath, 'dist/python/pysaga'); }

  // raise error for unsupported platforms
  throw new Error(`Unsupported platform: ${platform}`);
}

// Function to start the Python backend process
function startPythonBackend() {
  const executablePath = getPythonExecutablePath();
  console.log(`[Main] Launching Python backend at: ${executablePath}`);

  // Launch the executable
  pythonProcess = spawn(executablePath, {
    stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
    windowsHide: true
  });

  pythonProcess.stdout?.on('data', (data) => {
    console.log(`[Python Backend]: ${data.toString().trim()}`);
  });

  // Listen for errors from the Python backend's stderr
  pythonProcess.stderr?.on('data', (data) => {
    console.error(`[Python Backend Error]: ${data.toString()}`);
  });

  // Listen for the process exiting
  pythonProcess.on('close', (code) => {
    console.log(`[Main] Python backend process exited with code ${code}`);
    pythonProcess = null;
  });

  pythonProcess.stdin?.write(JSON.stringify({ command: 'version', payload: {} }) + '\n');
}



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
  // Start the Python backend before creating the window
  startPythonBackend();

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

app.on('will-quit', () => {
  if (pythonProcess) {
    console.log('[Main] Killing Python backend process.');
    pythonProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});