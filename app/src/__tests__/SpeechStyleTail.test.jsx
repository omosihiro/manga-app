import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PagesPanel from '../components/PagesPanel';

describe('Speech Style Tail Direction', () => {
  const mockOnPagesUpdate = jest.fn();
  const mockSpeechData = [
    { id: 'speech1', text: 'Hello' },
    { id: 'speech2', text: 'World' }
  ];

  const mockPages = [
    {
      id: 1,
      name: 'page1.png',
      url: 'data:image/png;base64,test',
      group: 'Normal',
      speechId: 'speech1',
      speechPos: { x: 20, y: 20 },
      speechStyle: {
        shape: 'rounded',
        color: '#ffffff',
        borderColor: '#000000',
        size: 'medium',
        tail: 'left',
        anim: 'none'
      }
    }
  ];

  beforeEach(() => {
    mockOnPagesUpdate.mockClear();
  });

  test('default tail direction is left', () => {
    render(
      <PagesPanel 
        pages={mockPages}
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Find the preview bubble
    const previewBubble = screen.getByText('Preview');
    expect(previewBubble).toHaveClass('tail-left');
    expect(previewBubble).not.toHaveClass('tail-right');
  });

  test('clicking Right button changes tail direction', () => {
    render(
      <PagesPanel 
        pages={mockPages}
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Click the Right button in the segmented control
    const rightButton = screen.getByRole('button', { name: 'Right' });
    fireEvent.click(rightButton);

    // Verify onPagesUpdate was called with tail: 'right'
    expect(mockOnPagesUpdate).toHaveBeenCalledWith([
      {
        ...mockPages[0],
        speechStyle: {
          ...mockPages[0].speechStyle,
          tail: 'right'
        }
      }
    ]);
  });

  test('preview bubble updates with tail direction', () => {
    const { rerender } = render(
      <PagesPanel 
        pages={mockPages}
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Update pages with right tail
    const updatedPages = [{
      ...mockPages[0],
      speechStyle: {
        ...mockPages[0].speechStyle,
        tail: 'right'
      }
    }];

    rerender(
      <PagesPanel 
        pages={updatedPages}
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Check that preview bubble has correct class
    const previewBubble = screen.getByText('Preview');
    expect(previewBubble).toHaveClass('tail-right');
    expect(previewBubble).not.toHaveClass('tail-left');
  });

  test('segmented button shows correct active state', () => {
    render(
      <PagesPanel 
        pages={mockPages}
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Initially Left should be active
    const leftButton = screen.getByRole('button', { name: 'Left' });
    const rightButton = screen.getByRole('button', { name: 'Right' });
    
    expect(leftButton).toHaveClass('active');
    expect(rightButton).not.toHaveClass('active');

    // Click Right button
    fireEvent.click(rightButton);

    // After update, Right should be active
    const updatedPages = [{
      ...mockPages[0],
      speechStyle: {
        ...mockPages[0].speechStyle,
        tail: 'right'
      }
    }];

    const { container } = render(
      <PagesPanel 
        pages={updatedPages}
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    const updatedRightButton = container.querySelector('.segment.active');
    expect(updatedRightButton).toHaveTextContent('Right');
  });

  test('tail direction persists across page selections', () => {
    const multiplePages = [
      ...mockPages,
      {
        id: 2,
        name: 'page2.png',
        url: 'data:image/png;base64,test2',
        group: 'Normal',
        speechId: 'speech2',
        speechPos: { x: 20, y: 20 },
        speechStyle: {
          shape: 'cloud',
          color: '#ffff00',
          borderColor: '#000000',
          size: 'large',
          tail: 'right',
          anim: 'fade'
        }
      }
    ];

    render(
      <PagesPanel 
        pages={multiplePages}
        onPagesUpdate={mockOnPagesUpdate}
        speechData={mockSpeechData}
      />
    );

    // Check that each page maintains its own tail direction
    const previewBubbles = screen.getAllByText('Preview');
    expect(previewBubbles).toHaveLength(2);
    
    // First page has left tail
    expect(previewBubbles[0]).toHaveClass('tail-left');
    
    // Second page has right tail
    expect(previewBubbles[1]).toHaveClass('tail-right');
  });
});