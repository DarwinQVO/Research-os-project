import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Mock React since we're testing markdown rendering
import React from 'react';

describe('Markdown Rendering', () => {
  it('should render markdown links as clickable anchor tags', () => {
    const markdownText = 'Check out [Example Site](https://example.com) for more info';
    
    const { container } = render(
      React.createElement(ReactMarkdown, {
        remarkPlugins: [remarkGfm],
        children: markdownText,
        components: {
          a: ({ href, children }) => 
            React.createElement('a', {
              href,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'text-blue-400 hover:text-blue-300 underline'
            }, children)
        }
      })
    );

    const link = container.querySelector('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link?.textContent).toBe('Example Site');
  });

  it('should render multiple markdown links correctly', () => {
    const markdownText = 'Visit [Google](https://google.com) or [GitHub](https://github.com)';
    
    const { container } = render(
      React.createElement(ReactMarkdown, {
        remarkPlugins: [remarkGfm],
        children: markdownText,
        components: {
          a: ({ href, children }) => 
            React.createElement('a', {
              href,
              target: '_blank',
              rel: 'noopener noreferrer'
            }, children)
        }
      })
    );

    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(2);
    
    expect(links[0].getAttribute('href')).toBe('https://google.com');
    expect(links[0].textContent).toBe('Google');
    
    expect(links[1].getAttribute('href')).toBe('https://github.com');
    expect(links[1].textContent).toBe('GitHub');
  });

  it('should render plain text without links unchanged', () => {
    const plainText = 'This is just plain text without any links';
    
    const { container } = render(
      React.createElement(ReactMarkdown, {
        remarkPlugins: [remarkGfm],
        children: plainText
      })
    );

    expect(container.textContent).toBe(plainText);
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('should handle bold and italic markdown', () => {
    const markdownText = 'This is **bold** and this is *italic* text';
    
    const { container } = render(
      React.createElement(ReactMarkdown, {
        remarkPlugins: [remarkGfm],
        children: markdownText
      })
    );

    const strongElement = container.querySelector('strong');
    const emElement = container.querySelector('em');
    
    expect(strongElement?.textContent).toBe('bold');
    expect(emElement?.textContent).toBe('italic');
  });

  it('should handle complex markdown with links and formatting', () => {
    const markdownText = '**Important**: Check out [this article](https://example.com) about *modern development*';
    
    const { container } = render(
      React.createElement(ReactMarkdown, {
        remarkPlugins: [remarkGfm],
        children: markdownText,
        components: {
          a: ({ href, children }) => 
            React.createElement('a', {
              href,
              target: '_blank',
              rel: 'noopener noreferrer'
            }, children)
        }
      })
    );

    const link = container.querySelector('a');
    const strong = container.querySelector('strong');
    const em = container.querySelector('em');
    
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.textContent).toBe('this article');
    expect(strong?.textContent).toBe('Important');
    expect(em?.textContent).toBe('modern development');
  });

  it('should properly escape and handle special characters in URLs', () => {
    const markdownText = '[Query Example](https://example.com/search?q=test&type=all)';
    
    const { container } = render(
      React.createElement(ReactMarkdown, {
        remarkPlugins: [remarkGfm],
        children: markdownText,
        components: {
          a: ({ href, children }) => 
            React.createElement('a', { href }, children)
        }
      })
    );

    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://example.com/search?q=test&type=all');
    expect(link?.textContent).toBe('Query Example');
  });
});