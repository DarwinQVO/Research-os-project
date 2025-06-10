'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Copy, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LinkPreview } from './LinkPreview';
import { LinkPreviewMini } from './LinkPreviewMini';

interface QuoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: {
    id: string;
    shortText: string;
    text?: string;
    author?: string;
    source?: string;
    sourceUrl?: string;
    date?: string;
    createdAt: string;
    status?: 'Published' | 'Approved' | 'Pending';
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
  const getQuoteTextSizeClasses = (textLength: number) => {
    if (textLength <= 100) {
      return 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl';
    } else if (textLength <= 200) {
      return 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl';
    } else if (textLength <= 400) {
      return 'text-xl md:text-2xl lg:text-3xl xl:text-4xl';
    } else if (textLength <= 600) {
      return 'text-lg md:text-xl lg:text-2xl xl:text-3xl';
    } else {
      return 'text-base md:text-lg lg:text-xl xl:text-2xl';
    }
  };

  const handleCopy = async () => {
    if (!quote) return;
    
    const text = `"${quote.shortText}"${quote.author ? ` - ${quote.author}` : ''}${quote.source ? ` (${quote.source})` : ''}`;
    
    try {
      await navigator.clipboard.writeText(text);
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
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Animated backdrop with blur */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => onOpenChange(false)}
            />
            
            {/* Animated drawer panel */}
            <motion.div
              key="panel"
              className="fixed inset-6 md:inset-12 lg:inset-24 2xl:inset-32 grid grid-cols-[2fr_1fr] z-50"
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* Quote Content - Left Side */}
              <div className="bg-[#1e1e25] rounded-l-2xl flex flex-col justify-center items-center p-8 md:p-16 overflow-auto">
                <div className="max-w-3xl mx-auto text-center">
                  <blockquote className={`relative font-serif ${getQuoteTextSizeClasses((quote.text || quote.shortText).length)} leading-relaxed text-gray-100`}>
                    <div className="text-6xl text-[#45caff]/70 font-serif text-center mb-0">"</div>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-0">{children}</p>,
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#45caff] hover:text-[#45caff]/80 underline"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {quote.text || quote.shortText}
                    </ReactMarkdown>
                    <div className="text-6xl text-[#45caff]/70 font-serif text-center mt-6">"</div>
                  </blockquote>
                </div>
                
                {/* Navigation Controls */}
                <div className="flex justify-between items-center w-full max-w-lg mt-12">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button
                      onClick={onPrevious}
                      variant="ghost"
                      size="sm"
                      disabled={!hasPrevious}
                      className="text-gray-400 hover:text-gray-100 hover:bg-gray-800/50 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Previous quote"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  </motion.div>
                  <div className="text-xs text-gray-500">
                    Use ← → keys to navigate
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button
                      onClick={onNext}
                      variant="ghost"
                      size="sm"
                      disabled={!hasNext}
                      className="text-gray-400 hover:text-gray-100 hover:bg-gray-800/50 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Next quote"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </motion.div>
                </div>
              </div>
              
              {/* Sidebar - Right Side */}
              <div className="bg-[#16161c] rounded-r-2xl border-l border-gray-700 p-6 flex flex-col overflow-y-auto">
                {/* Close button */}
                <div className="flex justify-end mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="text-gray-400 hover:text-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Title Block - Reserved h-20 */}
                <div className="h-20 mb-6">
                  {quote.author && (
                    <h1 className="font-serif text-[20px] md:text-[24px] text-gray-100 mb-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <span>{children}</span>,
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#45caff] hover:text-[#45caff]/80 underline"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {quote.author}
                      </ReactMarkdown>
                    </h1>
                  )}
                  
                  {quote.date && (
                    <div className="text-[13px] text-gray-500 mb-1">
                      {quote.date}
                    </div>
                  )}
                  
                </div>
                
                {/* Content Area - flexible space */}
                <div className="flex-1">
                  {/* Link Preview */}
                  {quote.sourceUrl && (
                    <LinkPreview sourceUrl={quote.sourceUrl} />
                  )}
                  
                  {/* Source Info (if no URL but has source) */}
                  {quote.source && !quote.sourceUrl && (
                    <div className="bg-gray-800/40 backdrop-blur rounded-xl p-4 space-y-3 mb-4">
                      <h4 className="text-sm font-medium text-gray-300">Source</h4>
                      <p className="text-sm text-gray-100">{quote.source}</p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 mt-auto">
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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Hidden Sheet for screen reader accessibility */}
      <Sheet open={false}>
        <SheetContent className="hidden">
          <SheetDescription className="sr-only">
            Quote details and actions
          </SheetDescription>
          
          <SheetHeader className="sr-only">
            <SheetTitle>Quote</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
}