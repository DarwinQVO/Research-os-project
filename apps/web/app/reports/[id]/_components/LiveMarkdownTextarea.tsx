'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Textarea } from '@/components/ui/textarea';

interface LiveMarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  required?: boolean;
}

export function LiveMarkdownTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  className = '',
  minHeight = 'min-h-[100px]',
  required
}: LiveMarkdownTextareaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    const pastedText = clipboardData.getData('text');
    
    // Clean up any extra parentheses around markdown links
    if (pastedText.match(/^\s*\(\s*\[([^\]]+)\]\(([^)]+)\)\s*\)\s*$/)) {
      e.preventDefault();
      const cleanedText = pastedText.replace(/^\s*\(\s*\[([^\]]+)\]\(([^)]+)\)\s*\)\s*$/, '[$1]($2)');
      
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;
      
      const newValue = currentValue.substring(0, start) + cleanedText + currentValue.substring(end);
      onChange(newValue);
      
      // Update cursor position
      setTimeout(() => {
        const newCursorPos = start + cleanedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }
  };

  if (isEditing || !value) {
    return (
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            setIsEditing(false);
            if (onBlur) onBlur();
          }}
          onPaste={handlePaste}
          placeholder={placeholder}
          className={`${className} ${minHeight}`}
          required={required}
          autoFocus={isEditing}
        />
        {value && (
          <div className="text-xs text-gray-500 mt-1">
            Click outside to see formatted preview
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => {
        setIsEditing(true);
        setTimeout(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(value.length, value.length);
        }, 0);
      }}
      className={`${minHeight} p-3 border border-gray-300 rounded-md cursor-text hover:border-gray-400 bg-white overflow-auto ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </a>
          ),
        }}
      >
        {value}
      </ReactMarkdown>
      <div className="text-xs text-gray-400 mt-2">
        Click to edit
      </div>
    </div>
  );
}