'use client';

import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RichMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  required?: boolean;
}

export function RichMarkdownEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  className = '',
  minHeight = 'min-h-[100px]',
  required
}: RichMarkdownEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null);

  // Update hidden input value for form submission
  useEffect(() => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = value;
    }
  }, [value]);

  const handleContentChange = () => {
    if (editorRef.current) {
      const text = editorRef.current.textContent || '';
      onChange(text);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    
    // Clean up any extra parentheses around markdown links
    const cleanedText = text
      .replace(/\(\s*\[([^\]]+)\]\(([^)]+)\)\s*\)/g, '[$1]($2)')
      .trim();
    
    // Insert text at cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(cleanedText);
      range.insertNode(textNode);
      
      // Move cursor after inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
      
      handleContentChange();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Tab to move to next field
    if (e.key === 'Tab') {
      return;
    }
    
    // Ctrl/Cmd + K for link insertion
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setShowRawMarkdown(true);
      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.focus();
      }, 100);
    }
  };

  if (showRawMarkdown || isFocused) {
    return (
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            setShowRawMarkdown(false);
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className={`w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${minHeight} ${className}`}
          required={required}
          autoFocus
        />
        <div className="absolute top-2 right-2 text-xs text-gray-400">
          Markdown mode - Press Tab to exit
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden input for form validation */}
      <textarea
        ref={hiddenInputRef}
        className="sr-only"
        required={required}
        defaultValue={value}
        aria-hidden="true"
      />
      
      {/* Rich editor */}
      <div
        className={`relative w-full p-3 border border-gray-300 rounded-md cursor-text bg-white hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${minHeight} ${className} overflow-auto`}
        onClick={() => {
          if (editorRef.current) {
            editorRef.current.focus();
          }
        }}
      >
        {!value && (
          <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
        
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          className="outline-none min-h-[inherit]"
          suppressContentEditableWarning
        >
          {value && (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <span>{children}</span>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                    contentEditable={false}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {value}
            </ReactMarkdown>
          )}
        </div>
        
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          Click to edit • Ctrl+K for raw markdown
        </div>
      </div>
    </>
  );
}