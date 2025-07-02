import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpeechTab from '../components/SpeechTab';

describe('SpeechTab', () => {
  let mockOnSpeechDataUpdate;
  let mockOnLanguageChange;

  beforeEach(() => {
    mockOnSpeechDataUpdate = jest.fn();
    mockOnLanguageChange = jest.fn();
  });

  test('renders SpeechTab component', () => {
    render(
      <SpeechTab 
        speechData={[]}
        onSpeechDataUpdate={mockOnSpeechDataUpdate}
        language="ja"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    expect(screen.getByText('Speech Data')).toBeInTheDocument();
    expect(screen.getByText('Language:')).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop CSV or TXT file here')).toBeInTheDocument();
  });

  test('uploads a dummy CSV string and displays data', async () => {
    const { container } = render(
      <SpeechTab 
        speechData={[]}
        onSpeechDataUpdate={mockOnSpeechDataUpdate}
        language="ja"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    // Create a mock CSV file
    const csvContent = "id,ja,en\n1,こんにちは,Hello";
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

    // Find the file input
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    // Simulate file upload
    await waitFor(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Check that onSpeechDataUpdate was called with parsed data
    await waitFor(() => {
      expect(mockOnSpeechDataUpdate).toHaveBeenCalledWith([
        {
          id: '1',
          ja: 'こんにちは',
          en: 'Hello'
        }
      ]);
    });
  });

  test('edits the "ja" cell and expects state update', async () => {
    const initialData = [
      {
        id: '1',
        ja: 'こんにちは',
        en: 'Hello'
      }
    ];

    const { rerender } = render(
      <SpeechTab 
        speechData={initialData}
        onSpeechDataUpdate={mockOnSpeechDataUpdate}
        language="ja"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    // Find the Japanese text input
    const jaTextarea = screen.getByDisplayValue('こんにちは');
    expect(jaTextarea).toBeInTheDocument();

    // Change the value
    fireEvent.change(jaTextarea, { target: { value: 'やあ' } });

    // Check that onSpeechDataUpdate was called with updated data
    expect(mockOnSpeechDataUpdate).toHaveBeenCalledWith([
      {
        id: '1',
        ja: 'やあ',
        en: 'Hello'
      }
    ]);

    // Simulate parent component updating the prop
    const updatedData = [
      {
        id: '1',
        ja: 'やあ',
        en: 'Hello'
      }
    ];

    rerender(
      <SpeechTab 
        speechData={updatedData}
        onSpeechDataUpdate={mockOnSpeechDataUpdate}
        language="ja"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    // Verify the updated value is displayed
    expect(screen.getByDisplayValue('やあ')).toBeInTheDocument();
  });

  test('adds a new row when Add Row button is clicked', () => {
    const initialData = [
      {
        id: '1',
        ja: 'こんにちは',
        en: 'Hello'
      }
    ];

    render(
      <SpeechTab 
        speechData={initialData}
        onSpeechDataUpdate={mockOnSpeechDataUpdate}
        language="ja"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    const addButton = screen.getByText('+ Add Row');
    fireEvent.click(addButton);

    // Check that onSpeechDataUpdate was called with a new row
    expect(mockOnSpeechDataUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        {
          id: '1',
          ja: 'こんにちは',
          en: 'Hello'
        },
        expect.objectContaining({
          id: expect.stringMatching(/^row-/),
          ja: '',
          en: ''
        })
      ])
    );
  });

  test('deletes a row when delete button is clicked', () => {
    const initialData = [
      {
        id: '1',
        ja: 'こんにちは',
        en: 'Hello'
      },
      {
        id: '2',
        ja: 'さようなら',
        en: 'Goodbye'
      }
    ];

    render(
      <SpeechTab 
        speechData={initialData}
        onSpeechDataUpdate={mockOnSpeechDataUpdate}
        language="ja"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    // Find and click the first delete button
    const deleteButtons = screen.getAllByTitle('Delete row');
    fireEvent.click(deleteButtons[0]);

    // Check that onSpeechDataUpdate was called without the first row
    expect(mockOnSpeechDataUpdate).toHaveBeenCalledWith([
      {
        id: '2',
        ja: 'さようなら',
        en: 'Goodbye'
      }
    ]);
  });

  test('changes language when selector is changed', () => {
    render(
      <SpeechTab 
        speechData={[]}
        onSpeechDataUpdate={mockOnSpeechDataUpdate}
        language="ja"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    const languageSelect = screen.getByRole('combobox');
    fireEvent.change(languageSelect, { target: { value: 'en' } });

    expect(mockOnLanguageChange).toHaveBeenCalledWith('en');
  });

  test('handles drag and drop of CSV file', async () => {
    const { container } = render(
      <SpeechTab 
        speechData={[]}
        onSpeechDataUpdate={mockOnSpeechDataUpdate}
        language="ja"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    const csvContent = "id,ja,en\n1,こんにちは,Hello";
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

    const dropZone = screen.getByText('Drag & Drop CSV or TXT file here').closest('div').parentElement;

    // Simulate drag over
    fireEvent.dragOver(dropZone, {
      dataTransfer: { files: [file] }
    });

    // Check if drag-over class is applied
    expect(dropZone).toHaveClass('drag-over');

    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] }
    });

    // Check that onSpeechDataUpdate was called
    await waitFor(() => {
      expect(mockOnSpeechDataUpdate).toHaveBeenCalledWith([
        {
          id: '1',
          ja: 'こんにちは',
          en: 'Hello'
        }
      ]);
    });
  });
});