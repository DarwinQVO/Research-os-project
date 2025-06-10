'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MarkdownTextarea } from './MarkdownTextarea';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarkdownPreviewTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  required?: boolean;
}

export function MarkdownPreviewTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  minHeight = 'min-h-[100px]',
  required
}: MarkdownPreviewTextareaProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-2">
      {/* Toggle Preview Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs"
        >
          {showPreview ? (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Edit
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </>
          )}
        </Button>
      </div>

      {/* Editor or Preview */}
      {showPreview ? (
        <div className={`${minHeight} p-3 border border-gray-300 rounded-md bg-gray-50 overflow-auto`}>
          {value ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2">{children}</p>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-gray-400 italic">No content to preview</p>
          )}
        </div>
      ) : (
        <MarkdownTextarea
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={className}
          minHeight={minHeight}
          required={required}
        />
      )}
    </div>
  );
}