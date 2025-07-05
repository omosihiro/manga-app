import React, { useState, useRef } from 'react';
import './PreviewTab.css';

function PreviewTab({ pages, speechData, language, onPagesUpdate }) {
  const [dragState, setDragState] = useState({
    isDragging: false,
    pageId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });

  // Helper function to find speech for a page
  const getSpeechForPage = (page) => {
    if (!page.speechId) return null;
    
    // Convert both IDs to strings for comparison
    return speechData.find(speech => 
      String(speech.id) === String(page.speechId)
    );
  };

  const handleMouseDown = (e, pageId, currentPos) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
    
    setDragState({
      isDragging: true,
      pageId: pageId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: currentPos.x,
      offsetY: currentPos.y
    });
  };

  const handleMouseMove = (e) => {
    if (!dragState.isDragging) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    const newX = dragState.offsetX + deltaX;
    const newY = dragState.offsetY + deltaY;
    
    // Update the speech element position temporarily
    const speechElement = document.querySelector(`[data-page-id="${dragState.pageId}"] .speech`);
    if (speechElement) {
      speechElement.style.left = `${newX}px`;
      speechElement.style.top = `${newY}px`;
    }
  };

  const handleMouseUp = (e) => {
    if (!dragState.isDragging) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    const newX = dragState.offsetX + deltaX;
    const newY = dragState.offsetY + deltaY;
    
    // Update pages with new speechPos
    const updatedPages = pages.map(page => 
      page.id === dragState.pageId 
        ? { ...page, speechPos: { x: newX, y: newY } }
        : page
    );
    
    onPagesUpdate(updatedPages);
    
    setDragState({
      isDragging: false,
      pageId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0
    });
  };

  // Add global mouse event listeners
  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, pages, onPagesUpdate]);

  return (
    <div className="preview-tab">
      <div className="preview-header">
        <h2>Preview</h2>
        <span className="preview-info">
          {pages.length} pages | {speechData.length} dialogues | Language: {language.toUpperCase()}
        </span>
      </div>
      
      <div className="preview-scroll-container">
        {pages.length === 0 ? (
          <div className="no-content">
            <p>No pages added yet</p>
            <p className="hint">Add pages in the Pages tab to see preview</p>
          </div>
        ) : (
          <div className="pages-container">
            {pages.map((page, pageIndex) => (
              <div key={page.id} className="preview-page-wrapper" data-page-id={page.id}>
                <div className="page-number">Page {pageIndex + 1}</div>
                <div className="preview-page">
                  <img 
                    src={page.url} 
                    alt={`Page ${pageIndex + 1}`} 
                    className="page-image"
                  />
                  
                  {/* Render speech if page has speechId */}
                  {(() => {
                    const speech = getSpeechForPage(page);
                    if (speech) {
                      const currentLang = language || 'ja';
                      const speechText = speech[currentLang] || speech.ja || speech.en || '';
                      if (speechText) {
                        const speechPos = page.speechPos || { x: 20, y: 20 };
                        const speechStyle = page.speechStyle || { shape: 'rounded', color: 'white', borderColor: 'black', size: 'medium', animation: 'fadeIn' };
                        const animationClass = speechStyle.animation !== 'none' ? `animate-${speechStyle.animation}` : '';
                        return (
                          <div 
                            className={`speech draggable speech-${speechStyle.shape} speech-${speechStyle.size} ${animationClass}`}
                            style={{
                              left: speechPos.x,
                              top: speechPos.y,
                              backgroundColor: speechStyle.color || '#ffffff',
                              borderColor: speechStyle.borderColor || '#000000'
                            }}
                            onMouseDown={(e) => handleMouseDown(e, page.id, speechPos)}
                          >
                            {speechText}
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewTab;