import React, { useState, useRef } from 'react';
import './SpeechTab.css';

function SpeechTab({ speechData, onSpeechDataUpdate, language, onLanguageChange }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Find column indices
    const idIndex = headers.indexOf('id');
    const jaIndex = headers.indexOf('ja');
    const enIndex = headers.indexOf('en');
    
    if (idIndex === -1 || jaIndex === -1 || enIndex === -1) {
      throw new Error('CSV must contain columns: id, ja, en');
    }
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      return {
        id: values[idIndex] || `row-${index}`,
        ja: values[jaIndex] || '',
        en: values[enIndex] || ''
      };
    });
  };

  const parseTXT = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].toLowerCase().split('\t').map(h => h.trim());
    
    // Find column indices
    const idIndex = headers.indexOf('id');
    const jaIndex = headers.indexOf('ja');
    const enIndex = headers.indexOf('en');
    
    if (idIndex === -1 || jaIndex === -1 || enIndex === -1) {
      throw new Error('TXT must contain tab-separated columns: id, ja, en');
    }
    
    return lines.slice(1).map((line, index) => {
      const values = line.split('\t').map(v => v.trim());
      return {
        id: values[idIndex] || `row-${index}`,
        ja: values[jaIndex] || '',
        en: values[enIndex] || ''
      };
    });
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        let data;
        
        if (file.name.endsWith('.csv')) {
          data = parseCSV(text);
        } else if (file.name.endsWith('.txt')) {
          data = parseTXT(text);
        } else {
          alert('Please upload a .csv or .txt file');
          return;
        }
        
        onSpeechDataUpdate(data);
      } catch (error) {
        alert(`Error parsing file: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

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
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleCellEdit = (rowIndex, field, value) => {
    const newData = [...speechData];
    newData[rowIndex][field] = value;
    onSpeechDataUpdate(newData);
  };

  const addRow = () => {
    const newRow = {
      id: `row-${Date.now()}`,
      ja: '',
      en: ''
    };
    onSpeechDataUpdate([...speechData, newRow]);
  };

  const deleteRow = (index) => {
    const newData = speechData.filter((_, i) => i !== index);
    onSpeechDataUpdate(newData);
  };

  return (
    <div className="speech-tab">
      <div className="speech-header">
        <h2>Speech Data</h2>
        <div className="language-selector">
          <label>Language:</label>
          <select value={language} onChange={(e) => onLanguageChange(e.target.value)}>
            <option value="ja">Japanese (ja)</option>
            <option value="en">English (en)</option>
          </select>
        </div>
      </div>

      {speechData.length === 0 ? (
        <div 
          className={`upload-area ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-content">
            <p>Drag & Drop CSV or TXT file here</p>
            <p>or click to select</p>
            <p className="file-format">File must contain columns: id, ja, en</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="speech-table-container">
          <div className="table-actions">
            <button onClick={addRow} className="add-row-btn">+ Add Row</button>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="upload-new-btn"
            >
              Upload New File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
          
          <table className="speech-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Japanese (ja)</th>
                <th>English (en)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {speechData.map((row, index) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="text"
                      value={row.id}
                      onChange={(e) => handleCellEdit(index, 'id', e.target.value)}
                      className="cell-input"
                    />
                  </td>
                  <td>
                    <textarea
                      value={row.ja}
                      onChange={(e) => handleCellEdit(index, 'ja', e.target.value)}
                      className="cell-textarea"
                      rows="2"
                    />
                  </td>
                  <td>
                    <textarea
                      value={row.en}
                      onChange={(e) => handleCellEdit(index, 'en', e.target.value)}
                      className="cell-textarea"
                      rows="2"
                    />
                  </td>
                  <td>
                    <button 
                      onClick={() => deleteRow(index)}
                      className="delete-btn"
                      title="Delete row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SpeechTab;