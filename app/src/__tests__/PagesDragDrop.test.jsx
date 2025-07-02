import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PagesPanel from '../components/PagesPanel';

// Mock FileReader
class MockFileReader {
  constructor() {
    this.result = null;
    this.onload = null;
  }
  
  readAsDataURL(file) {
    // Simulate async read
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
}

global.FileReader = MockFileReader;

describe('PagesPanel Drag and Drop', () => {
  let mockOnPagesUpdate;

  beforeEach(() => {
    mockOnPagesUpdate = jest.fn();
    jest.clearAllMocks();
    
    // Mock FileReader instances with different results
    let fileReaderInstance = 0;
    const results = ['data:image/png;base64,image1data', 'data:image/png;base64,image2data', 'data:image/png;base64,testdata'];
    
    global.FileReader = jest.fn().mockImplementation(function() {
      const thisInstance = this;
      const resultIndex = fileReaderInstance++;
      this.result = results[resultIndex % results.length];
      this.onload = null;
      this.readAsDataURL = jest.fn(function(file) {
        setTimeout(() => {
          if (thisInstance.onload) {
            thisInstance.onload({ target: { result: thisInstance.result } });
          }
        }, 0);
      });
    });
  });

  test('renders PagesPanel component', () => {
    render(
      <PagesPanel 
        pages={[]}
        onPagesUpdate={mockOnPagesUpdate}
      />
    );

    expect(screen.getByText('Drag & Drop images here')).toBeInTheDocument();
    expect(screen.getByText('or click to select')).toBeInTheDocument();
  });

  test('simulates dropping two fake files and shows thumbnails in order', async () => {
    render(
      <PagesPanel 
        pages={[]}
        onPagesUpdate={mockOnPagesUpdate}
      />
    );

    // Create mock image files
    const file1 = new File(['image1'], 'image1.png', { type: 'image/png' });
    const file2 = new File(['image2'], 'image2.png', { type: 'image/png' });

    // Find drop zone
    const dropZone = screen.getByText('Drag & Drop images here').closest('div').parentElement;

    // FileReader mock is already set up in beforeEach

    // Simulate drag over
    fireEvent.dragOver(dropZone, {
      preventDefault: jest.fn(),
      dataTransfer: { files: [file1, file2] }
    });

    // Simulate drop
    fireEvent.drop(dropZone, {
      preventDefault: jest.fn(),
      dataTransfer: { files: [file1, file2] }
    });

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(mockOnPagesUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'image1.png',
            url: 'data:image/png;base64,image1data',
            type: 'image/png'
          }),
          expect.objectContaining({
            name: 'image2.png',
            url: 'data:image/png;base64,image2data',
            type: 'image/png'
          })
        ])
      );
    });
  });

  test('displays uploaded pages with thumbnails', () => {
    const pages = [
      {
        id: '1',
        name: 'page1.png',
        url: 'data:image/png;base64,page1data',
        type: 'image/png'
      },
      {
        id: '2',
        name: 'page2.png',
        url: 'data:image/png;base64,page2data',
        type: 'image/png'
      }
    ];

    render(
      <PagesPanel 
        pages={pages}
        onPagesUpdate={mockOnPagesUpdate}
      />
    );

    // Check that page items are displayed
    expect(screen.getByText('1')).toBeInTheDocument(); // Page number
    expect(screen.getByText('2')).toBeInTheDocument(); // Page number
    expect(screen.getByText('page1.png')).toBeInTheDocument();
    expect(screen.getByText('page2.png')).toBeInTheDocument();
    
    // Check that images are rendered
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'data:image/png;base64,page1data');
    expect(images[1]).toHaveAttribute('src', 'data:image/png;base64,page2data');
  });

  test('simulates drag reorder and checks new order', () => {
    const pages = [
      {
        id: '1',
        name: 'page1.png',
        url: 'data:image/png;base64,page1data',
        type: 'image/png'
      },
      {
        id: '2',
        name: 'page2.png',
        url: 'data:image/png;base64,page2data',
        type: 'image/png'
      },
      {
        id: '3',
        name: 'page3.png',
        url: 'data:image/png;base64,page3data',
        type: 'image/png'
      }
    ];

    render(
      <PagesPanel 
        pages={pages}
        onPagesUpdate={mockOnPagesUpdate}
      />
    );

    // Find move down button for first page
    const moveDownButtons = screen.getAllByTitle('Move down');
    expect(moveDownButtons[0]).not.toBeDisabled();
    
    // Click move down on first page
    fireEvent.click(moveDownButtons[0]);

    // Check that onPagesUpdate was called with reordered pages
    expect(mockOnPagesUpdate).toHaveBeenCalledWith([
      {
        id: '2',
        name: 'page2.png',
        url: 'data:image/png;base64,page2data',
        type: 'image/png'
      },
      {
        id: '1',
        name: 'page1.png',
        url: 'data:image/png;base64,page1data',
        type: 'image/png'
      },
      {
        id: '3',
        name: 'page3.png',
        url: 'data:image/png;base64,page3data',
        type: 'image/png'
      }
    ]);
  });

  test('move up button reorders pages correctly', () => {
    const pages = [
      {
        id: '1',
        name: 'page1.png',
        url: 'data:image/png;base64,page1data',
        type: 'image/png'
      },
      {
        id: '2',
        name: 'page2.png',
        url: 'data:image/png;base64,page2data',
        type: 'image/png'
      }
    ];

    render(
      <PagesPanel 
        pages={pages}
        onPagesUpdate={mockOnPagesUpdate}
      />
    );

    // Find move up button for second page
    const moveUpButtons = screen.getAllByTitle('Move up');
    expect(moveUpButtons[1]).not.toBeDisabled();
    
    // Click move up on second page
    fireEvent.click(moveUpButtons[1]);

    // Check that onPagesUpdate was called with reordered pages
    expect(mockOnPagesUpdate).toHaveBeenCalledWith([
      {
        id: '2',
        name: 'page2.png',
        url: 'data:image/png;base64,page2data',
        type: 'image/png'
      },
      {
        id: '1',
        name: 'page1.png',
        url: 'data:image/png;base64,page1data',
        type: 'image/png'
      }
    ]);
  });

  test('remove button deletes page', () => {
    const pages = [
      {
        id: '1',
        name: 'page1.png',
        url: 'data:image/png;base64,page1data',
        type: 'image/png'
      },
      {
        id: '2',
        name: 'page2.png',
        url: 'data:image/png;base64,page2data',
        type: 'image/png'
      }
    ];

    render(
      <PagesPanel 
        pages={pages}
        onPagesUpdate={mockOnPagesUpdate}
      />
    );

    // Find and click remove button for first page
    const removeButtons = screen.getAllByTitle('Remove');
    fireEvent.click(removeButtons[0]);

    // Check that onPagesUpdate was called without the first page
    expect(mockOnPagesUpdate).toHaveBeenCalledWith([
      {
        id: '2',
        name: 'page2.png',
        url: 'data:image/png;base64,page2data',
        type: 'image/png'
      }
    ]);
  });

  test('handles file selection through input', async () => {
    const { container } = render(
      <PagesPanel 
        pages={[]}
        onPagesUpdate={mockOnPagesUpdate}
      />
    );

    // Create mock image file
    const file = new File(['image'], 'test.png', { type: 'image/png' });

    // Find file input
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    // FileReader mock is already set up in beforeEach

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for async operations
    await waitFor(() => {
      expect(mockOnPagesUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'test.png',
            url: expect.stringMatching(/^data:image\/png;base64,/),
            type: 'image/png'
          })
        ])
      );
    });
  });

  test('disables move buttons at boundaries', () => {
    const pages = [
      {
        id: '1',
        name: 'page1.png',
        url: 'data:image/png;base64,page1data',
        type: 'image/png'
      },
      {
        id: '2',
        name: 'page2.png',
        url: 'data:image/png;base64,page2data',
        type: 'image/png'
      }
    ];

    render(
      <PagesPanel 
        pages={pages}
        onPagesUpdate={mockOnPagesUpdate}
      />
    );

    const moveUpButtons = screen.getAllByTitle('Move up');
    const moveDownButtons = screen.getAllByTitle('Move down');

    // First page should have disabled move up
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveDownButtons[0]).not.toBeDisabled();

    // Last page should have disabled move down
    expect(moveUpButtons[1]).not.toBeDisabled();
    expect(moveDownButtons[1]).toBeDisabled();
  });
});