import React, { useState, useEffect } from 'react';
import './PreviewTab.css';

function PreviewTab({ pages, speechData, language }) {
  const [speechBalloons, setSpeechBalloons] = useState([]);

  // Parse speech data to extract page and position info from IDs
  useEffect(() => {
    const balloons = speechData.map(item => {
      // Extract page number and bubble position from ID
      // Expected format: page1_bubble1, page2_bubble1, etc.
      const match = item.id.match(/page(\d+)_bubble(\d+)/);
      if (match) {
        const pageNum = parseInt(match[1]) - 1; // Convert to 0-based index
        const bubbleNum = parseInt(match[2]);
        
        // Default positions for speech balloons
        // You can customize these based on your manga layout
        const positions = {
          1: { top: '10%', left: '60%' },
          2: { top: '30%', left: '20%' },
          3: { top: '50%', left: '70%' },
          4: { top: '70%', left: '30%' },
          5: { top: '85%', left: '50%' }
        };
        
        return {
          ...item,
          pageIndex: pageNum,
          bubbleNum: bubbleNum,
          position: positions[bubbleNum] || { top: '50%', left: '50%' }
        };
      }
      return null;
    }).filter(Boolean);
    
    setSpeechBalloons(balloons);
  }, [speechData]);

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
              <div key={page.id} className="preview-page-wrapper">
                <div className="page-number">Page {pageIndex + 1}</div>
                <div className="preview-page">
                  <img 
                    src={page.url} 
                    alt={`Page ${pageIndex + 1}`} 
                    className="page-image"
                  />
                  
                  {/* Render speech balloons for this page */}
                  {speechBalloons
                    .filter(balloon => balloon.pageIndex === pageIndex)
                    .map((balloon, index) => (
                      <div
                        key={balloon.id}
                        className="speech-balloon"
                        style={{
                          top: balloon.position.top,
                          left: balloon.position.left
                        }}
                      >
                        <div className="balloon-content">
                          {balloon[language] || balloon.ja || balloon.en || '(empty)'}
                        </div>
                        <div className="balloon-tail"></div>
                      </div>
                    ))
                  }
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