import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PreviewTab from './PreviewTab';

// Mock data for testing
const mockPages = [
  {
    id: 1,
    name: 'page1.png',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    speechId: 'speech1',
    speechPos: { x: 20, y: 20 },
    speechStyle: { shape: 'rounded', color: 'white', size: 'medium', animation: 'none' }
  },
  {
    id: 2,
    name: 'page2.png',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    speechId: 'speech2',
    speechPos: { x: 30, y: 30 },
    speechStyle: { shape: 'cloud', color: 'yellow', size: 'large', animation: 'none' }
  }
];

const mockSpeechData = [
  { id: 'speech1', ja: 'こんにちは', en: 'Hello' },
  { id: 'speech1', ja: 'おはよう', en: 'Good morning' },
  { id: 'speech1', ja: 'こんばんは', en: 'Good evening' },
  { id: 'speech2', ja: 'ありがとう', en: 'Thank you' },
  { id: 'speech2', ja: 'さようなら', en: 'Goodbye' }
];

describe('PreviewScroll', () => {
  const defaultProps = {
    pages: mockPages,
    speechData: mockSpeechData,
    language: 'ja',
    onPagesUpdate: jest.fn(),
    sweetSpot: 600,
    onSweetSpotChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders initial speech text correctly', () => {
    render(<PreviewTab {...defaultProps} />);
    
    // Check initial speech text (row 0)
    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    expect(screen.getByText('ありがとう')).toBeInTheDocument();
  });

  test('changes speech text after scrolling past sweetSpot', async () => {
    const { container } = render(<PreviewTab {...defaultProps} />);
    
    // Get the scrollable container
    const scrollContainer = container.querySelector('.preview-scroll-container');
    expect(scrollContainer).toBeInTheDocument();

    // Initial state - row 0
    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    expect(screen.queryByText('おはよう')).not.toBeInTheDocument();

    // Simulate scroll to sweetSpot (600px)
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 600 } });

    // Wait for state update
    await waitFor(() => {
      // Should now show row 1
      expect(screen.queryByText('こんにちは')).not.toBeInTheDocument();
      expect(screen.getByText('おはよう')).toBeInTheDocument();
    });
  });

  test('changes speech text after scrolling past sweetSpot*2', async () => {
    const { container } = render(<PreviewTab {...defaultProps} />);
    
    const scrollContainer = container.querySelector('.preview-scroll-container');
    
    // Initial state - row 0
    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    expect(screen.getByText('ありがとう')).toBeInTheDocument();

    // Simulate scroll to sweetSpot*2 (1200px)
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 1200 } });

    // Wait for state update
    await waitFor(() => {
      // Should now show row 2
      expect(screen.queryByText('こんにちは')).not.toBeInTheDocument();
      expect(screen.queryByText('おはよう')).not.toBeInTheDocument();
      expect(screen.getByText('こんばんは')).toBeInTheDocument();
      
      // Second page should show row 0 again (since it only has 2 rows, 2 % 2 = 0)
      expect(screen.getByText('ありがとう')).toBeInTheDocument();
      expect(screen.queryByText('さようなら')).not.toBeInTheDocument();
    });
  });

  test('respects different sweetSpot values', async () => {
    const customProps = { ...defaultProps, sweetSpot: 300 };
    const { container } = render(<PreviewTab {...customProps} />);
    
    const scrollContainer = container.querySelector('.preview-scroll-container');
    
    // Initial state
    expect(screen.getByText('こんにちは')).toBeInTheDocument();

    // Scroll to 300px (sweetSpot)
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 300 } });

    await waitFor(() => {
      // Should change to row 1
      expect(screen.getByText('おはよう')).toBeInTheDocument();
    });

    // Scroll to 600px (sweetSpot*2)
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 600 } });

    await waitFor(() => {
      // Should change to row 2
      expect(screen.getByText('こんばんは')).toBeInTheDocument();
    });
  });

  test('handles language switching correctly', () => {
    const { rerender } = render(<PreviewTab {...defaultProps} />);
    
    // Check Japanese text
    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    expect(screen.getByText('ありがとう')).toBeInTheDocument();

    // Switch to English
    rerender(<PreviewTab {...defaultProps} language="en" />);
    
    // Check English text
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Thank you')).toBeInTheDocument();
  });

  test('cycles through speech rows when scrolling beyond available rows', async () => {
    const { container } = render(<PreviewTab {...defaultProps} />);
    
    const scrollContainer = container.querySelector('.preview-scroll-container');
    
    // Scroll to sweetSpot*3 (1800px) - beyond the 3 rows for speech1
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 1800 } });

    await waitFor(() => {
      // Should cycle back to row 0 (3 % 3 = 0)
      expect(screen.getByText('こんにちは')).toBeInTheDocument();
    });

    // Scroll to sweetSpot*4 (2400px)
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 2400 } });

    await waitFor(() => {
      // Should show row 1 (4 % 3 = 1)
      expect(screen.getByText('おはよう')).toBeInTheDocument();
    });
  });

  test('handles pages without speech correctly', async () => {
    const pagesWithoutSpeech = [
      ...mockPages,
      {
        id: 3,
        name: 'page3.png',
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        speechPos: { x: 40, y: 40 }
        // No speechId
      }
    ];

    render(<PreviewTab {...defaultProps} pages={pagesWithoutSpeech} />);
    
    // Should render without errors and show correct page count
    expect(screen.getByText(/3 pages/)).toBeInTheDocument();
  });

  test('updates sweetSpot value through input', () => {
    render(<PreviewTab {...defaultProps} />);
    
    const sweetSpotInput = screen.getByLabelText('Sweet Spot:');
    expect(sweetSpotInput).toHaveValue(600);

    // Change sweet spot value
    fireEvent.change(sweetSpotInput, { target: { value: '800' } });
    
    expect(defaultProps.onSweetSpotChange).toHaveBeenCalledWith(800);
  });

  test('displays correct sweet spot value in header', () => {
    render(<PreviewTab {...defaultProps} sweetSpot={750} />);
    
    const sweetSpotInput = screen.getByLabelText('Sweet Spot:');
    expect(sweetSpotInput).toHaveValue(750);
  });

  test('changes speech text after scrolling to sweetSpot*3', async () => {
    const { container } = render(<PreviewTab {...defaultProps} />);
    
    const scrollContainer = container.querySelector('.preview-scroll-container');
    expect(scrollContainer).toBeInTheDocument();
    
    // Initial state - row 0
    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    expect(screen.getByText('ありがとう')).toBeInTheDocument();
    
    // Simulate scroll to sweetSpot*3 (1800px)
    fireEvent.scroll(scrollContainer, { target: { scrollTop: 1800 } });
    
    // Wait for state update
    await waitFor(() => {
      // At row 3:
      // speech1 has 3 rows, so row 3 % 3 = 0, should show 'こんにちは' again
      expect(screen.getByText('こんにちは')).toBeInTheDocument();
      
      // speech2 has 2 rows, so row 3 % 2 = 1, should show 'さようなら'
      expect(screen.queryByText('ありがとう')).not.toBeInTheDocument();
      expect(screen.getByText('さようなら')).toBeInTheDocument();
    });
  });
});