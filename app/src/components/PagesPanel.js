import React, { useState, useRef, useCallback } from 'react';
import './PagesPanel.css';

function PagesPanel({ pages, onPagesUpdate, speechData }) {
  const [dragOver, setDragOver] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [draggedPage, setDraggedPage] = useState(null);
  const [dragOverGroup, setDragOverGroup] = useState(null);
  const [selectedPageIds, setSelectedPageIds] = useState(new Set());
  const [lastSelectedId, setLastSelectedId] = useState(null);
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
                animation: 'fadeIn',
                tail: 'left',
                anim: 'fade'
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
    setSelectedPageIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const removeSelectedPages = useCallback(() => {
    if (selectedPageIds.size === 0) return;
    onPagesUpdate(pages.filter(page => !selectedPageIds.has(page.id)));
    setSelectedPageIds(new Set());
  }, [selectedPageIds, pages, onPagesUpdate]);

  const duplicateSelectedPages = () => {
    if (selectedPageIds.size === 0) return;
    const pagesToDuplicate = pages.filter(page => selectedPageIds.has(page.id));
    const duplicatedPages = pagesToDuplicate.map(page => ({
      ...page,
      id: Date.now() + Math.random(),
      name: `${page.name} (copy)`
    }));
    onPagesUpdate([...pages, ...duplicatedPages]);
  };

  const moveSelectedUp = () => {
    if (selectedPageIds.size === 0) return;
    
    // Work with ordered pages
    const orderedPages = getPagesInOrder();
    const selectedIndices = orderedPages
      .map((page, index) => selectedPageIds.has(page.id) ? index : -1)
      .filter(index => index !== -1)
      .sort((a, b) => a - b);
    
    if (selectedIndices[0] === 0) return; // Can't move up if first item is selected
    
    // Create new ordered array
    const newOrderedPages = [...orderedPages];
    selectedIndices.forEach(index => {
      if (index > 0) {
        [newOrderedPages[index - 1], newOrderedPages[index]] = [newOrderedPages[index], newOrderedPages[index - 1]];
      }
    });
    
    // Map back to original pages array preserving non-ordered properties
    const pageMap = new Map(newOrderedPages.map((page, index) => [page.id, index]));
    const sortedPages = [...pages].sort((a, b) => {
      const indexA = pageMap.get(a.id) ?? Infinity;
      const indexB = pageMap.get(b.id) ?? Infinity;
      return indexA - indexB;
    });
    
    onPagesUpdate(sortedPages);
  };

  const moveSelectedDown = () => {
    if (selectedPageIds.size === 0) return;
    
    // Work with ordered pages
    const orderedPages = getPagesInOrder();
    const selectedIndices = orderedPages
      .map((page, index) => selectedPageIds.has(page.id) ? index : -1)
      .filter(index => index !== -1)
      .sort((a, b) => b - a); // Sort descending for move down
    
    if (selectedIndices[0] === orderedPages.length - 1) return; // Can't move down if last item is selected
    
    // Create new ordered array
    const newOrderedPages = [...orderedPages];
    selectedIndices.forEach(index => {
      if (index < newOrderedPages.length - 1) {
        [newOrderedPages[index], newOrderedPages[index + 1]] = [newOrderedPages[index + 1], newOrderedPages[index]];
      }
    });
    
    // Map back to original pages array preserving non-ordered properties
    const pageMap = new Map(newOrderedPages.map((page, index) => [page.id, index]));
    const sortedPages = [...pages].sort((a, b) => {
      const indexA = pageMap.get(a.id) ?? Infinity;
      const indexB = pageMap.get(b.id) ?? Infinity;
      return indexA - indexB;
    });
    
    onPagesUpdate(sortedPages);
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

  const handlePageClick = (e, pageId) => {
    e.stopPropagation();
    
    // Don't select if clicking on interactive elements
    const clickedElement = e.target;
    const isInteractive = clickedElement.tagName === 'SELECT' || 
                         clickedElement.tagName === 'INPUT' || 
                         clickedElement.tagName === 'BUTTON' ||
                         clickedElement.tagName === 'TEXTAREA' ||
                         clickedElement.tagName === 'LABEL' ||
                         clickedElement.closest('.speech-style-editor') ||
                         clickedElement.closest('.page-actions');
    
    if (isInteractive) return;
    
    const metaKey = e.metaKey || e.ctrlKey;
    const shiftKey = e.shiftKey;
    
    if (!metaKey && !shiftKey) {
      // Regular click - select only this page
      setSelectedPageIds(new Set([pageId]));
      setLastSelectedId(pageId);
    } else if (metaKey) {
      // Cmd/Ctrl click - toggle selection
      setSelectedPageIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(pageId)) {
          newSet.delete(pageId);
        } else {
          newSet.add(pageId);
        }
        return newSet;
      });
      setLastSelectedId(pageId);
    } else if (shiftKey && lastSelectedId) {
      // Shift click - select range
      const orderedPages = getPagesInOrder();
      const lastIndex = orderedPages.findIndex(p => p.id === lastSelectedId);
      const currentIndex = orderedPages.findIndex(p => p.id === pageId);
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = orderedPages.slice(start, end + 1).map(p => p.id);
        
        setSelectedPageIds(prev => {
          const newSet = new Set(prev);
          rangeIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    }
  };

  const handlePageDragStart = (e, page) => {
    // If dragging a selected page, drag all selected pages
    if (selectedPageIds.has(page.id)) {
      setDraggedPage({ ...page, isMultiple: true, selectedIds: Array.from(selectedPageIds) });
    } else {
      setDraggedPage(page);
    }
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
    if (draggedPage) {
      let updatedPages;
      if (draggedPage.isMultiple && draggedPage.selectedIds) {
        // Move all selected pages
        updatedPages = pages.map(page => 
          draggedPage.selectedIds.includes(page.id) ? { ...page, group: targetGroup } : page
        );
      } else {
        // Move single page
        updatedPages = pages.map(page => 
          page.id === draggedPage.id ? { ...page, group: targetGroup } : page
        );
      }
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

  // Clear selection when clicking outside
  const handlePanelClick = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('accordion-content')) {
      setSelectedPageIds(new Set());
    }
  };
  
  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Select All (Cmd/Ctrl + A)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        const allPageIds = new Set(pages.map(p => p.id));
        setSelectedPageIds(allPageIds);
      }
      // Deselect All (Escape)
      else if (e.key === 'Escape') {
        setSelectedPageIds(new Set());
      }
      // Delete selected (Delete or Backspace)
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPageIds.size > 0) {
        // Only if not typing in an input
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          removeSelectedPages();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages, selectedPageIds, removeSelectedPages]);

  return (
    <div className="pages-panel" onClick={handlePanelClick}>
      {selectedPageIds.size > 0 && (
        <div className="selection-toolbar">
          <span className="selection-count">{selectedPageIds.size} selected</span>
          <div className="toolbar-actions">
            <button 
              className="toolbar-btn"
              onClick={moveSelectedUp}
              title="Move selected up"
            >
              ↑ Move Up
            </button>
            <button 
              className="toolbar-btn"
              onClick={moveSelectedDown}
              title="Move selected down"
            >
              ↓ Move Down
            </button>
            <button 
              className="toolbar-btn"
              onClick={duplicateSelectedPages}
              title="Duplicate selected"
            >
              ⎘ Duplicate
            </button>
            <button 
              className="toolbar-btn delete-btn"
              onClick={removeSelectedPages}
              title="Delete selected"
            >
              🗑 Delete
            </button>
          </div>
        </div>
      )}
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

      <div className="pages-accordion">
        {['Start', 'Normal', 'Big'].map(groupName => (
          <div key={groupName} className="accordion-panel">
            <button 
              className="accordion-header"
              onClick={() => toggleGroup(groupName)}
              aria-expanded={!collapsedGroups[groupName]}
              aria-controls={`panel-${groupName}`}
            >
              <span className="accordion-toggle">
                {collapsedGroups[groupName] ? '▶' : '▼'}
              </span>
              <span className="accordion-title">{groupName}</span>
              <span className="accordion-count">({groupedPages[groupName].length})</span>
            </button>
            
            {!collapsedGroups[groupName] && (
              <div 
                id={`panel-${groupName}`}
                className={`accordion-content ${dragOverGroup === groupName && draggedPage?.group !== groupName ? 'drag-over' : ''}`}
                onDragOver={(e) => handlePageDragOver(e, groupName)}
                onDragLeave={(e) => handlePageDragLeave(e, groupName)}
                onDrop={(e) => handlePageDrop(e, groupName)}
              >
                {groupedPages[groupName].length === 0 ? (
                  <div className={`accordion-empty ${dragOverGroup === groupName && draggedPage ? 'drag-over' : ''}`}>
                    {dragOverGroup === groupName && draggedPage ? 'Drop page here' : 'Drop pages here'}
                  </div>
                ) : (
                  groupedPages[groupName].map((page, indexInGroup) => {
                    const globalIndex = getPagesInOrder().findIndex(p => p.id === page.id);
                    return (
                      <div 
                        key={page.id} 
                        className={`page-item ${selectedPageIds.has(page.id) ? 'selected' : ''}`}
                        draggable
                        onClick={(e) => handlePageClick(e, page.id)}
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
                            <div className="speech-style-editor">
                              <div className="speech-style-controls">
                                {/* Shape selector */}
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
                                
                                {/* Size selector */}
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
                                
                                {/* Color picker */}
                                <input
                                  type="color"
                                  value={page.speechStyle?.color || '#ffffff'}
                                  onChange={(e) => updatePageSpeechStyle(page.id, 'color', e.target.value)}
                                  className="color-picker"
                                  title="Background color"
                                />
                                
                                {/* Tail direction segmented button */}
                                <div className="segmented-control" role="group" aria-label="Tail direction">
                                  <button
                                    type="button"
                                    className={`segment ${(page.speechStyle?.tail || 'left') === 'left' ? 'active' : ''}`}
                                    onClick={() => updatePageSpeechStyle(page.id, 'tail', 'left')}
                                  >
                                    Left
                                  </button>
                                  <button
                                    type="button"
                                    className={`segment ${page.speechStyle?.tail === 'right' ? 'active' : ''}`}
                                    onClick={() => updatePageSpeechStyle(page.id, 'tail', 'right')}
                                  >
                                    Right
                                  </button>
                                </div>
                              </div>
                              
                              {/* Animation radio chips */}
                              <div className="animation-chips">
                                {['none', 'fade', 'slide', 'bounce', 'zoom'].map(anim => (
                                  <label key={anim} className="radio-chip">
                                    <input
                                      type="radio"
                                      name={`anim-${page.id}`}
                                      value={anim}
                                      checked={(page.speechStyle?.anim || 'fade') === anim}
                                      onChange={(e) => updatePageSpeechStyle(page.id, 'anim', e.target.value)}
                                    />
                                    <span className="chip-label">{anim.charAt(0).toUpperCase() + anim.slice(1)}</span>
                                  </label>
                                ))}
                              </div>
                              
                              {/* Live preview */}
                              <div className="speech-preview">
                                <div 
                                  className={`preview-bubble speech-${page.speechStyle?.shape || 'rounded'} speech-${page.speechStyle?.size || 'medium'} tail-${page.speechStyle?.tail || 'left'}`}
                                  style={{
                                    backgroundColor: page.speechStyle?.color || '#ffffff',
                                    borderColor: page.speechStyle?.borderColor || '#000000'
                                  }}
                                >
                                  Preview
                                </div>
                              </div>
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