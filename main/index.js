const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exportProject } = require('./export');

let mainWindow;

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

app.whenReady().then(createWindow);

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
    const exportDir = path.join(app.getPath('userData'), 'export');
    const result = await exportProject(data, exportDir);
    
    if (result.success) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'エクスポート完了',
        message: `プロジェクトをエクスポートしました`,
        detail: `保存先: ${result.path}`,
        buttons: ['OK']
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error exporting project:', error);
    dialog.showErrorBox('エクスポートエラー', `プロジェクトのエクスポート中にエラーが発生しました: ${error.message}`);
    return { success: false, error: error.message };
  }
});