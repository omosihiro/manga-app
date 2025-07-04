import React, { useState, useEffect } from 'react';
import useUndo from 'use-undo';
import './App.css';
import Sidebar from './components/Sidebar';
import PagesPanel from './components/PagesPanel';
import SpeechTab from './components/SpeechTab';
import PreviewTab from './components/PreviewTab';

function App() {
  const [activeTab, setActiveTab] = useState('ページ');
  
  // Use undo/redo for pages
  const [pagesState, {
    set: setPages,
    reset: resetPages,
    undo: undoPages,
    redo: redoPages,
    canUndo: canUndoPages,
    canRedo: canRedoPages
  }] = useUndo([]);
  const { present: pages } = pagesState;
  
  // Use undo/redo for speech data
  const [speechState, {
    set: setSpeechData,
    reset: resetSpeechData,
    undo: undoSpeechData,
    redo: redoSpeechData,
    canUndo: canUndoSpeechData,
    canRedo: canRedoSpeechData
  }] = useUndo([]);
  const { present: speechData } = speechState;
  
  const [language, setLanguage] = useState('ja');
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Load project on startup
  useEffect(() => {
    loadProject();
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (activeTab === 'ページ' && canUndoPages) {
          undoPages();
        } else if (activeTab === 'セリフ' && canUndoSpeechData) {
          undoSpeechData();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (activeTab === 'ページ' && canRedoPages) {
          redoPages();
        } else if (activeTab === 'セリフ' && canRedoSpeechData) {
          redoSpeechData();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, canUndoPages, canRedoPages, canUndoSpeechData, canRedoSpeechData, undoPages, redoPages, undoSpeechData, redoSpeechData]);

  // Auto-save when pages or speech data change
  useEffect(() => {
    if (pages.length > 0 || speechData.length > 0) {
      saveProject();
    }
  }, [pages, speechData, language]);

  const loadProject = async () => {
    if (window.electronAPI && window.electronAPI.loadProject) {
      const result = await window.electronAPI.loadProject();
      if (result.success && result.data) {
        setPages(result.data.pages || []);
        setSpeechData(result.data.speechData || []);
        setLanguage(result.data.language || 'ja');
        setLastSaveTime(result.data.lastSaveTime);
      }
    }
  };

  const saveProject = async () => {
    if (window.electronAPI && window.electronAPI.saveProject) {
      const projectData = {
        pages,
        speechData,
        language,
        lastSaveTime: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const result = await window.electronAPI.saveProject(projectData);
      if (result.success) {
        setLastSaveTime(projectData.lastSaveTime);
      }
    }
  };

  const handleExport = async () => {
    if (!window.electronAPI || !window.electronAPI.exportProject) return;
    
    setIsExporting(true);
    try {
      const projectData = {
        pages,
        speechData,
        language,
        title: 'manga-project', // You can make this customizable
        version: '1.0.0'
      };
      
      const result = await window.electronAPI.exportProject(projectData);
      if (!result.success) {
        console.error('Export failed:', result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Combined undo/redo handlers
  const handleUndo = () => {
    if (activeTab === 'ページ' && canUndoPages) {
      undoPages();
    } else if (activeTab === 'セリフ' && canUndoSpeechData) {
      undoSpeechData();
    }
  };

  const handleRedo = () => {
    if (activeTab === 'ページ' && canRedoPages) {
      redoPages();
    } else if (activeTab === 'セリフ' && canRedoSpeechData) {
      redoSpeechData();
    }
  };

  const canUndo = (activeTab === 'ページ' && canUndoPages) || 
                  (activeTab === 'セリフ' && canUndoSpeechData);
  const canRedo = (activeTab === 'ページ' && canRedoPages) || 
                  (activeTab === 'セリフ' && canRedoSpeechData);

  const renderContent = () => {
    switch (activeTab) {
      case 'ページ':
        return <PagesPanel pages={pages} onPagesUpdate={setPages} speechData={speechData} />;
      case 'セリフ':
        return (
          <SpeechTab 
            speechData={speechData} 
            onSpeechDataUpdate={setSpeechData}
            language={language}
            onLanguageChange={setLanguage}
          />
        );
      case 'プレビュー':
        return (
          <PreviewTab 
            pages={pages} 
            speechData={speechData}
            language={language}
            onPagesUpdate={setPages}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="main-content">
        <div className="content-header">
          <h1>マンガクリエイター</h1>
          <div className="header-actions">
            {lastSaveTime && (
              <span className="save-status">
                自動保存: {new Date(lastSaveTime).toLocaleTimeString()}
              </span>
            )}
            <div className="undo-redo-buttons">
              <button 
                className="undo-button" 
                onClick={handleUndo}
                disabled={!canUndo}
                title="元に戻す (Ctrl+Z)"
              >
                ↶ 元に戻す
              </button>
              <button 
                className="redo-button" 
                onClick={handleRedo}
                disabled={!canRedo}
                title="やり直す (Ctrl+Y)"
              >
                ↷ やり直す
              </button>
            </div>
            <button 
              className="export-button" 
              onClick={handleExport}
              disabled={isExporting || pages.length === 0}
            >
              {isExporting ? 'エクスポート中...' : 'エクスポート'}
            </button>
          </div>
        </div>
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;