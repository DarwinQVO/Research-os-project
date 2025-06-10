import { describe, it, expect, beforeEach } from 'vitest';
import { insertMarkdownLink, wrapSelectionWithMarkdown } from '@/lib/insertMarkdownLink';

describe('AddQuote Link Auto-wrap Functionality', () => {
  let mockTextarea: HTMLTextAreaElement;

  beforeEach(() => {
    // Create a mock textarea element
    mockTextarea = document.createElement('textarea');
    document.body.appendChild(mockTextarea);
  });

  afterEach(() => {
    document.body.removeChild(mockTextarea);
  });

  it('should wrap selected text with markdown link when Ctrl+K is pressed', () => {
    const initialText = 'Check out this amazing article about AI';
    const selectedText = 'amazing article';
    const url = 'https://example.com/ai-article';
    
    mockTextarea.value = initialText;
    
    // Simulate text selection
    const startIndex = initialText.indexOf(selectedText);
    const endIndex = startIndex + selectedText.length;
    mockTextarea.setSelectionRange(startIndex, endIndex);
    
    // Simulate inserting markdown link
    insertMarkdownLink(mockTextarea, url);
    
    const expectedResult = 'Check out this [amazing article](https://example.com/ai-article) about AI';
    expect(mockTextarea.value).toBe(expectedResult);
  });

  it('should insert empty link template when no text is selected', () => {
    const initialText = 'Some text here';
    mockTextarea.value = initialText;
    
    // Set cursor position (no selection)
    mockTextarea.setSelectionRange(5, 5);
    
    insertMarkdownLink(mockTextarea, 'https://example.com', 'link text');
    
    const expectedResult = 'Some [link text](https://example.com)text here';
    expect(mockTextarea.value).toBe(expectedResult);
  });

  it('should use provided link text over selected text', () => {
    const initialText = 'Visit the website';
    mockTextarea.value = initialText;
    
    // Select "website"
    mockTextarea.setSelectionRange(10, 17);
    
    insertMarkdownLink(mockTextarea, 'https://example.com', 'official site');
    
    const expectedResult = 'Visit the [official site](https://example.com)';
    expect(mockTextarea.value).toBe(expectedResult);
  });

  it('should wrap text with bold markdown using **', () => {
    const initialText = 'This is important text';
    mockTextarea.value = initialText;
    
    // Select "important"
    mockTextarea.setSelectionRange(8, 17);
    
    wrapSelectionWithMarkdown(mockTextarea, '**');
    
    const expectedResult = 'This is **important** text';
    expect(mockTextarea.value).toBe(expectedResult);
  });

  it('should wrap text with italic markdown using *', () => {
    const initialText = 'This is emphasized text';
    mockTextarea.value = initialText;
    
    // Select "emphasized"
    mockTextarea.setSelectionRange(8, 18);
    
    wrapSelectionWithMarkdown(mockTextarea, '*');
    
    const expectedResult = 'This is *emphasized* text';
    expect(mockTextarea.value).toBe(expectedResult);
  });

  it('should handle empty selection for formatting', () => {
    const initialText = 'Some text';
    mockTextarea.value = initialText;
    
    // Set cursor at position 5
    mockTextarea.setSelectionRange(5, 5);
    
    wrapSelectionWithMarkdown(mockTextarea, '**');
    
    const expectedResult = 'Some ****text';
    expect(mockTextarea.value).toBe(expectedResult);
    
    // Cursor should be positioned between the markers
    expect(mockTextarea.selectionStart).toBe(7); // Between the **
    expect(mockTextarea.selectionEnd).toBe(7);
  });

  it('should simulate complete workflow: select word, Ctrl+K, enter URL', () => {
    const initialText = 'Read this documentation for more details';
    const selectedWord = 'documentation';
    const url = 'https://docs.example.com';
    
    mockTextarea.value = initialText;
    
    // 1. Simulate selecting the word "documentation"
    const startIndex = initialText.indexOf(selectedWord);
    const endIndex = startIndex + selectedWord.length;
    mockTextarea.setSelectionRange(startIndex, endIndex);
    
    // 2. Simulate Ctrl+K action (insert markdown link)
    insertMarkdownLink(mockTextarea, url);
    
    // 3. Verify result
    const expectedResult = 'Read this [documentation](https://docs.example.com) for more details';
    expect(mockTextarea.value).toBe(expectedResult);
  });

  it('should handle special characters in URLs correctly', () => {
    const initialText = 'Search for it';
    mockTextarea.value = initialText;
    
    // Select "Search for it"
    mockTextarea.setSelectionRange(0, 13);
    
    const complexUrl = 'https://google.com/search?q=test+query&type=web&safe=on';
    insertMarkdownLink(mockTextarea, complexUrl);
    
    const expectedResult = '[Search for it](https://google.com/search?q=test+query&type=web&safe=on)';
    expect(mockTextarea.value).toBe(expectedResult);
  });

  it('should maintain cursor position after link insertion', () => {
    const initialText = 'Click here';
    mockTextarea.value = initialText;
    
    // Select "here"
    mockTextarea.setSelectionRange(6, 10);
    
    insertMarkdownLink(mockTextarea, 'https://example.com');
    
    // Cursor should be positioned after the inserted link
    const expectedCursorPos = 'Click [here](https://example.com)'.length;
    expect(mockTextarea.selectionStart).toBe(expectedCursorPos);
    expect(mockTextarea.selectionEnd).toBe(expectedCursorPos);
  });

  it('should handle multiple consecutive link insertions', () => {
    const initialText = 'Visit site1 and site2';
    mockTextarea.value = initialText;
    
    // First link
    mockTextarea.setSelectionRange(6, 11); // Select "site1"
    insertMarkdownLink(mockTextarea, 'https://site1.com');
    
    // Update text and select second part
    const updatedText = mockTextarea.value; // 'Visit [site1](https://site1.com) and site2'
    const site2Index = updatedText.indexOf('site2');
    mockTextarea.setSelectionRange(site2Index, site2Index + 5);
    insertMarkdownLink(mockTextarea, 'https://site2.com');
    
    const expectedResult = 'Visit [site1](https://site1.com) and [site2](https://site2.com)';
    expect(mockTextarea.value).toBe(expectedResult);
  });
});