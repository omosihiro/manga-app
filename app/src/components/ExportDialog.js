import React, { useState, useEffect } from 'react';
import './ExportDialog.css';

function ExportDialog({ isOpen, onClose, onExport, isExporting }) {
  const [compressToWebP, setCompressToWebP] = useState(false);
  const [exportPath, setExportPath] = useState('');
  const [quality, setQuality] = useState(85);

  useEffect(() => {
    if (isOpen && window.electronAPI) {
      window.electronAPI.getExportPath().then(path => {
        setExportPath(path);
      });
    }
  }, [isOpen]);

  const handleExport = () => {
    onExport({ compressToWebP, quality });
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
            <span>画像をWebPに圧縮</span>
            <span className="option-description">
              PNGファイルをWebP形式に変換してファイルサイズを削減します
            </span>
          </label>
          
          {compressToWebP && (
            <div className="quality-control">
              <label htmlFor="quality-slider">
                圧縮品質: <span className="quality-value">{quality}%</span>
              </label>
              <div className="slider-container">
                <span className="slider-label">50</span>
                <input
                  id="quality-slider"
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="quality-slider"
                  disabled={isExporting}
                />
                <span className="slider-label">100</span>
              </div>
              <div className="quality-hint">
                {quality >= 90 ? '高品質 - ファイルサイズ大' : 
                 quality >= 70 ? '標準品質 - バランス良好' : 
                 '低品質 - ファイルサイズ小'}
              </div>
            </div>
          )}
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