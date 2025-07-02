// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Electron API
Object.defineProperty(window, 'electronAPI', {
  value: {
    loadProject: jest.fn().mockImplementation(() => 
      Promise.resolve({ success: true, data: null })
    ),
    saveProject: jest.fn().mockImplementation(() => 
      Promise.resolve({ success: true })
    ),
    exportProject: jest.fn().mockImplementation(() => 
      Promise.resolve({ success: true })
    )
  },
  writable: true,
  configurable: true
});

// Mock FileReader
class MockFileReader {
  constructor() {
    this.result = 'data:image/png;base64,testdata';
  }
  
  readAsDataURL(file) {
    // Simulate async file reading
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
  
  readAsText(file) {
    // Read the content for text files (CSV)
    setTimeout(() => {
      // Mock CSV content
      this.result = "id,ja,en\n1,こんにちは,Hello";
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
}

global.FileReader = MockFileReader;