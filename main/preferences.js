const { BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let preferencesWindow = null;
let settingsManager = null;

function initializePreferences(manager) {
  settingsManager = manager;
  
  // IPC handlers for preferences
  ipcMain.handle('preferences:getSettings', async () => {
    if (!settingsManager.settings) {
      await settingsManager.loadSettings();
    }
    return settingsManager.settings;
  });

  ipcMain.handle('preferences:selectFolder', async () => {
    const result = await dialog.showOpenDialog(preferencesWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Export Folder'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('preferences:saveSettings', async (event, newSettings) => {
    try {
      // Validate export path exists
      const stats = await fs.stat(newSettings.exportPath);
      if (!stats.isDirectory()) {
        return { success: false, error: 'Path is not a directory' };
      }
      
      settingsManager.settings = newSettings;
      await settingsManager.saveSettings();
      return { success: true };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Try to create the directory
        try {
          await fs.mkdir(newSettings.exportPath, { recursive: true });
          settingsManager.settings = newSettings;
          await settingsManager.saveSettings();
          return { success: true };
        } catch (createError) {
          return { success: false, error: 'Could not create directory' };
        }
      }
      return { success: false, error: error.message };
    }
  });
}

function createPreferencesWindow() {
  if (preferencesWindow) {
    preferencesWindow.focus();
    return;
  }

  preferencesWindow = new BrowserWindow({
    width: 500,
    height: 400,
    title: 'Preferences',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    resizable: false,
    minimizable: false,
    maximizable: false
  });

  // Load preferences HTML
  preferencesWindow.loadFile(path.join(__dirname, '..', 'app', 'public', 'preferences.html'));

  preferencesWindow.on('closed', () => {
    preferencesWindow = null;
  });
}

module.exports = { createPreferencesWindow, initializePreferences };