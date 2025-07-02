import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PagesTab from '../components/PagesPanel';

describe('PagesDragDrop', () => {
  let mockOnPagesUpdate;

  beforeEach(() => {
    mockOnPagesUpdate = jest.fn();
  });

  test('renders PagesTab component', () => {
    render(<PagesTab pages={[]} onPagesUpdate={mockOnPagesUpdate} />);
    
    expect(screen.getByText('Drag & Drop images here')).toBeInTheDocument();
    expect(screen.getByText('or click to select')).toBeInTheDocument();
  });

  test('simulates dropping two fake image files', async () => {
    const { container } = render(
      <PagesTab pages={[]} onPagesUpdate={mockOnPagesUpdate} />
    );

    // Create two fake image files
    const file1 = new File(['image1'], 'page1.png', { type: 'image/png' });
    const file2 = new File(['image2'], 'page2.jpg', { type: 'image/jpeg' });

    // Find the drop zone
    const dropZone = screen.getByText('Drag & Drop images here').closest('.drop-zone');

    // Simulate drag over
    fireEvent.dragOver(dropZone, {
      dataTransfer: { 
        files: [file1, file2],
        types: ['Files']
      }
    });

    // Check if drag-over class is applied
    expect(dropZone).toHaveClass('drag-over');

    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: { 
        files: [file1, file2]
      }
    });

    // Wait for onPagesUpdate to be called
    await waitFor(() => {
      expect(mockOnPagesUpdate).toHaveBeenCalled();
    });

    // Check that two pages were added
    const callArgs = mockOnPagesUpdate.mock.calls[0][0];
    expect(callArgs).toHaveLength(2);
    expect(callArgs[0].name).toBe('page1.png');
    expect(callArgs[1].name).toBe('page2.jpg');
  });

  test('asserts both thumbnails appear in order', async () => {
    const pages = [
      { id: '1', name: 'page1.png', url: 'data:image/png;base64,test1' },
      { id: '2', name: 'page2.jpg', url: 'data:image/jpeg;base64,test2' }
    ];

    render(<PagesTab pages={pages} onPagesUpdate={mockOnPagesUpdate} />);

    // Check that both thumbnails appear
    expect(screen.getByText('page1.png')).toBeInTheDocument();
    expect(screen.getByText('page2.jpg')).toBeInTheDocument();

    // Check the order by checking which appears first in the DOM
    const pageNames = screen.getAllByText(/page\d\.(png|jpg)/);
    expect(pageNames[0]).toHaveTextContent('page1.png');
    expect(pageNames[1]).toHaveTextContent('page2.jpg');
  });

  test('simulates reorder using move buttons', async () => {
    const pages = [
      { id: '1', name: 'page1.png', url: 'data:image/png;base64,test1' },
      { id: '2', name: 'page2.jpg', url: 'data:image/jpeg;base64,test2' },
      { id: '3', name: 'page3.gif', url: 'data:image/gif;base64,test3' }
    ];

    const { rerender } = render(<PagesTab pages={pages} onPagesUpdate={mockOnPagesUpdate} />);

    // Find all move down buttons
    const moveDownButtons = screen.getAllByTitle('Move down');
    
    // Click the first move down button (moves page1 down)
    fireEvent.click(moveDownButtons[0]);

    // Check that onPagesUpdate was called with reordered pages
    expect(mockOnPagesUpdate).toHaveBeenCalledWith([
      { id: '2', name: 'page2.jpg', url: 'data:image/jpeg;base64,test2' },
      { id: '1', name: 'page1.png', url: 'data:image/png;base64,test1' },
      { id: '3', name: 'page3.gif', url: 'data:image/gif;base64,test3' }
    ]);

    // Clear mock and rerender with new order
    mockOnPagesUpdate.mockClear();
    
    // Rerender with the new order
    const newOrder = [
      { id: '2', name: 'page2.jpg', url: 'data:image/jpeg;base64,test2' },
      { id: '1', name: 'page1.png', url: 'data:image/png;base64,test1' },
      { id: '3', name: 'page3.gif', url: 'data:image/gif;base64,test3' }
    ];
    rerender(<PagesTab pages={newOrder} onPagesUpdate={mockOnPagesUpdate} />);

    // Now test move up
    const moveUpButtons = screen.getAllByTitle('Move up');
    
    // Click the last move up button (moves page3 up, which is at index 2)
    fireEvent.click(moveUpButtons[moveUpButtons.length - 1]);

    // Check that onPagesUpdate was called with reordered pages
    expect(mockOnPagesUpdate).toHaveBeenCalledWith([
      { id: '2', name: 'page2.jpg', url: 'data:image/jpeg;base64,test2' },
      { id: '3', name: 'page3.gif', url: 'data:image/gif;base64,test3' },
      { id: '1', name: 'page1.png', url: 'data:image/png;base64,test1' }
    ]);
  });

  test('handles file input change', async () => {
    const { container } = render(
      <PagesTab pages={[]} onPagesUpdate={mockOnPagesUpdate} />
    );

    // Create fake files
    const file1 = new File(['image1'], 'input1.png', { type: 'image/png' });
    const file2 = new File(['image2'], 'input2.png', { type: 'image/png' });

    // Find file input
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    // Simulate file selection
    fireEvent.change(fileInput, {
      target: { files: [file1, file2] }
    });

    // Wait for onPagesUpdate to be called
    await waitFor(() => {
      expect(mockOnPagesUpdate).toHaveBeenCalled();
      const addedPages = mockOnPagesUpdate.mock.calls[0][0];
      expect(addedPages).toHaveLength(2);
      expect(addedPages[0].name).toBe('input1.png');
      expect(addedPages[1].name).toBe('input2.png');
    });
  });

  test('removes drag-over class on drag leave', () => {
    render(<PagesTab pages={[]} onPagesUpdate={mockOnPagesUpdate} />);

    const dropZone = screen.getByText('Drag & Drop images here').closest('.drop-zone');

    // Simulate drag over
    fireEvent.dragOver(dropZone, {
      dataTransfer: { 
        types: ['Files']
      }
    });

    expect(dropZone).toHaveClass('drag-over');

    // Simulate drag leave
    fireEvent.dragLeave(dropZone);

    expect(dropZone).not.toHaveClass('drag-over');
  });

  test('handles delete button click', async () => {
    const pages = [
      { id: '1', name: 'page1.png', url: 'data:image/png;base64,test1' },
      { id: '2', name: 'page2.jpg', url: 'data:image/jpeg;base64,test2' }
    ];

    render(<PagesTab pages={pages} onPagesUpdate={mockOnPagesUpdate} />);

    // Find and click the first delete button
    const deleteButtons = screen.getAllByTitle('Remove');
    fireEvent.click(deleteButtons[0]);

    // Check that onPagesUpdate was called without the first page
    expect(mockOnPagesUpdate).toHaveBeenCalledWith([
      { id: '2', name: 'page2.jpg', url: 'data:image/jpeg;base64,test2' }
    ]);
  });

  test('prevents default on drag over to allow drop', () => {
    render(<PagesTab pages={[]} onPagesUpdate={mockOnPagesUpdate} />);

    const dropZone = screen.getByText('Drag & Drop images here').closest('.drop-zone');
    
    const dragOverEvent = new Event('dragover', { bubbles: true });
    dragOverEvent.preventDefault = jest.fn();
    
    fireEvent(dropZone, dragOverEvent);
    
    expect(dragOverEvent.preventDefault).toHaveBeenCalled();
  });

  test('disables appropriate move buttons at boundaries', () => {
    const pages = [
      { id: '1', name: 'page1.png', url: 'data:image/png;base64,test1' },
      { id: '2', name: 'page2.jpg', url: 'data:image/jpeg;base64,test2' },
      { id: '3', name: 'page3.gif', url: 'data:image/gif;base64,test3' }
    ];

    render(<PagesTab pages={pages} onPagesUpdate={mockOnPagesUpdate} />);

    const moveUpButtons = screen.getAllByTitle('Move up');
    const moveDownButtons = screen.getAllByTitle('Move down');

    // First page should have move up disabled
    expect(moveUpButtons[0]).toBeDisabled();
    
    // Last page should have move down disabled
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
    
    // Middle pages should have both enabled
    expect(moveUpButtons[1]).not.toBeDisabled();
    expect(moveDownButtons[1]).not.toBeDisabled();
  });
});