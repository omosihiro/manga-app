const { ipcRenderer } = require('electron');

let currentPath = '';
let currentSweetSpot = 600;
let currentDelayRows = 1;

// Load current settings
async function loadSettings() {
  currentPath = await ipcRenderer.invoke('get-export-path');
  document.getElementById('exportPath').value = currentPath;
  
  currentSweetSpot = await ipcRenderer.invoke('get-sweet-spot') || 600;
  document.getElementById('sweetSpotSlider').value = currentSweetSpot;
  document.getElementById('sweetSpotValue').textContent = currentSweetSpot;
  
  currentDelayRows = await ipcRenderer.invoke('get-delay-rows') || 1;
  document.getElementById('delayRowsSlider').value = currentDelayRows;
  document.getElementById('delayRowsValue').textContent = currentDelayRows;
}

// Browse button handler
document.getElementById('browseButton').addEventListener('click', async () => {
  const result = await ipcRenderer.invoke('browse-for-folder');
  if (result.success && result.path) {
    document.getElementById('exportPath').value = result.path;
    currentPath = result.path;
  }
});

// Sweet spot slider handler
document.getElementById('sweetSpotSlider').addEventListener('input', (e) => {
  const value = e.target.value;
  document.getElementById('sweetSpotValue').textContent = value;
  currentSweetSpot = parseInt(value);
});

// Delay rows slider handler
document.getElementById('delayRowsSlider').addEventListener('input', (e) => {
  const value = e.target.value;
  document.getElementById('delayRowsValue').textContent = value;
  currentDelayRows = parseInt(value);
});

// Save button handler
document.getElementById('saveButton').addEventListener('click', async () => {
  const exportPath = document.getElementById('exportPath').value;
  const sweetSpot = parseInt(document.getElementById('sweetSpotSlider').value);
  const delayRows = parseInt(document.getElementById('delayRowsSlider').value);
  
  await ipcRenderer.invoke('set-export-path', exportPath);
  await ipcRenderer.invoke('set-sweet-spot', sweetSpot);
  await ipcRenderer.invoke('set-delay-rows', delayRows);
  
  window.close();
});

// Cancel button handler
document.getElementById('cancelButton').addEventListener('click', () => {
  window.close();
});

// Load settings on startup
loadSettings();