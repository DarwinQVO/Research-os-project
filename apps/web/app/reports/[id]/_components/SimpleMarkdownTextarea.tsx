'use client';

import { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface SimpleMarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  required?: boolean;
}

export function SimpleMarkdownTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  className = '',
  minHeight = 'min-h-[100px]',
  required
}: SimpleMarkdownTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Get both HTML and plain text
    const htmlData = e.clipboardData.getData('text/html');
    const plainText = e.clipboardData.getData('text/plain');
    
    console.log('Paste detected:');
    console.log('HTML:', htmlData);
    console.log('Plain text:', plainText);
    
    // If we have HTML data with links, convert to markdown
    if (htmlData && htmlData.includes('<a ')) {
      e.preventDefault();
      
      // Parse HTML and convert links to markdown
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlData;
      
      // Process all text nodes and links
      let markdownText = '';
      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          markdownText += node.textContent || '';
        } else if (node.nodeName === 'A') {
          const link = node as HTMLAnchorElement;
          const href = link.getAttribute('href') || '';
          const text = link.textContent || '';
          // Encode parentheses in URLs to prevent breaking markdown
          const encodedHref = href.replace(/\(/g, '%28').replace(/\)/g, '%29');
          markdownText += `[${text}](${encodedHref})`;
        } else if (node.childNodes.length > 0) {
          node.childNodes.forEach(child => processNode(child));
        }
      };
      
      tempDiv.childNodes.forEach(node => processNode(node));
      
      // Clean up any extra whitespace and parentheses
      markdownText = markdownText.trim();
      markdownText = markdownText.replace(/^\s*\(\s*/, '').replace(/\s*\)\s*$/, '');
      
      console.log('Converted to markdown:', markdownText);
      
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;
      
      const newValue = currentValue.substring(0, start) + markdownText + currentValue.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        const newPos = start + markdownText.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
      }, 0);
      
      return;
    }
    
    // Check if plain text has extra parentheses around markdown link
    const extraParensPattern = /^\s*\(\s*(\[[^\]]+\]\([^)]+\))\s*\)\s*$/;
    const match = plainText.match(extraParensPattern);
    
    if (match) {
      e.preventDefault();
      const cleanLink = match[1];
      
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;
      
      const newValue = currentValue.substring(0, start) + cleanLink + currentValue.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        const newPos = start + cleanLink.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.focus();
      }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <div className="space-y-1">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onPaste={handlePaste}
        placeholder={placeholder}
        className={`${className} ${minHeight}`}
        required={required}
      />
      <div className="space-y-1">
        <p className="text-xs text-gray-500">
          Tip: Paste or type [link text](url) for clickable links
        </p>
        {value && value.includes('[') && value.includes('](') && (
          <p className="text-xs text-green-600">
            ✓ Markdown link detected - will appear as blue clickable text when saved
          </p>
        )}
      </div>
    </div>
  );
}