const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any API methods you want to expose to the renderer here
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  saveProject: (data) => ipcRenderer.invoke('save-project', data),
  loadProject: () => ipcRenderer.invoke('load-project'),
  exportProject: (data) => ipcRenderer.invoke('export-project', data),
  getExportPath: () => ipcRenderer.invoke('get-export-path'),
  setExportPath: (path) => ipcRenderer.invoke('set-export-path', path),
  openExportFolder: () => ipcRenderer.invoke('open-export-folder'),
  // Preferences window APIs
  getPreferencesSettings: () => ipcRenderer.invoke('preferences:getSettings'),
  selectPreferencesFolder: () => ipcRenderer.invoke('preferences:selectFolder'),
  savePreferencesSettings: (settings) => ipcRenderer.invoke('preferences:saveSettings', settings)
});