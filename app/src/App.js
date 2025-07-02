import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import PagesPanel from './components/PagesPanel';
import SpeechTab from './components/SpeechTab';
import PreviewTab from './components/PreviewTab';

function App() {
  const [activeTab, setActiveTab] = useState('ページ');
  const [pages, setPages] = useState([]);
  const [speechData, setSpeechData] = useState([]);
  const [language, setLanguage] = useState('ja');
  const [lastSaveTime, setLastSaveTime] = useState(null);

  // Load project on startup
  useEffect(() => {
    loadProject();
  }, []);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'ページ':
        return <PagesPanel pages={pages} onPagesUpdate={setPages} />;
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
          {lastSaveTime && (
            <span className="save-status">
              自動保存: {new Date(lastSaveTime).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;