import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock electron API
window.electronAPI = {
  loadProject: jest.fn().mockResolvedValue({ 
    success: true, 
    data: {
      pages: [],
      speechData: [],
      language: 'ja',
      lastSaveTime: null
    }
  }),
  saveProject: jest.fn().mockResolvedValue({ success: true }),
  exportProject: jest.fn().mockResolvedValue({ success: true }),
  getExportPath: jest.fn().mockResolvedValue('/mock/path'),
  setExportPath: jest.fn().mockResolvedValue({ success: true }),
  openExportFolder: jest.fn().mockResolvedValue({ success: true })
};

test('renders manga creator app', () => {
  render(<App />);
  // Check if sidebar exists
  expect(screen.getByText('ページ')).toBeInTheDocument();
});

test('has export button', () => {
  render(<App />);
  const exportButton = screen.getByText('エクスポート');
  expect(exportButton).toBeInTheDocument();
  expect(exportButton).toBeDisabled(); // Should be disabled when no pages
});