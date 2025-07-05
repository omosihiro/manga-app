const { ipcRenderer } = require('electron');

let currentPath = '';
let currentSweetSpot = 600;
let currentDelayRows = 1;
let currentSections = [
  { name: 'Start', sweetSpot: 600 },
  { name: 'Normal', sweetSpot: 600 },
  { name: 'Big', sweetSpot: 600 }
];

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const tabName = e.target.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    
    // Show corresponding content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
  });
});

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
  
  // Load sections data
  const sections = await ipcRenderer.invoke('get-sections') || currentSections;
  currentSections = sections;
  
  // Update section sliders
  sections.forEach(section => {
    const sectionName = section.name.toLowerCase();
    const slider = document.getElementById(`${sectionName}SweetSpot`);
    const value = document.getElementById(`${sectionName}SweetSpotValue`);
    if (slider && value) {
      slider.value = section.sweetSpot || 600;
      value.textContent = section.sweetSpot || 600;
    }
  });
  
  // Get project data for auto-fit calculations
  const projectData = await ipcRenderer.invoke('get-project-data');
  if (projectData) {
    window.projectData = projectData;
  }
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

// Section sweet spot handlers
['start', 'normal', 'big'].forEach((sectionName, index) => {
  const slider = document.getElementById(`${sectionName}SweetSpot`);
  const valueDisplay = document.getElementById(`${sectionName}SweetSpotValue`);
  
  if (slider && valueDisplay) {
    slider.addEventListener('input', (e) => {
      const value = e.target.value;
      valueDisplay.textContent = value;
      currentSections[index].sweetSpot = parseInt(value);
    });
  }
});

// Save button handler
document.getElementById('saveButton').addEventListener('click', async () => {
  const exportPath = document.getElementById('exportPath').value;
  const sweetSpot = parseInt(document.getElementById('sweetSpotSlider').value);
  const delayRows = parseInt(document.getElementById('delayRowsSlider').value);
  
  await ipcRenderer.invoke('set-export-path', exportPath);
  await ipcRenderer.invoke('set-sweet-spot', sweetSpot);
  await ipcRenderer.invoke('set-delay-rows', delayRows);
  
  // Save sections data
  await ipcRenderer.invoke('set-sections', currentSections);
  
  window.close();
});

// Cancel button handler
document.getElementById('cancelButton').addEventListener('click', () => {
  window.close();
});

// Auto-fit button handler
document.getElementById('autoFitButton').addEventListener('click', async () => {
  if (!window.projectData || !window.projectData.speechData) {
    alert('No project data available. Please load a project first.');
    return;
  }
  
  const speechData = window.projectData.speechData;
  const pages = window.projectData.pages || [];
  
  // Count maximum rows in any speech ID
  let maxSpeechRows = 1;
  const speechById = {};
  
  speechData.forEach(speech => {
    const id = speech.id;
    if (!speechById[id]) {
      speechById[id] = [];
    }
    speechById[id].push(speech);
  });
  
  // Find the speech ID with the most rows
  Object.values(speechById).forEach(speeches => {
    maxSpeechRows = Math.max(maxSpeechRows, speeches.length);
  });
  
  // Estimate page height (typical manga aspect ratio)
  const pageHeight = 800; // Approximate height in pixels
  
  // Calculate sweetSpot for each section
  currentSections.forEach((section, index) => {
    const nextSection = currentSections[index + 1];
    const currentStartIndex = section.startIndex || 0;
    const nextStartIndex = nextSection ? nextSection.startIndex : pages.length;
    
    const sectionPageCount = nextStartIndex - currentStartIndex;
    const sectionHeightPx = sectionPageCount * pageHeight;
    
    // Calculate sweetSpot and round to nearest 50
    let sweetSpot = sectionHeightPx / maxSpeechRows;
    sweetSpot = Math.round(sweetSpot / 50) * 50;
    
    // Clamp between 200 and 1000
    sweetSpot = Math.max(200, Math.min(1000, sweetSpot));
    
    // Update the section
    section.sweetSpot = sweetSpot;
    
    // Update the UI
    const sectionName = section.name.toLowerCase();
    const slider = document.getElementById(`${sectionName}SweetSpot`);
    const value = document.getElementById(`${sectionName}SweetSpotValue`);
    if (slider && value) {
      slider.value = sweetSpot;
      value.textContent = sweetSpot;
    }
  });
});

// Load settings on startup
loadSettings();