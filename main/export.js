const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const sharp = require('sharp');

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
  
  // Prepare image buffers before creating the archive
  const imageBuffers = [];
  if (data.pages && data.pages.length > 0) {
    for (let i = 0; i < data.pages.length; i++) {
      const page = data.pages[i];
      if (page.url) {
        const base64Data = page.url.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        if (data.compressToWebP) {
          // Convert to WebP with quality 85
          const webpBuffer = await sharp(buffer)
            .webp({ quality: 85 })
            .toBuffer();
          imageBuffers.push({ buffer: webpBuffer, index: i, extension: 'webp' });
        } else {
          // Keep as PNG
          imageBuffers.push({ buffer: buffer, index: i, extension: 'png' });
        }
      }
    }
  }
  
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
    
    // Determine file extension based on compression option
    const imageExtension = data.compressToWebP ? 'webp' : 'png';
    
    // Add creator.json
    const creatorData = {
      sections: data.sections || [
        { name: 'Start', startIndex: 0 },
        { name: 'Normal', startIndex: 0 },
        { name: 'Big', startIndex: 0 }
      ],
      sweetSpot: data.sweetSpot || 600,
      delayRows: data.delayRows || 1,
      pages: (data.pages || []).map((page, index) => ({
        id: page.id,
        name: page.name,
        filename: `page_${index + 1}.${imageExtension}`,
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
    
    // Add pre-processed images
    for (const img of imageBuffers) {
      archive.append(img.buffer, { name: `panels/page_${img.index + 1}.${img.extension}` });
    }
    
    // Finalize the archive
    archive.finalize();
  });
}

module.exports = { exportProject };