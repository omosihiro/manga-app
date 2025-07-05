import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PagesPanel from './PagesPanel';

describe('PagesPanel Multi-Select', () => {
  const mockPages = [
    { id: '1', name: 'page1.png', url: 'data:image/png;base64,1', group: 'Normal' },
    { id: '2', name: 'page2.png', url: 'data:image/png;base64,2', group: 'Normal' },
    { id: '3', name: 'page3.png', url: 'data:image/png;base64,3', group: 'Normal' },
  ];
  
  const mockSpeechData = [];
  const mockOnPagesUpdate = jest.fn();

  beforeEach(() => {
    mockOnPagesUpdate.mockClear();
  });

  test('single click selects one page', () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    const firstPage = container.querySelectorAll('.page-item')[0];
    fireEvent.click(firstPage);
    
    expect(firstPage).toHaveClass('selected');
    expect(container.querySelectorAll('.page-item.selected')).toHaveLength(1);
  });

  test('Cmd+click toggles selection', () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    const pages = container.querySelectorAll('.page-item');
    
    // Click first page
    fireEvent.click(pages[0]);
    expect(pages[0]).toHaveClass('selected');
    
    // Cmd+click second page
    fireEvent.click(pages[1], { metaKey: true });
    expect(pages[0]).toHaveClass('selected');
    expect(pages[1]).toHaveClass('selected');
    
    // Cmd+click first page again to deselect
    fireEvent.click(pages[0], { metaKey: true });
    expect(pages[0]).not.toHaveClass('selected');
    expect(pages[1]).toHaveClass('selected');
  });

  test('Shift+click selects range', () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    const pages = container.querySelectorAll('.page-item');
    
    // Click first page
    fireEvent.click(pages[0]);
    
    // Shift+click third page
    fireEvent.click(pages[2], { shiftKey: true });
    
    // All three pages should be selected
    expect(pages[0]).toHaveClass('selected');
    expect(pages[1]).toHaveClass('selected');
    expect(pages[2]).toHaveClass('selected');
  });

  test('toolbar appears when pages are selected', () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // No toolbar initially
    expect(container.querySelector('.selection-toolbar')).not.toBeInTheDocument();
    
    // Select a page
    const firstPage = container.querySelectorAll('.page-item')[0];
    fireEvent.click(firstPage);
    
    // Toolbar should appear
    const toolbar = container.querySelector('.selection-toolbar');
    expect(toolbar).toBeInTheDocument();
    expect(toolbar).toHaveTextContent('1 selected');
  });

  test('delete button removes selected pages', () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Select first two pages
    const pages = container.querySelectorAll('.page-item');
    fireEvent.click(pages[0]);
    fireEvent.click(pages[1], { metaKey: true });
    
    // Click delete button
    const deleteButton = screen.getByTitle('Delete selected');
    fireEvent.click(deleteButton);
    
    // Should call update with only the third page
    expect(mockOnPagesUpdate).toHaveBeenCalledWith([mockPages[2]]);
  });

  test('duplicate button duplicates selected pages', () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Select first page
    const firstPage = container.querySelectorAll('.page-item')[0];
    fireEvent.click(firstPage);
    
    // Click duplicate button
    const duplicateButton = screen.getByTitle('Duplicate selected');
    fireEvent.click(duplicateButton);
    
    // Should call update with original pages plus duplicated one
    expect(mockOnPagesUpdate).toHaveBeenCalled();
    const updatedPages = mockOnPagesUpdate.mock.calls[0][0];
    expect(updatedPages).toHaveLength(4);
    expect(updatedPages[3].name).toBe('page1.png (copy)');
  });

  test('Cmd+A selects all pages', () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Press Cmd+A
    fireEvent.keyDown(window, { key: 'a', metaKey: true });
    
    // All pages should be selected
    const selectedPages = container.querySelectorAll('.page-item.selected');
    expect(selectedPages).toHaveLength(3);
  });

  test('Escape deselects all pages', () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Select all pages
    fireEvent.keyDown(window, { key: 'a', metaKey: true });
    expect(container.querySelectorAll('.page-item.selected')).toHaveLength(3);
    
    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    
    // No pages should be selected
    expect(container.querySelectorAll('.page-item.selected')).toHaveLength(0);
  });

  test('clicking on interactive elements does not trigger selection', () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    const firstPage = container.querySelectorAll('.page-item')[0];
    const removeButton = firstPage.querySelector('.remove-btn');
    
    // Click on remove button
    fireEvent.click(removeButton);
    
    // Page should not be selected
    expect(firstPage).not.toHaveClass('selected');
  });
});