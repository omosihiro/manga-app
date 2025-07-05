import React, { useState, useRef } from 'react';
import './PagesPanel.css';

function PagesPanel({ pages, onPagesUpdate, speechData }) {
  const [dragOver, setDragOver] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [draggedPage, setDraggedPage] = useState(null);
  const [dragOverGroup, setDragOverGroup] = useState(null);
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
              group: 'Normal',
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

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handlePageDragStart = (e, page) => {
    setDraggedPage(page);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(new Image(), 0, 0);
    e.currentTarget.classList.add('dragging');
  };

  const handlePageDragOver = (e, groupName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGroup !== groupName) {
      setDragOverGroup(groupName);
    }
  };

  const handlePageDragLeave = (e, groupName) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverGroup(null);
    }
  };

  const handlePageDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedPage(null);
    setDragOverGroup(null);
  };

  const handlePageDrop = (e, targetGroup) => {
    e.preventDefault();
    if (draggedPage && draggedPage.group !== targetGroup) {
      const updatedPages = pages.map(page => 
        page.id === draggedPage.id ? { ...page, group: targetGroup } : page
      );
      onPagesUpdate(updatedPages);
    }
    setDraggedPage(null);
    setDragOverGroup(null);
  };

  // Group pages by their group property
  const groupedPages = {
    Start: pages.filter(page => page.group === 'Start'),
    Normal: pages.filter(page => page.group === 'Normal' || !page.group),
    Big: pages.filter(page => page.group === 'Big')
  };

  // Get pages in export order (Start -> Normal -> Big)
  const getPagesInOrder = () => {
    return [...groupedPages.Start, ...groupedPages.Normal, ...groupedPages.Big];
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

      <div className="pages-groups">
        {['Start', 'Normal', 'Big'].map(groupName => (
          <div key={groupName} className="page-group">
            <div 
              className="group-header"
              onClick={() => toggleGroup(groupName)}
            >
              <span className="group-toggle">
                {collapsedGroups[groupName] ? '▶' : '▼'}
              </span>
              <span className="group-name">{groupName}</span>
              <span className="group-count">({groupedPages[groupName].length})</span>
            </div>
            
            {!collapsedGroups[groupName] && (
              <div 
                className={`group-content ${dragOverGroup === groupName && draggedPage?.group !== groupName ? 'drag-over' : ''}`}
                onDragOver={(e) => handlePageDragOver(e, groupName)}
                onDragLeave={(e) => handlePageDragLeave(e, groupName)}
                onDrop={(e) => handlePageDrop(e, groupName)}
              >
                {groupedPages[groupName].length === 0 ? (
                  <div className={`empty-group ${dragOverGroup === groupName && draggedPage ? 'drag-over' : ''}`}>
                    {dragOverGroup === groupName && draggedPage ? 'Drop page here' : 'Drop pages here'}
                  </div>
                ) : (
                  groupedPages[groupName].map((page, indexInGroup) => {
                    const globalIndex = getPagesInOrder().findIndex(p => p.id === page.id);
                    return (
                      <div 
                        key={page.id} 
                        className="page-item"
                        draggable
                        onDragStart={(e) => handlePageDragStart(e, page)}
                        onDragEnd={handlePageDragEnd}
                      >
                        <img src={page.url} alt={page.name} />
                        <div className="page-info">
                          <span className="page-number">{globalIndex + 1}</span>
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
                            onClick={() => movePageUp(globalIndex)}
                            disabled={globalIndex === 0}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button 
                            onClick={() => movePageDown(globalIndex)}
                            disabled={globalIndex === getPagesInOrder().length - 1}
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
                    );
                  })
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PagesPanel;