import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportDialog from '../components/ExportDialog';

describe('Export Quality Slider', () => {
  const mockOnClose = jest.fn();
  const mockOnExport = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnExport.mockClear();
    
    // Mock window.electronAPI
    global.window.electronAPI = {
      getExportPath: jest.fn().mockResolvedValue('/Users/test/Documents/MangaExports')
    };
  });

  test('quality slider is hidden when WebP compression is disabled', async () => {
    render(
      <ExportDialog 
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isExporting={false}
      />
    );

    // Wait for export path to load
    await waitFor(() => {
      expect(screen.getByText('/Users/test/Documents/MangaExports')).toBeInTheDocument();
    });

    // Quality control should not be visible
    expect(screen.queryByText('圧縮品質:')).not.toBeInTheDocument();
  });

  test('quality slider appears when WebP compression is enabled', async () => {
    render(
      <ExportDialog 
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isExporting={false}
      />
    );

    // Enable WebP compression
    const webpCheckbox = screen.getByRole('checkbox');
    fireEvent.click(webpCheckbox);

    // Quality control should now be visible
    await waitFor(() => {
      expect(screen.getByText('圧縮品質:')).toBeInTheDocument();
    });

    // Check default value
    expect(screen.getByText('85%')).toBeInTheDocument();
    
    // Check quality hint
    expect(screen.getByText('標準品質 - バランス良好')).toBeInTheDocument();
  });

  test('quality slider changes value and updates hint', async () => {
    render(
      <ExportDialog 
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isExporting={false}
      />
    );

    // Enable WebP compression
    const webpCheckbox = screen.getByRole('checkbox');
    fireEvent.click(webpCheckbox);

    // Get quality slider
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '50');
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveAttribute('value', '85');

    // Change to low quality
    fireEvent.change(slider, { target: { value: '60' } });
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('低品質 - ファイルサイズ小')).toBeInTheDocument();

    // Change to high quality
    fireEvent.change(slider, { target: { value: '95' } });
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('高品質 - ファイルサイズ大')).toBeInTheDocument();
  });

  test('export includes quality parameter when WebP is enabled', async () => {
    render(
      <ExportDialog 
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isExporting={false}
      />
    );

    // Enable WebP compression
    const webpCheckbox = screen.getByRole('checkbox');
    fireEvent.click(webpCheckbox);

    // Change quality
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });

    // Click export
    const exportButton = screen.getByText('エクスポート');
    fireEvent.click(exportButton);

    // Verify onExport was called with correct parameters
    expect(mockOnExport).toHaveBeenCalledWith({
      compressToWebP: true,
      quality: 75
    });
  });

  test('export uses default quality when WebP is disabled', async () => {
    render(
      <ExportDialog 
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isExporting={false}
      />
    );

    // Click export without enabling WebP
    const exportButton = screen.getByText('エクスポート');
    fireEvent.click(exportButton);

    // Should still include quality parameter with default value
    expect(mockOnExport).toHaveBeenCalledWith({
      compressToWebP: false,
      quality: 85
    });
  });

  test('quality slider is disabled during export', async () => {
    render(
      <ExportDialog 
        isOpen={true}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isExporting={true}
      />
    );

    // Enable WebP compression
    const webpCheckbox = screen.getByRole('checkbox');
    expect(webpCheckbox).toBeDisabled();
  });
});