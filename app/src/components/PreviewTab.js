import React, { useState, useRef, useEffect } from 'react';
import './PreviewTab.css';

function PreviewTab({ pages, speechData, language, onPagesUpdate, sweetSpot, onSweetSpotChange }) {
  const [dragState, setDragState] = useState({
    isDragging: false,
    pageId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });
  const [currentRow, setCurrentRow] = useState(0);
  const scrollContainerRef = useRef(null);

  // Helper function to find speech for a page
  const getSpeechForPage = (page) => {
    if (!page.speechId) return null;
    
    // Find all speeches with matching ID
    const matchingSpeech = speechData.filter(speech => 
      String(speech.id) === String(page.speechId)
    );
    
    if (matchingSpeech.length === 0) return null;
    
    // Return the speech at current row index (cycling if necessary)
    return matchingSpeech[currentRow % matchingSpeech.length];
  };

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        const idx = Math.floor(scrollTop / (sweetSpot || 600));
        if (idx !== currentRow) {
          setCurrentRow(idx);
        }
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentRow, sweetSpot]);

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
        <div className="preview-controls">
          <div className="sweet-spot-control">
            <label htmlFor="sweet-spot">Sweet Spot:</label>
            <input
              id="sweet-spot"
              type="number"
              min="100"
              max="2000"
              step="50"
              value={sweetSpot}
              onChange={(e) => onSweetSpotChange(parseInt(e.target.value))}
              className="sweet-spot-input"
            />
            <span className="sweet-spot-unit">px</span>
          </div>
          <span className="preview-info">
            {pages.length} pages | {speechData.length} dialogues | Language: {language.toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="preview-scroll-container" ref={scrollContainerRef}>
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
                        const speechStyle = page.speechStyle || { 
                          shape: 'rounded', 
                          color: 'white', 
                          borderColor: 'black', 
                          size: 'medium', 
                          animation: 'fadeIn',
                          tail: 'left',
                          anim: 'fade'
                        };
                        const animClass = `anim-${speechStyle.anim || 'fade'}`;
                        const tailClass = `tail-${speechStyle.tail || 'left'}`;
                        return (
                          <div 
                            className={`speech draggable speech-${speechStyle.shape} speech-${speechStyle.size} ${animClass} ${tailClass}`}
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