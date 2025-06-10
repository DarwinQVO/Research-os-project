import { describe, it, expect } from 'vitest';

describe('AddQuote Auto-fill Functionality', () => {
  it('should extract URL from markdown link and auto-fill sourceUrl', () => {
    const extractUrlFromText = (text: string) => {
      const urlRegex = /(?:https?:\/\/[^\s\)]+)|(?:\[([^\]]+)\]\(([^\)]+)\))/gi;
      const matches = text.match(urlRegex);
      
      if (matches) {
        const firstMatch = matches[0];
        const markdownMatch = firstMatch.match(/\[([^\]]+)\]\(([^\)]+)\)/);
        if (markdownMatch) {
          return {
            url: markdownMatch[2],
            text: text.replace(firstMatch, '').trim(),
            domain: new URL(markdownMatch[2]).hostname
          };
        } else {
          return {
            url: firstMatch,
            text: text.replace(firstMatch, '').trim(),
            domain: new URL(firstMatch).hostname
          };
        }
      }
      return null;
    };

    const inputText = 'This is a quote from [Example Article](https://example.com/article)';
    const result = extractUrlFromText(inputText);

    expect(result).toEqual({
      url: 'https://example.com/article',
      text: 'This is a quote from',
      domain: 'example.com'
    });
  });

  it('should extract raw URL and auto-fill sourceUrl', () => {
    const extractUrlFromText = (text: string) => {
      const urlRegex = /(?:https?:\/\/[^\s\)]+)|(?:\[([^\]]+)\]\(([^\)]+)\))/gi;
      const matches = text.match(urlRegex);
      
      if (matches) {
        const firstMatch = matches[0];
        const markdownMatch = firstMatch.match(/\[([^\]]+)\]\(([^\)]+)\)/);
        if (markdownMatch) {
          return {
            url: markdownMatch[2],
            text: text.replace(firstMatch, '').trim(),
            domain: new URL(markdownMatch[2]).hostname
          };
        } else {
          return {
            url: firstMatch,
            text: text.replace(firstMatch, '').trim(),
            domain: new URL(firstMatch).hostname
          };
        }
      }
      return null;
    };

    const inputText = 'Check out this article https://example.com/article about productivity';
    const result = extractUrlFromText(inputText);

    expect(result).toEqual({
      url: 'https://example.com/article',
      text: 'Check out this article about productivity',
      domain: 'example.com'
    });
  });

  it('should return null when no URL is found', () => {
    const extractUrlFromText = (text: string) => {
      const urlRegex = /(?:https?:\/\/[^\s\)]+)|(?:\[([^\]]+)\]\(([^\)]+)\))/gi;
      const matches = text.match(urlRegex);
      
      if (matches) {
        const firstMatch = matches[0];
        const markdownMatch = firstMatch.match(/\[([^\]]+)\]\(([^\)]+)\)/);
        if (markdownMatch) {
          return {
            url: markdownMatch[2],
            text: text.replace(firstMatch, '').trim(),
            domain: new URL(markdownMatch[2]).hostname
          };
        } else {
          return {
            url: firstMatch,
            text: text.replace(firstMatch, '').trim(),
            domain: new URL(firstMatch).hostname
          };
        }
      }
      return null;
    };

    const inputText = 'This is just plain text without any links';
    const result = extractUrlFromText(inputText);

    expect(result).toBeNull();
  });

  it('should simulate form auto-fill behavior', () => {
    interface FormData {
      text: string;
      sourceUrl: string;
      source: string;
    }

    const initialFormData: FormData = {
      text: '',
      sourceUrl: '',
      source: ''
    };

    const extractUrlFromText = (text: string) => {
      const urlRegex = /(?:https?:\/\/[^\s\)]+)|(?:\[([^\]]+)\]\(([^\)]+)\))/gi;
      const matches = text.match(urlRegex);
      
      if (matches) {
        const firstMatch = matches[0];
        const markdownMatch = firstMatch.match(/\[([^\]]+)\]\(([^\)]+)\)/);
        if (markdownMatch) {
          return {
            url: markdownMatch[2],
            text: text.replace(firstMatch, '').trim(),
            domain: new URL(markdownMatch[2]).hostname
          };
        } else {
          return {
            url: firstMatch,
            text: text.replace(firstMatch, '').trim(),
            domain: new URL(firstMatch).hostname
          };
        }
      }
      return null;
    };

    // Simulate text input with URL
    const inputText = 'Great insight from (https://techcrunch.com/article)';
    
    // Simulate form update logic
    let formData = { ...initialFormData };
    formData.text = inputText;

    // Simulate blur event logic
    if (!formData.sourceUrl && formData.text) {
      const extracted = extractUrlFromText(formData.text);
      if (extracted) {
        formData = {
          ...formData,
          text: extracted.text,
          sourceUrl: extracted.url,
          source: formData.source || extracted.domain
        };
      }
    }

    expect(formData).toEqual({
      text: 'Great insight from',
      sourceUrl: 'https://techcrunch.com/article',
      source: 'techcrunch.com'
    });
  });

  it('should handle character counter for short text', () => {
    const maxLength = 300;
    const shortText = 'This is a short version of the quote';
    
    const getCharacterCount = (text: string) => text.length;
    const getCounterStyle = (count: number) => {
      if (count > maxLength) return 'text-red-500';
      if (count > 250) return 'text-yellow-500';
      return 'text-gray-500';
    };

    const count = getCharacterCount(shortText);
    const style = getCounterStyle(count);

    expect(count).toBe(36);
    expect(style).toBe('text-gray-500');

    // Test warning threshold
    const longText = 'a'.repeat(260);
    const longCount = getCharacterCount(longText);
    const longStyle = getCounterStyle(longCount);

    expect(longCount).toBe(260);
    expect(longStyle).toBe('text-yellow-500');

    // Test error threshold
    const tooLongText = 'a'.repeat(310);
    const tooLongCount = getCharacterCount(tooLongText);
    const tooLongStyle = getCounterStyle(tooLongCount);

    expect(tooLongCount).toBe(310);
    expect(tooLongStyle).toBe('text-red-500');
  });
});