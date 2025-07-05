import React, { useState, useEffect } from 'react';
import useUndo from 'use-undo';
import './App.css';
import Sidebar from './components/Sidebar';
import PagesPanel from './components/PagesPanel';
import SpeechTab from './components/SpeechTab';
import PreviewTab from './components/PreviewTab';
import ExportDialog from './components/ExportDialog';

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
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [sections, setSections] = useState([
    { name: 'Start', startIndex: 0 },
    { name: 'Normal', startIndex: 0 },
    { name: 'Big', startIndex: 0 }
  ]);
  const [sweetSpot, setSweetSpot] = useState(600);
  const [delayRows, setDelayRows] = useState(1);

  // Load project on startup
  useEffect(() => {
    loadProject();
    loadSettings();
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

  // Save sweet spot to settings when it changes
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.setSweetSpot) {
      window.electronAPI.setSweetSpot(sweetSpot);
    }
  }, [sweetSpot]);

  // Save delay rows to settings when it changes
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.setDelayRows) {
      window.electronAPI.setDelayRows(delayRows);
    }
  }, [delayRows]);

  const loadProject = async () => {
    if (window.electronAPI && window.electronAPI.loadProject) {
      const result = await window.electronAPI.loadProject();
      if (result && result.success && result.data) {
        setPages(result.data.pages || []);
        setSpeechData(result.data.speechData || []);
        setLanguage(result.data.language || 'ja');
        setLastSaveTime(result.data.lastSaveTime);
        setSections(result.data.sections || [
          { name: 'Start', startIndex: 0 },
          { name: 'Normal', startIndex: 0 },
          { name: 'Big', startIndex: 0 }
        ]);
        // Don't load sweetSpot from project data - load from settings instead
      }
    }
  };

  const loadSettings = async () => {
    if (window.electronAPI) {
      if (window.electronAPI.getSweetSpot) {
        const sweetSpotValue = await window.electronAPI.getSweetSpot();
        setSweetSpot(sweetSpotValue || 600);
      }
      if (window.electronAPI.getDelayRows) {
        const delayRowsValue = await window.electronAPI.getDelayRows();
        setDelayRows(delayRowsValue || 1);
      }
    }
  };

  const saveProject = async () => {
    if (window.electronAPI && window.electronAPI.saveProject) {
      // Group pages by their group property
      const groupedPages = {
        Start: pages.filter(page => page.group === 'Start'),
        Normal: pages.filter(page => page.group === 'Normal' || !page.group),
        Big: pages.filter(page => page.group === 'Big')
      };
      
      // Get pages in correct order (Start → Normal → Big)
      const orderedPages = [...groupedPages.Start, ...groupedPages.Normal, ...groupedPages.Big];
      
      // Calculate section indices based on the ordered pages
      const updatedSections = [
        { name: 'Start', startIndex: 0 },
        { name: 'Normal', startIndex: groupedPages.Start.length },
        { name: 'Big', startIndex: groupedPages.Start.length + groupedPages.Normal.length }
      ];
      
      const projectData = {
        pages: orderedPages,  // Save pages in the correct order
        speechData,
        language,
        sections: updatedSections,
        sweetSpot,
        lastSaveTime: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const result = await window.electronAPI.saveProject(projectData);
      if (result.success) {
        setLastSaveTime(projectData.lastSaveTime);
        setSections(updatedSections);
      }
    }
  };

  const handleExport = async (options = {}) => {
    if (!window.electronAPI || !window.electronAPI.exportProject) return;
    
    setIsExporting(true);
    try {
      // Group pages by their group property
      const groupedPages = {
        Start: pages.filter(page => page.group === 'Start'),
        Normal: pages.filter(page => page.group === 'Normal' || !page.group),
        Big: pages.filter(page => page.group === 'Big')
      };
      
      // Get pages in correct order (Start → Normal → Big)
      const orderedPages = [...groupedPages.Start, ...groupedPages.Normal, ...groupedPages.Big];
      
      // Calculate section indices for export
      const exportSections = [
        { name: 'Start', startIndex: 0 },
        { name: 'Normal', startIndex: groupedPages.Start.length },
        { name: 'Big', startIndex: groupedPages.Start.length + groupedPages.Normal.length }
      ];
      
      const projectData = {
        pages: orderedPages,  // Export pages in the correct order
        speechData,
        language,
        sections: exportSections,
        sweetSpot,
        delayRows,
        title: 'manga-project', // You can make this customizable
        version: '1.0.0',
        compressToWebP: options.compressToWebP || false
      };
      
      const result = await window.electronAPI.exportProject(projectData);
      if (!result.success) {
        console.error('Export failed:', result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
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
            sweetSpot={sweetSpot}
            onSweetSpotChange={setSweetSpot}
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
              onClick={() => setShowExportDialog(true)}
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
      
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
}

export default App;