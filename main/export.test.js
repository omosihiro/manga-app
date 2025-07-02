const fs = require('fs');
const path = require('path');
const tmp = require('tmp-promise');
const { exportProject } = require('./export');

describe('exportProject', () => {
  let tmpDir;

  beforeEach(async () => {
    // Create a temporary directory for each test
    tmpDir = await tmp.dir({ unsafeCleanup: true });
  });

  afterEach(async () => {
    // Clean up temporary directory
    if (tmpDir) {
      await tmpDir.cleanup();
    }
  });

  test('exports project zip with minimal data', async () => {
    const data = {
      title: 'test-project',
      pages: [],
      speechData: [],
      language: 'ja',
      version: '1.0.0'
    };

    const result = await exportProject(data, tmpDir.path);
    
    expect(result.success).toBe(true);
    expect(result.path).toBeDefined();
    expect(fs.existsSync(result.path)).toBe(true);
    expect(result.path).toContain('test-project');
    expect(result.path).toMatch(/\.zip$/);
  });

  test('exports project with pages and speech data', async () => {
    const data = {
      title: 'manga-with-content',
      pages: [
        {
          id: '1',
          name: 'page1.png',
          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      ],
      speechData: [
        {
          id: 'page1_bubble1',
          ja: 'こんにちは',
          en: 'Hello'
        }
      ],
      language: 'ja',
      version: '1.0.0'
    };

    const result = await exportProject(data, tmpDir.path);
    
    expect(result.success).toBe(true);
    expect(result.path).toBeDefined();
    expect(fs.existsSync(result.path)).toBe(true);
    expect(result.size).toBeGreaterThan(0);
  });

  test('handles empty pages array', async () => {
    const data = {
      pages: [],
      speechData: []
    };

    const result = await exportProject(data, tmpDir.path);
    
    expect(result.success).toBe(true);
    expect(fs.existsSync(result.path)).toBe(true);
  });

  test('handles missing optional fields', async () => {
    const data = {};

    const result = await exportProject(data, tmpDir.path);
    
    expect(result.success).toBe(true);
    expect(result.path).toContain('manga-project'); // Default title
  });

  test('creates unique filenames with timestamp', async () => {
    const data = { title: 'test' };

    const result1 = await exportProject(data, tmpDir.path);
    
    // Wait at least 1 second to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result2 = await exportProject(data, tmpDir.path);
    
    expect(result1.path).not.toBe(result2.path);
    expect(fs.existsSync(result1.path)).toBe(true);
    expect(fs.existsSync(result2.path)).toBe(true);
  });
});