import React, { useState, useEffect } from 'react';
import './ExportDialog.css';

function ExportDialog({ isOpen, onClose, onExport, isExporting }) {
  const [compressToWebP, setCompressToWebP] = useState(false);
  const [exportPath, setExportPath] = useState('');

  useEffect(() => {
    if (isOpen && window.electronAPI) {
      window.electronAPI.getExportPath().then(path => {
        setExportPath(path);
      });
    }
  }, [isOpen]);

  const handleExport = () => {
    onExport({ compressToWebP });
  };

  const handleOpenFolder = async () => {
    if (window.electronAPI) {
      await window.electronAPI.openExportFolder();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>エクスポート設定</h2>
        
        <div className="export-path-info">
          <div className="export-path-row">
            <span className="export-path-label">保存先:</span>
            <span className="export-path">{exportPath}</span>
          </div>
          <button 
            className="open-folder-button"
            onClick={handleOpenFolder}
            disabled={isExporting}
          >
            フォルダを開く
          </button>
        </div>
        
        <div className="export-options">
          <label className="export-option">
            <input
              type="checkbox"
              checked={compressToWebP}
              onChange={(e) => setCompressToWebP(e.target.checked)}
              disabled={isExporting}
            />
            <span>画像をWebPに圧縮 (品質 85)</span>
            <span className="option-description">
              PNGファイルをWebP形式に変換してファイルサイズを削減します
            </span>
          </label>
        </div>

        <div className="export-dialog-actions">
          <button 
            className="cancel-button" 
            onClick={onClose}
            disabled={isExporting}
          >
            キャンセル
          </button>
          <button 
            className="export-confirm-button" 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'エクスポート中...' : 'エクスポート'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;