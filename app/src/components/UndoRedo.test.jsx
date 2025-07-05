import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock electron API
const mockSaveProject = jest.fn(() => Promise.resolve({ success: true }));

global.window.electronAPI = {
  loadProject: jest.fn().mockResolvedValue({ 
    success: true, 
    data: {
      pages: [
        {
          id: 'page1',
          name: 'test.png',
          url: 'data:image/png;base64,test',
          group: 'Normal',
          speechId: '1',
          speechPos: { x: 20, y: 20 },
          speechStyle: {
            shape: 'rounded',
            color: '#ffffff',
            borderColor: '#000000',
            size: 'medium',
            tail: 'left',
            anim: 'fade'
          }
        }
      ],
      speechData: [
        { id: '1', ja: 'こんにちは', en: 'Hello' }
      ],
      language: 'ja'
    }
  }),
  saveProject: mockSaveProject,
  getSweetSpot: jest.fn().mockResolvedValue(600),
  getDelayRows: jest.fn().mockResolvedValue(1),
  setSweetSpot: jest.fn(),
  setDelayRows: jest.fn()
};

// Mock file reader
global.FileReader = class FileReader {
  readAsDataURL() {
    this.onload({ target: { result: 'data:image/png;base64,test' } });
  }
};

describe('Undo/Redo with Speech Styles', () => {
  beforeEach(() => {
    mockSaveProject.mockClear();
  });

  test('undo/redo tracks speech style changes', async () => {
    const { container } = render(<App />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(container.querySelector('.page-item')).toBeInTheDocument();
    });
    
    // Click on Pages tab to ensure we're there
    const pagesTab = screen.getByText('ページ');
    fireEvent.click(pagesTab);
    
    // Find speech style editor (should be visible since page has speechId)
    await waitFor(() => {
      expect(container.querySelector('.speech-style-editor')).toBeInTheDocument();
    });
    
    // Change shape style
    const shapeSelect = container.querySelector('select[title="Shape"]');
    expect(shapeSelect.value).toBe('rounded');
    fireEvent.change(shapeSelect, { target: { value: 'cloud' } });
    
    await waitFor(() => {
      expect(shapeSelect.value).toBe('cloud');
    });
    
    // Change size style
    const sizeSelect = container.querySelector('select[title="Size"]');
    expect(sizeSelect.value).toBe('medium');
    fireEvent.change(sizeSelect, { target: { value: 'large' } });
    
    await waitFor(() => {
      expect(sizeSelect.value).toBe('large');
    });
    
    // Test undo with Cmd+Z
    fireEvent.keyDown(window, { key: 'z', metaKey: true });
    
    await waitFor(() => {
      expect(sizeSelect.value).toBe('medium'); // Should undo size change
    });
    
    // Test another undo
    fireEvent.keyDown(window, { key: 'z', metaKey: true });
    
    await waitFor(() => {
      expect(shapeSelect.value).toBe('rounded'); // Should undo shape change
    });
    
    // Test redo with Shift+Cmd+Z
    fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(shapeSelect.value).toBe('cloud'); // Should redo shape change
    });
    
    // Test redo again
    fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(sizeSelect.value).toBe('large'); // Should redo size change
    });
  });
  
  test('undo/redo buttons work with speech style changes', async () => {
    const { container } = render(<App />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(container.querySelector('.page-item')).toBeInTheDocument();
    });
    
    // Click on Pages tab
    const pagesTab = screen.getByText('ページ');
    fireEvent.click(pagesTab);
    
    // Find speech style editor
    await waitFor(() => {
      expect(container.querySelector('.speech-style-editor')).toBeInTheDocument();
    });
    
    // Click segmented button to change tail direction
    const rightTailButton = screen.getByRole('button', { name: 'Right' });
    fireEvent.click(rightTailButton);
    
    await waitFor(() => {
      expect(rightTailButton).toHaveClass('active');
    });
    
    // Click animation radio chip
    const bounceChip = screen.getByLabelText('Bounce');
    fireEvent.click(bounceChip);
    
    await waitFor(() => {
      expect(bounceChip).toBeChecked();
    });
    
    // Click undo button
    const undoButton = screen.getByTitle('元に戻す (Ctrl+Z)');
    fireEvent.click(undoButton);
    
    // Verify animation was undone
    await waitFor(() => {
      const fadeChip = screen.getByLabelText('Fade');
      expect(fadeChip).toBeChecked();
    });
    
    // Click undo again
    fireEvent.click(undoButton);
    
    // Verify tail direction was undone
    await waitFor(() => {
      const leftTailButton = screen.getByRole('button', { name: 'Left' });
      expect(leftTailButton).toHaveClass('active');
    });
    
    // Click redo button
    const redoButton = screen.getByTitle('やり直す (Ctrl+Y)');
    fireEvent.click(redoButton);
    
    // Verify tail direction was redone
    await waitFor(() => {
      expect(rightTailButton).toHaveClass('active');
    });
    
    // Click redo again
    fireEvent.click(redoButton);
    
    // Verify animation was redone
    await waitFor(() => {
      expect(bounceChip).toBeChecked();
    });
  });

  test('Ctrl+Y also works for redo', async () => {
    const { container } = render(<App />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(container.querySelector('.page-item')).toBeInTheDocument();
    });
    
    // Change color
    const colorPicker = container.querySelector('.color-picker');
    fireEvent.change(colorPicker, { target: { value: '#ff0000' } });
    
    await waitFor(() => {
      expect(colorPicker.value).toBe('#ff0000');
    });
    
    // Undo
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    
    await waitFor(() => {
      expect(colorPicker.value).toBe('#ffffff');
    });
    
    // Redo with Ctrl+Y
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
    
    await waitFor(() => {
      expect(colorPicker.value).toBe('#ff0000');
    });
  });
});