import React, { useState, useRef } from 'react';
import './PagesPanel.css';

function PagesPanel({ pages, onPagesUpdate, speechData }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    Promise.all(
      imageFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              id: Date.now() + Math.random(),
              name: file.name,
              url: e.target.result,
              type: file.type,
              speechPos: { x: 20, y: 20 },
              speechStyle: {
                shape: 'rounded',
                color: 'white',
                borderColor: 'black',
                size: 'medium',
                animation: 'fadeIn'
              }
            });
          };
          reader.readAsDataURL(file);
        });
      })
    ).then(newPages => {
      onPagesUpdate([...pages, ...newPages]);
    });
  };

  const removePage = (id) => {
    onPagesUpdate(pages.filter(page => page.id !== id));
  };

  const updatePageSpeechId = (pageId, speechId) => {
    const updatedPages = pages.map(page => 
      page.id === pageId ? { ...page, speechId } : page
    );
    onPagesUpdate(updatedPages);
  };

  const updatePageSpeechStyle = (pageId, styleKey, styleValue) => {
    const updatedPages = pages.map(page => 
      page.id === pageId 
        ? { ...page, speechStyle: { ...page.speechStyle, [styleKey]: styleValue } }
        : page
    );
    onPagesUpdate(updatedPages);
  };

  const movePageUp = (index) => {
    if (index === 0) return;
    const newPages = [...pages];
    [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
    onPagesUpdate(newPages);
  };

  const movePageDown = (index) => {
    if (index === pages.length - 1) return;
    const newPages = [...pages];
    [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]];
    onPagesUpdate(newPages);
  };

  return (
    <div className="pages-panel">
      <div 
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="drop-zone-content">
          <p>Drag & Drop images here</p>
          <p>or click to select</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div className="pages-list">
        {pages.map((page, index) => (
          <div key={page.id} className="page-item">
            <img src={page.url} alt={page.name} />
            <div className="page-info">
              <span className="page-number">{index + 1}</span>
              <span className="page-name">{page.name}</span>
            </div>
            <div className="page-speech">
              <select 
                value={page.speechId || ''}
                onChange={(e) => updatePageSpeechId(page.id, e.target.value)}
                className="speech-select"
              >
                <option value="">なし</option>
                {speechData && speechData.map(speech => (
                  <option key={speech.id} value={speech.id}>
                    {speech.id}
                  </option>
                ))}
              </select>
              
              {page.speechId && (
                <div className="speech-style-controls">
                  <select
                    value={page.speechStyle?.shape || 'rounded'}
                    onChange={(e) => updatePageSpeechStyle(page.id, 'shape', e.target.value)}
                    className="style-select"
                    title="Shape"
                  >
                    <option value="rounded">Rounded</option>
                    <option value="cloud">Cloud</option>
                    <option value="sharp">Sharp</option>
                    <option value="thought">Thought</option>
                  </select>
                  
                  <select
                    value={page.speechStyle?.size || 'medium'}
                    onChange={(e) => updatePageSpeechStyle(page.id, 'size', e.target.value)}
                    className="style-select"
                    title="Size"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                  
                  <input
                    type="color"
                    value={page.speechStyle?.color || '#ffffff'}
                    onChange={(e) => updatePageSpeechStyle(page.id, 'color', e.target.value)}
                    className="color-picker"
                    title="Background color"
                  />
                  
                  <select
                    value={page.speechStyle?.animation || 'fadeIn'}
                    onChange={(e) => updatePageSpeechStyle(page.id, 'animation', e.target.value)}
                    className="style-select"
                    title="Animation"
                  >
                    <option value="none">None</option>
                    <option value="fadeIn">Fade In</option>
                    <option value="slideIn">Slide In</option>
                    <option value="bounce">Bounce</option>
                    <option value="zoom">Zoom</option>
                  </select>
                </div>
              )}
            </div>
            <div className="page-actions">
              <button 
                onClick={() => movePageUp(index)}
                disabled={index === 0}
                title="Move up"
              >
                ↑
              </button>
              <button 
                onClick={() => movePageDown(index)}
                disabled={index === pages.length - 1}
                title="Move down"
              >
                ↓
              </button>
              <button 
                onClick={() => removePage(page.id)}
                className="remove-btn"
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PagesPanel;