const { ipcRenderer } = require('electron');

let currentPath = '';

// Load current settings
async function loadSettings() {
  currentPath = await ipcRenderer.invoke('get-export-path');
  document.getElementById('exportPath').value = currentPath;
}

// Browse button handler
document.getElementById('browseButton').addEventListener('click', async () => {
  const result = await ipcRenderer.invoke('browse-for-folder');
  if (result.success && result.path) {
    document.getElementById('exportPath').value = result.path;
    currentPath = result.path;
  }
});

// Save button handler
document.getElementById('saveButton').addEventListener('click', async () => {
  const exportPath = document.getElementById('exportPath').value;
  await ipcRenderer.invoke('set-export-path', exportPath);
  window.close();
});

// Cancel button handler
document.getElementById('cancelButton').addEventListener('click', () => {
  window.close();
});

// Load settings on startup
loadSettings();