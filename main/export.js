const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function exportProject(data, outputDir) {
  // Ensure output directory exists
  await fs.promises.mkdir(outputDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const zipName = `${data.title || 'manga-project'}_${timestamp}.zip`;
  const zipPath = path.join(outputDir, zipName);
  
  // Create a file stream for the zip
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });
  
  // Return a promise that resolves when the archive is finalized
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      resolve({ success: true, path: zipPath, size: archive.pointer() });
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    // Pipe archive data to the file
    archive.pipe(output);
    
    // Add creator.json
    const creatorData = {
      pages: (data.pages || []).map((page, index) => ({
        id: page.id,
        name: page.name,
        filename: `page_${index + 1}.png`,
        speechId: page.speechId || null,
        speechPos: page.speechPos || { x: 20, y: 20 },
        speechStyle: page.speechStyle || { shape: 'rounded', color: 'white', borderColor: 'black', size: 'medium', animation: 'fadeIn' },
        // Remove base64 data from JSON
      })),
      speechData: data.speechData || [],
      language: data.language || 'ja',
      version: data.version || '1.0.0',
      exportDate: new Date().toISOString()
    };
    
    archive.append(JSON.stringify(creatorData, null, 2), { name: 'creator.json' });
    
    // Create panels directory and add images
    if (data.pages && data.pages.length > 0) {
      for (let i = 0; i < data.pages.length; i++) {
        const page = data.pages[i];
        if (page.url) {
          const base64Data = page.url.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          archive.append(buffer, { name: `panels/page_${i + 1}.png` });
        }
      }
    }
    
    // Finalize the archive
    archive.finalize();
  });
}

module.exports = { exportProject };