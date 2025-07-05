import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PagesPanel from '../components/PagesPanel';

describe('Style Change with Undo', () => {
  const mockPages = [
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
  ];
  
  const mockSpeechData = [
    { id: '1', ja: 'こんにちは', en: 'Hello' }
  ];
  
  let pagesHistory = [];
  const mockOnPagesUpdate = jest.fn((newPages) => {
    // Simulate undo history by keeping track of all states
    pagesHistory.push(newPages);
  });

  beforeEach(() => {
    mockOnPagesUpdate.mockClear();
    pagesHistory = [mockPages]; // Initial state
  });

  test('style changes update pages state', async () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Find the shape selector
    const shapeSelect = container.querySelector('select[title="Shape"]');
    expect(shapeSelect).toBeInTheDocument();
    expect(shapeSelect.value).toBe('rounded');
    
    // Change shape
    fireEvent.change(shapeSelect, { target: { value: 'cloud' } });
    
    // Verify onPagesUpdate was called
    expect(mockOnPagesUpdate).toHaveBeenCalledTimes(1);
    
    // Check the updated pages
    const updatedPages = mockOnPagesUpdate.mock.calls[0][0];
    expect(updatedPages[0].speechStyle.shape).toBe('cloud');
    
    // Other styles should remain unchanged
    expect(updatedPages[0].speechStyle.size).toBe('medium');
    expect(updatedPages[0].speechStyle.color).toBe('#ffffff');
  });

  test('multiple style changes create separate update calls', async () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Change shape
    const shapeSelect = container.querySelector('select[title="Shape"]');
    fireEvent.change(shapeSelect, { target: { value: 'cloud' } });
    
    // Change size
    const sizeSelect = container.querySelector('select[title="Size"]');
    fireEvent.change(sizeSelect, { target: { value: 'large' } });
    
    // Change color
    const colorPicker = container.querySelector('.color-picker');
    fireEvent.change(colorPicker, { target: { value: '#ff0000' } });
    
    // Should have 3 separate update calls
    expect(mockOnPagesUpdate).toHaveBeenCalledTimes(3);
    
    // Verify each update
    const firstUpdate = mockOnPagesUpdate.mock.calls[0][0];
    expect(firstUpdate[0].speechStyle.shape).toBe('cloud');
    
    const secondUpdate = mockOnPagesUpdate.mock.calls[1][0];
    expect(secondUpdate[0].speechStyle.size).toBe('large');
    
    const thirdUpdate = mockOnPagesUpdate.mock.calls[2][0];
    expect(thirdUpdate[0].speechStyle.color).toBe('#ff0000');
  });

  test('segmented button changes tail direction', async () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Find the right tail button
    const rightButton = container.querySelector('.segment:last-child');
    expect(rightButton).toHaveTextContent('Right');
    
    // Click right button
    fireEvent.click(rightButton);
    
    // Verify update
    expect(mockOnPagesUpdate).toHaveBeenCalledTimes(1);
    const updatedPages = mockOnPagesUpdate.mock.calls[0][0];
    expect(updatedPages[0].speechStyle.tail).toBe('right');
  });

  test('radio chips change animation', async () => {
    const { container } = render(
      <PagesPanel 
        pages={mockPages} 
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Find bounce animation chip
    const bounceRadio = container.querySelector('input[value="bounce"]');
    expect(bounceRadio).toBeInTheDocument();
    
    // Click bounce
    fireEvent.click(bounceRadio);
    
    // Verify update
    expect(mockOnPagesUpdate).toHaveBeenCalledTimes(1);
    const updatedPages = mockOnPagesUpdate.mock.calls[0][0];
    expect(updatedPages[0].speechStyle.anim).toBe('bounce');
  });

  test('simulated undo behavior', async () => {
    // This test simulates how undo would work with the history
    let currentPages = mockPages;
    const { container, rerender } = render(
      <PagesPanel 
        pages={currentPages} 
        onPagesUpdate={(newPages) => {
          pagesHistory.push(newPages);
          currentPages = newPages;
        }}
        speechData={mockSpeechData}
      />
    );

    // Make changes
    const shapeSelect = container.querySelector('select[title="Shape"]');
    fireEvent.change(shapeSelect, { target: { value: 'cloud' } });
    
    // Pages should have been updated
    expect(pagesHistory.length).toBe(2);
    
    // Simulate state update with new pages
    rerender(
      <PagesPanel 
        pages={pagesHistory[1]} 
        onPagesUpdate={(newPages) => {
          pagesHistory.push(newPages);
          currentPages = newPages;
        }}
        speechData={mockSpeechData}
      />
    );
    
    expect(shapeSelect.value).toBe('cloud');
    
    // Simulate undo by reverting to previous state
    rerender(
      <PagesPanel 
        pages={pagesHistory[0]} 
        onPagesUpdate={(newPages) => {
          pagesHistory.push(newPages);
          currentPages = newPages;
        }}
        speechData={mockSpeechData}
      />
    );
    
    // Should be back to original
    expect(shapeSelect.value).toBe('rounded');
  });
});