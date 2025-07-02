import React from 'react';
import './PreviewPanel.css';

function PreviewPanel({ pages }) {
  return (
    <div className="preview-panel">
      <h2>Preview</h2>
      {pages.length === 0 ? (
        <p className="no-pages">No pages added yet</p>
      ) : (
        <div className="preview-container">
          {pages.map((page, index) => (
            <div key={page.id} className="preview-page">
              <h3>Page {index + 1}</h3>
              <img src={page.url} alt={`Page ${index + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PreviewPanel;