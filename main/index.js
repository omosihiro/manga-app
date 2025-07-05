const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exportProject } = require('./export');
const SettingsManager = require('./settings');
const { createPreferencesWindow, initializePreferences } = require('./preferences');

let mainWindow;
let settingsManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // In development, load from localhost
  // In production, load from built files
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../app/build/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const isMac = process.platform === 'darwin';
  
  const template = [
    // macOS app menu
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences…',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            createPreferencesWindow();
          }
        },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // File menu
    {
      label: 'File',
      submenu: [
        ...(!isMac ? [{
          label: 'Preferences…',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            createPreferencesWindow();
          }
        }, { type: 'separator' }] : []),
        { role: isMac ? 'close' : 'quit' }
      ]
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}


app.whenReady().then(() => {
  settingsManager = new SettingsManager(app);
  settingsManager.loadSettings().then(() => {
    initializePreferences(settingsManager);
    createWindow();
    createMenu();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for file operations
ipcMain.handle('save-project', async (event, data) => {
  try {
    const dataDir = path.join(app.getPath('userData'), 'data');
    const filePath = path.join(dataDir, 'creator.json');
    
    // Ensure data directory exists
    await fs.mkdir(dataDir, { recursive: true });
    
    // Save project data
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error saving project:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-project', async (event) => {
  try {
    const dataDir = path.join(app.getPath('userData'), 'data');
    const filePath = path.join(dataDir, 'creator.json');
    
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { success: true, data: null }; // No saved project yet
    }
    console.error('Error loading project:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler for export functionality
ipcMain.handle('export-project', async (event, data) => {
  try {
    // Use export path from settings
    const exportDir = await settingsManager.ensureExportPath();
    const result = await exportProject(data, exportDir);
    
    if (result.success) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'エクスポート完了',
        message: `プロジェクトをエクスポートしました`,
        detail: `保存先: ${result.path}`,
        buttons: ['OK', 'フォルダを開く']
      }).then((response) => {
        if (response.response === 1) {
          // Open folder in file explorer
          require('electron').shell.showItemInFolder(result.path);
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error exporting project:', error);
    dialog.showErrorBox('エクスポートエラー', `プロジェクトのエクスポート中にエラーが発生しました: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// IPC handler for settings
ipcMain.handle('get-export-path', async () => {
  return await settingsManager.getExportPath();
});

ipcMain.handle('set-export-path', async (event, newPath) => {
  await settingsManager.setExportPath(newPath);
  return { success: true };
});

ipcMain.handle('open-export-folder', async () => {
  try {
    const exportPath = await settingsManager.getExportPath();
    await shell.openPath(exportPath);
    return { success: true };
  } catch (error) {
    console.error('Error opening export folder:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('browse-for-folder', async () => {
  const { preferencesWindow } = require('./preferences');
  const result = await dialog.showOpenDialog(preferencesWindow || mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Export Folder',
    buttonLabel: 'Select'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] };
  }
  
  return { success: false };
});

// IPC handlers for sweet spot
ipcMain.handle('get-sweet-spot', async () => {
  return await settingsManager.getSweetSpot();
});

ipcMain.handle('set-sweet-spot', async (event, value) => {
  await settingsManager.setSweetSpot(value);
  return { success: true };
});

// IPC handlers for delay rows
ipcMain.handle('get-delay-rows', async () => {
  return await settingsManager.getDelayRows();
});

ipcMain.handle('set-delay-rows', async (event, value) => {
  await settingsManager.setDelayRows(value);
  return { success: true };
});