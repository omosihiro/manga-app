import React, { useState, useRef, useCallback } from 'react';
import './SpeechTab.css';

function SpeechTab({ speechData, onSpeechDataUpdate, language, onLanguageChange }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState(null);
  const [autoTranslatedRows, setAutoTranslatedRows] = useState(new Set());

  const parseCSV = (text) => {
    const rows = [];
    const lines = text.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Find column indices
    const idIndex = headers.indexOf('id');
    const jaIndex = headers.indexOf('ja');
    const enIndex = headers.indexOf('en');
    
    if (idIndex === -1 || jaIndex === -1 || enIndex === -1) {
      throw new Error('CSV must contain columns: id, ja, en');
    }
    
    // Simple CSV parser that handles quoted fields with newlines
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = lines[0].length + 1; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' && !inQuotes) {
        currentRow.push(currentField);
        if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
          rows.push({
            id: currentRow[idIndex] || `row-${rows.length}`,
            ja: (currentRow[jaIndex] || '').replace(/\\n/g, '<br>'),
            en: (currentRow[enIndex] || '').replace(/\\n/g, '<br>')
          });
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Handle last field/row
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      if (currentRow.some(f => f.trim())) {
        rows.push({
          id: currentRow[idIndex] || `row-${rows.length}`,
          ja: (currentRow[jaIndex] || '').replace(/\\n/g, '<br>'),
          en: (currentRow[enIndex] || '').replace(/\\n/g, '<br>')
        });
      }
    }
    
    return rows;
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

  const validateData = (data) => {
    const errors = [];
    
    // Check for duplicate IDs
    const idMap = new Map();
    data.forEach((row, index) => {
      if (idMap.has(row.id)) {
        errors.push(`Duplicate ID '${row.id}' found at rows ${idMap.get(row.id) + 1} and ${index + 1}`);
      } else {
        idMap.set(row.id, index);
      }
    });
    
    // Check for empty ja/en fields
    data.forEach((row, index) => {
      if (!row.ja || row.ja.trim() === '') {
        errors.push(`Row ${index + 1} (ID: ${row.id}) has empty Japanese text`);
      }
      if (!row.en || row.en.trim() === '') {
        errors.push(`Row ${index + 1} (ID: ${row.id}) has empty English text`);
      }
    });
    
    return errors;
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
        
        // Validate the data
        const errors = validateData(data);
        
        if (errors.length > 0) {
          setValidationErrors(errors);
          setPendingImportData(data);
          setShowValidationModal(true);
        } else {
          onSpeechDataUpdate(data);
        }
      } catch (error) {
        alert(`Error parsing file: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleImportAnyway = () => {
    if (pendingImportData) {
      onSpeechDataUpdate(pendingImportData);
      setShowValidationModal(false);
      setPendingImportData(null);
      setValidationErrors([]);
    }
  };

  const handleAbortImport = () => {
    setShowValidationModal(false);
    setPendingImportData(null);
    setValidationErrors([]);
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
    
    // Remove auto-translated flag if user manually edits English text
    if (field === 'en' && autoTranslatedRows.has(rowIndex)) {
      setAutoTranslatedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(rowIndex);
        return newSet;
      });
    }
    
    onSpeechDataUpdate(newData);
  };

  // Mock Google Translate API (replace with actual API call if key is available)
  const translateText = async (text) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simple mock translation - in production, use actual Google Translate API
    // if (process.env.REACT_APP_GOOGLE_TRANSLATE_KEY) {
    //   // Call actual Google Translate API
    // }
    
    // Mock translation: reverse the Japanese text as a placeholder
    const mockTranslations = {
      'こんにちは': 'Hello',
      'ありがとう': 'Thank you',
      'さようなら': 'Goodbye',
      'はい': 'Yes',
      'いいえ': 'No'
    };
    
    return mockTranslations[text] || `[Auto] ${text}`;
  };

  const handleJapaneseBlur = async (rowIndex) => {
    const row = speechData[rowIndex];
    
    // Only translate if English is empty and Japanese has content
    if ((!row.en || row.en.trim() === '') && row.ja && row.ja.trim() !== '') {
      try {
        const translatedText = await translateText(row.ja);
        
        // Update the English text
        const newData = [...speechData];
        newData[rowIndex].en = translatedText;
        onSpeechDataUpdate(newData);
        
        // Mark as auto-translated
        setAutoTranslatedRows(prev => new Set(prev).add(rowIndex));
      } catch (error) {
        console.error('Translation error:', error);
      }
    }
  };

  const handleTextareaKeyDown = (e, rowIndex, field) => {
    // Option+Enter to insert <br>
    if (e.key === 'Enter' && e.altKey) {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;
      const newValue = currentValue.substring(0, start) + '<br>' + currentValue.substring(end);
      
      handleCellEdit(rowIndex, field, newValue);
      
      // Set cursor position after <br>
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const adjustTextareaHeight = (textarea) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const exportToCSV = () => {
    let csv = 'id,ja,en\n';
    
    speechData.forEach(row => {
      // Convert <br> and actual line breaks to \n for CSV export
      const id = row.id;
      const ja = row.ja
        .replace(/<br>/g, '\\n')  // Replace <br> tags
        .replace(/\r\n/g, '\\n')  // Replace Windows line breaks
        .replace(/\n/g, '\\n')     // Replace Unix line breaks
        .replace(/\r/g, '\\n')     // Replace old Mac line breaks
        .replace(/"/g, '""');    // Escape quotes
      const en = row.en
        .replace(/<br>/g, '\\n')  // Replace <br> tags
        .replace(/\r\n/g, '\\n')  // Replace Windows line breaks
        .replace(/\n/g, '\\n')     // Replace Unix line breaks
        .replace(/\r/g, '\\n')     // Replace old Mac line breaks
        .replace(/"/g, '""');    // Escape quotes
      
      csv += `"${id}","${ja}","${en}"\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `speech_data_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateNextId = useCallback(() => {
    // Find the highest numeric ID
    let maxNum = 0;
    speechData.forEach(row => {
      const match = row.id.match(/^speech(\d+)$/);
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1]));
      }
    });
    return `speech${maxNum + 1}`;
  }, [speechData]);

  const addRow = () => {
    const newRow = {
      id: generateNextId(),
      ja: '',
      en: ''
    };
    onSpeechDataUpdate([...speechData, newRow]);
  };

  const deleteRow = (index) => {
    const newData = speechData.filter((_, i) => i !== index);
    onSpeechDataUpdate(newData);
    // Clear selection if deleted row was selected
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    // Clear auto-translated flag for deleted row
    setAutoTranslatedRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      // Adjust indices for rows after the deleted one
      const adjustedSet = new Set();
      newSet.forEach(idx => {
        if (idx > index) {
          adjustedSet.add(idx - 1);
        } else if (idx < index) {
          adjustedSet.add(idx);
        }
      });
      return adjustedSet;
    });
  };

  const deleteSelectedRows = useCallback(() => {
    if (selectedRows.size === 0) return;
    const newData = speechData.filter((_, index) => !selectedRows.has(index));
    onSpeechDataUpdate(newData);
    setSelectedRows(new Set());
  }, [selectedRows, speechData, onSpeechDataUpdate]);

  const duplicateSelectedRows = useCallback(() => {
    if (selectedRows.size === 0) return;
    
    const sortedIndices = Array.from(selectedRows).sort((a, b) => a - b);
    
    // Get the current max ID first
    let maxNum = 0;
    speechData.forEach(row => {
      const match = row.id.match(/^speech(\d+)$/);
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1]));
      }
    });
    
    // Create new data array with duplicates inserted after each original
    const newData = [...speechData];
    let insertOffset = 0;
    
    sortedIndices.forEach((originalIndex, i) => {
      const insertIndex = originalIndex + insertOffset + 1;
      const originalRow = speechData[originalIndex];
      const newRow = {
        ...originalRow,
        id: `speech${maxNum + i + 1}`,
        ja: originalRow.ja,
        en: originalRow.en
      };
      newData.splice(insertIndex, 0, newRow);
      insertOffset++;
    });
    
    onSpeechDataUpdate(newData);
    setSelectedRows(new Set());
  }, [selectedRows, speechData, onSpeechDataUpdate]);

  const resequenceIds = useCallback(() => {
    const newData = speechData.map((row, index) => ({
      ...row,
      id: `speech${index + 1}`
    }));
    onSpeechDataUpdate(newData);
  }, [speechData, onSpeechDataUpdate]);

  const handleRowClick = (e, index) => {
    e.preventDefault();
    
    const metaKey = e.metaKey || e.ctrlKey;
    const shiftKey = e.shiftKey;
    
    if (!metaKey && !shiftKey) {
      // Regular click - select only this row
      setSelectedRows(new Set([index]));
      setLastSelectedIndex(index);
    } else if (metaKey) {
      // Cmd/Ctrl click - toggle selection
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
      setLastSelectedIndex(index);
    } else if (shiftKey && lastSelectedIndex !== null) {
      // Shift click - select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSet = new Set(selectedRows);
      for (let i = start; i <= end; i++) {
        newSet.add(i);
      }
      setSelectedRows(newSet);
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Select All (Cmd/Ctrl + A)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        const allIndices = new Set(speechData.map((_, i) => i));
        setSelectedRows(allIndices);
      }
      // Deselect All (Escape)
      else if (e.key === 'Escape') {
        setSelectedRows(new Set());
      }
      // Delete selected (Delete or Backspace)
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRows.size > 0) {
        // Only if not typing in an input
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          deleteSelectedRows();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speechData, selectedRows, deleteSelectedRows]);

  // Get color class for character count
  const getCharCountClass = (length) => {
    if (length === 0) return 'char-count-empty';
    if (length <= 20) return 'char-count-short';
    if (length <= 40) return 'char-count-medium';
    if (length <= 60) return 'char-count-long';
    if (length <= 80) return 'char-count-very-long';
    return 'char-count-extreme';
  };

  // Auto-adjust textarea heights when data changes
  React.useEffect(() => {
    const textareas = document.querySelectorAll('.cell-textarea.auto-grow');
    textareas.forEach(textarea => {
      adjustTextareaHeight(textarea);
    });
  }, [speechData]);

  // Filter speech data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return speechData;
    
    const query = searchQuery.toLowerCase();
    return speechData.filter(row => 
      row.id.toLowerCase().includes(query) ||
      row.ja.toLowerCase().includes(query) ||
      row.en.toLowerCase().includes(query)
    );
  }, [speechData, searchQuery]);

  // Highlight matching text
  const highlightText = (text, isTextarea = false) => {
    if (!searchQuery.trim() || !text) return text;
    
    const query = searchQuery.toLowerCase();
    const lowerText = text.toLowerCase();
    const parts = [];
    let lastIndex = 0;
    let index = lowerText.indexOf(query);
    
    // Find all occurrences and create parts
    while (index !== -1) {
      // Add text before match
      if (index > lastIndex) {
        parts.push(text.slice(lastIndex, index));
      }
      // Add matched text
      parts.push(
        <mark key={`match-${index}`} className="search-highlight">
          {text.slice(index, index + searchQuery.length)}
        </mark>
      );
      lastIndex = index + searchQuery.length;
      index = lowerText.indexOf(query, lastIndex);
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? <>{parts}</> : text;
  };

  // Update selected rows when filtering
  React.useEffect(() => {
    if (searchQuery) {
      // Clear selection when searching to avoid confusion
      setSelectedRows(new Set());
    }
  }, [searchQuery]);

  // Replace All function
  const handleReplaceAll = useCallback(() => {
    if (!findText.trim()) return;
    
    const find = findText.toLowerCase();
    let replacedCount = 0;
    
    const newData = speechData.map(row => {
      let jaUpdated = row.ja;
      let enUpdated = row.en;
      let rowChanged = false;
      
      // Case-insensitive replace for Japanese text
      if (row.ja && row.ja.toLowerCase().includes(find)) {
        const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        jaUpdated = row.ja.replace(regex, replaceText);
        rowChanged = true;
      }
      
      // Case-insensitive replace for English text
      if (row.en && row.en.toLowerCase().includes(find)) {
        const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        enUpdated = row.en.replace(regex, replaceText);
        rowChanged = true;
      }
      
      if (rowChanged) {
        replacedCount++;
        return { ...row, ja: jaUpdated, en: enUpdated };
      }
      
      return row;
    });
    
    if (replacedCount > 0) {
      onSpeechDataUpdate(newData);
      alert(`Replaced in ${replacedCount} rows`);
    } else {
      alert('No matches found');
    }
  }, [findText, replaceText, speechData, onSpeechDataUpdate]);

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
          {selectedRows.size > 0 && (
            <div className="selection-toolbar">
              <span className="selection-count">{selectedRows.size} selected</span>
              <div className="toolbar-actions">
                <button 
                  className="toolbar-btn"
                  onClick={duplicateSelectedRows}
                  title="Duplicate selected rows"
                >
                  ⎘ Duplicate
                </button>
                <button 
                  className="toolbar-btn delete-btn"
                  onClick={deleteSelectedRows}
                  title="Delete selected rows"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          )}
          
          <div className="find-replace-controls">
            <div className="find-replace-inputs">
              <input
                type="text"
                placeholder="Find..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="find-input"
              />
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="replace-input"
              />
              <button
                className="replace-all-btn"
                onClick={handleReplaceAll}
                disabled={!findText.trim()}
                title="Replace all occurrences in ja and en fields"
              >
                Replace All
              </button>
            </div>
          </div>
          
          <div className="table-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by ID, Japanese, or English..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
              {searchQuery && (
                <span className="search-results">
                  {filteredData.length} / {speechData.length} results
                </span>
              )}
            </div>
          </div>
          
          <div className="table-actions">
            <button onClick={addRow} className="add-row-btn">+ Add Row</button>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="upload-new-btn"
            >
              Upload New File
            </button>
            <button 
              onClick={exportToCSV} 
              className="export-btn"
              title="Export to CSV"
            >
              Export CSV
            </button>
            <button 
              onClick={resequenceIds} 
              className="resequence-btn"
              title="Resequence all IDs starting from 1"
            >
              Resequence IDs
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
                <th>Style</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, filteredIndex) => {
                // Find the original index in speechData for proper operations
                const originalIndex = speechData.findIndex(item => item.id === row.id);
                const isMissingEn = !row.en || row.en.trim() === '';
                const isMissingJa = !row.ja || row.ja.trim() === '';
                const isMissingTranslation = isMissingEn || isMissingJa;
                const rowClasses = [
                  selectedRows.has(originalIndex) ? 'selected' : '',
                  isMissingTranslation ? 'missing-trans' : ''
                ].filter(Boolean).join(' ');
                
                return (
                <tr 
                  key={row.id}
                  className={rowClasses}
                  onClick={(e) => {
                    // Only handle row click if not clicking on inputs
                    if (e.target.tagName !== 'INPUT' && 
                        e.target.tagName !== 'TEXTAREA' && 
                        e.target.tagName !== 'BUTTON') {
                      handleRowClick(e, originalIndex);
                    }
                  }}
                >
                  <td>
                    <div className="id-cell">
                      {searchQuery ? (
                        <div className="cell-display">
                          {highlightText(row.id)}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={row.id}
                          onChange={(e) => handleCellEdit(originalIndex, 'id', e.target.value)}
                          className="cell-input"
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="textarea-cell">
                      {searchQuery ? (
                        <div className="textarea-highlight-container">
                          <div className="textarea-highlight-text">
                            {highlightText(row.ja)}
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={row.ja}
                          onChange={(e) => {
                            handleCellEdit(originalIndex, 'ja', e.target.value);
                            adjustTextareaHeight(e.target);
                          }}
                          onKeyDown={(e) => handleTextareaKeyDown(e, originalIndex, 'ja')}
                          onFocus={(e) => adjustTextareaHeight(e.target)}
                          onBlur={() => handleJapaneseBlur(originalIndex)}
                          className="cell-textarea auto-grow"
                          rows="1"
                          placeholder="Japanese text (⌥↩ for new line)"
                        />
                      )}
                      {row.ja && (
                        <span className={`char-counter ${getCharCountClass(row.ja.length)}`}>
                          {row.ja.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="textarea-cell">
                      {searchQuery ? (
                        <div className="textarea-highlight-container">
                          <div className={`textarea-highlight-text ${autoTranslatedRows.has(originalIndex) ? 'auto-translated' : ''}`}>
                            {highlightText(row.en)}
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={row.en}
                          onChange={(e) => {
                            handleCellEdit(originalIndex, 'en', e.target.value);
                            adjustTextareaHeight(e.target);
                          }}
                          onKeyDown={(e) => handleTextareaKeyDown(e, originalIndex, 'en')}
                          onFocus={(e) => adjustTextareaHeight(e.target)}
                          className={`cell-textarea auto-grow ${autoTranslatedRows.has(originalIndex) ? 'auto-translated' : ''}`}
                          rows="1"
                          placeholder="English text (⌥↩ for new line)"
                        />
                      )}
                      {row.en && (
                        <span className={`char-counter ${getCharCountClass(row.en.length)}`}>
                          {row.en.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="style-cell">
                    {isMissingJa && (
                      <span className="translation-badge missing-ja">Missing JA</span>
                    )}
                    {isMissingEn && (
                      <span className="translation-badge missing-en">未翻訳</span>
                    )}
                    {autoTranslatedRows.has(originalIndex) && !isMissingEn && (
                      <span className="translation-badge auto-badge">Auto</span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => deleteRow(originalIndex)}
                      className="delete-btn"
                      title="Delete row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Validation Error Modal */}
      {showValidationModal && (
        <div className="validation-modal-overlay" onClick={handleAbortImport}>
          <div className="validation-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Import Validation Errors</h2>
            <p className="validation-warning">
              The following issues were found in the CSV/TSV file:
            </p>
            
            <div className="validation-errors-list">
              {validationErrors.map((error, index) => (
                <div key={index} className="validation-error-item">
                  • {error}
                </div>
              ))}
            </div>
            
            <div className="validation-modal-actions">
              <button 
                className="abort-btn"
                onClick={handleAbortImport}
              >
                Abort Import
              </button>
              <button 
                className="import-anyway-btn"
                onClick={handleImportAnyway}
              >
                Import Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeechTab;