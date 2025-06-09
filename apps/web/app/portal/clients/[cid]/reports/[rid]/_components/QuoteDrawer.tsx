'use client';

import { useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface QuoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: {
    id: string;
    shortText: string;
    author?: string;
    source?: string;
    sourceUrl?: string;
    tags: string[];
    createdAt: string;
  } | null;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function QuoteDrawer({
  open,
  onOpenChange,
  quote,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: QuoteDrawerProps) {
  const handleCopy = async () => {
    if (!quote) return;
    
    const text = `"${quote.shortText}"${quote.author ? ` - ${quote.author}` : ''}${quote.source ? ` (${quote.source})` : ''}`;
    
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = async () => {
    if (!quote) return;
    
    const text = `"${quote.shortText}"${quote.author ? ` - ${quote.author}` : ''}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Quote',
          text: text,
        });
      } catch (err) {
        console.error('Error sharing: ', err);
      }
    } else {
      // Fallback to copy to clipboard
      handleCopy();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      
      switch (event.key) {
        case 'Escape':
          onOpenChange(false);
          break;
        case 'ArrowLeft':
          if (hasPrevious) onPrevious();
          break;
        case 'ArrowRight':
          if (hasNext) onNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, onPrevious, onNext, hasPrevious, hasNext]);

  if (!quote) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[400px] bg-[#1e1e25] border-l border-gray-700">
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-gray-100">Quote</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div>
            <p className="text-gray-100 text-base leading-relaxed">
              {quote.shortText}
            </p>
          </div>

          {quote.author && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1">Author</h4>
              <p className="text-gray-100">{quote.author}</p>
            </div>
          )}

          {quote.source && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1">Source</h4>
              <p className="text-gray-100">{quote.source}</p>
            </div>
          )}

          {quote.sourceUrl && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-1">URL</h4>
              <a
                href={quote.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all"
              >
                {quote.sourceUrl}
              </a>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">TL;DR</h4>
            <p className="text-gray-400 text-sm italic">
              Summary placeholder - This quote discusses key insights about the topic.
            </p>
          </div>

          {quote.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {quote.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs bg-gray-700 text-gray-200"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="flex-1 bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="flex-1 bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <Button
              onClick={onPrevious}
              variant="ghost"
              size="sm"
              disabled={!hasPrevious}
              className="text-gray-400 hover:text-gray-100 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              onClick={onNext}
              variant="ghost"
              size="sm"
              disabled={!hasNext}
              className="text-gray-400 hover:text-gray-100 disabled:opacity-30"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        <SheetDescription className="sr-only">
          Quote details and actions
        </SheetDescription>
      </SheetContent>
    </Sheet>
  );
}