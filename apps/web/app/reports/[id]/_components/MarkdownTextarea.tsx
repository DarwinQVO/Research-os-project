'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Link, Bold, Italic } from 'lucide-react';
import { insertMarkdownLink, wrapSelectionWithMarkdown } from '@/lib/insertMarkdownLink';

interface MarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  required?: boolean;
}

export function MarkdownTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  minHeight = 'min-h-[100px]',
  required
}: MarkdownTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Ctrl/Cmd + K for link insertion
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      handleLinkClick();
    }

    // Handle Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      handleBold();
    }

    // Handle Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      handleItalic();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleLinkClick = () => {
    if (!textareaRef.current) return;
    
    const selection = textareaRef.current.value.substring(
      textareaRef.current.selectionStart,
      textareaRef.current.selectionEnd
    );
    
    if (selection) {
      // If text is selected, show dialog to enter URL
      setShowLinkDialog(true);
    } else {
      // If no selection, insert empty link template
      insertMarkdownLink(textareaRef.current, '', 'link text');
      onChange(textareaRef.current.value);
      textareaRef.current.focus();
    }
  };

  const handleBold = () => {
    if (!textareaRef.current) return;
    wrapSelectionWithMarkdown(textareaRef.current, '**');
    onChange(textareaRef.current.value);
    textareaRef.current.focus();
  };

  const handleItalic = () => {
    if (!textareaRef.current) return;
    wrapSelectionWithMarkdown(textareaRef.current, '*');
    onChange(textareaRef.current.value);
    textareaRef.current.focus();
  };

  const handleLinkSubmit = () => {
    if (!textareaRef.current || !linkUrl) return;
    
    insertMarkdownLink(textareaRef.current, linkUrl);
    onChange(textareaRef.current.value);
    setShowLinkDialog(false);
    setLinkUrl('');
    textareaRef.current.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    const pastedText = clipboardData.getData('text');
    const pastedHtml = clipboardData.getData('text/html');
    
    // Check if we have HTML content with links
    if (pastedHtml && pastedHtml.includes('<a ')) {
      e.preventDefault();
      
      // Convert HTML links to markdown
      const convertedText = convertHtmlToMarkdown(pastedHtml);
      
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;
      
      // Insert converted markdown at cursor position
      const newValue = currentValue.substring(0, start) + convertedText + currentValue.substring(end);
      onChange(newValue);
      
      // Update cursor position
      setTimeout(() => {
        const newCursorPos = start + convertedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
      
      return;
    }
    
    // Check if pasted text contains markdown links
    const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/;
    if (markdownLinkPattern.test(pastedText)) {
      // Check if it has extra parentheses around it
      if (pastedText.match(/^\s*\(\s*\[([^\]]+)\]\(([^)]+)\)\s*\)\s*$/)) {
        e.preventDefault();
        
        // Remove outer parentheses
        const cleanedText = pastedText.replace(/^\s*\(\s*\[([^\]]+)\]\(([^)]+)\)\s*\)\s*$/, '[$1]($2)');
        
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = textarea.value;
        
        // Insert cleaned markdown at cursor position
        const newValue = currentValue.substring(0, start) + cleanedText + currentValue.substring(end);
        onChange(newValue);
        
        // Update cursor position
        setTimeout(() => {
          const newCursorPos = start + cleanedText.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }, 0);
        
        return;
      }
      // Otherwise, let it paste normally (preserve markdown)
      return;
    }
    
    // Check if pasted text looks like a URL
    const urlRegex = /^https?:\/\/[^\s]+$/;
    if (urlRegex.test(pastedText.trim())) {
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      
      if (selectedText) {
        // If text is selected, wrap it as a markdown link
        e.preventDefault();
        insertMarkdownLink(textarea, pastedText.trim(), selectedText);
        onChange(textarea.value);
      }
    }
  };
  
  // Helper function to convert HTML links to markdown
  const convertHtmlToMarkdown = (html: string): string => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Convert links to markdown format
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent || '';
      const markdownLink = `[${text}](${href})`;
      link.outerHTML = markdownLink;
    });
    
    // Get the clean text
    let cleanText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up any extra parentheses around markdown links
    cleanText = cleanText.replace(/\(\[([^\]]+)\]\(([^)]+)\)\)/g, '[$1]($2)');
    
    // Also handle cases where there might be spaces
    cleanText = cleanText.replace(/\(\s*\[([^\]]+)\]\(([^)]+)\)\s*\)/g, '[$1]($2)');
    
    return cleanText.trim();
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border border-gray-300 rounded-t-md bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLinkClick}
          className="h-8 w-8 p-0"
          title="Insert Link (Ctrl+K)"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        className={`${className} ${minHeight} rounded-t-none border-t-0`}
        required={required}
      />

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLinkSubmit();
                }
                if (e.key === 'Escape') {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleLinkSubmit}
              disabled={!linkUrl}
            >
              Insert
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowLinkDialog(false);
                setLinkUrl('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}