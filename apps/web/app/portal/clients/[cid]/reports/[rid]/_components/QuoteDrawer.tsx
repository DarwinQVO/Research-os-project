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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LinkPreview } from './LinkPreview';

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
    // New fields from entity/source relationships
    speaker?: string;
    sourceTitle?: string;
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
            >
              {/* Hover close areas - outside the card */}
              <div 
                className="absolute inset-y-0 left-0 w-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                <span className="text-xs text-[color:var(--mymind-muted)] font-medium">close</span>
              </div>
              <div 
                className="absolute inset-y-0 right-0 w-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                <span className="text-xs text-[color:var(--mymind-muted)] font-medium">close</span>
              </div>
              <div 
                className="absolute inset-x-0 top-0 h-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                <span className="text-xs text-[color:var(--mymind-muted)] font-medium">close</span>
              </div>
              <div 
                className="absolute inset-x-0 bottom-0 h-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                <span className="text-xs text-[color:var(--mymind-muted)] font-medium">close</span>
              </div>
            </motion.div>
            
            {/* Animated drawer panel */}
            <motion.div
              key="panel"
              className="fixed inset-6 md:inset-12 lg:inset-24 2xl:inset-32 bg-[#1e1e25] rounded-2xl overflow-hidden z-50"
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="h-full grid grid-cols-[3fr_2fr]">
                {/* ─────────── Quote zone ─────────── */}
                <div className="flex items-center justify-center">
                  <blockquote className="quote-scroll w-full max-w-[750px] lg:max-w-[880px] xl:max-w-[1000px] px-6 md:px-8 overflow-y-auto max-h-[80vh] font-lora font-normal text-[24px] leading-[36px] text-quoteText text-center relative">
                    <div className="text-6xl text-quoteText text-center -mb-2" style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif'}}>‟</div>
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
                    <div className="text-6xl text-quoteText text-center mt-6" style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif', transform: 'scaleX(-1)'}}>‟</div>
                  </blockquote>
                  
                  {/* Hidden Navigation Controls - keyboard only */}
                  <Button
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                    className="sr-only"
                    aria-label="Previous quote"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={onNext}
                    disabled={!hasNext}
                    className="sr-only"
                    aria-label="Next quote"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                {/* ─────────── Metadata panel ─────────── */}
                <aside className="w-full border-l border-[color:var(--mymind-border)] bg-[#16161c] flex flex-col overflow-y-auto">
                  {/* Speaker header with gradient background - moved to top */}
                  {(quote.speaker || quote.author) && (
                    <div className="m-4 mb-0 relative w-full overflow-hidden rounded-lg bg-gradient-to-b from-[#2a2a35] via-[#1e1e25] to-[#16161c] p-4">
                      <div className="font-lora font-light text-[29px] leading-[29px] text-[color:var(--mymind-text)] text-left">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: (props) => (
                              <a {...props} className="underline hover:text-[#45caff]" target="_blank" rel="noopener noreferrer" />
                            ),
                            p: ({children}) => <span>{children}</span>,
                          }}
                        >
                          {quote.speaker || quote.author}
                        </ReactMarkdown>
                      </div>

                      {/* Date */}
                      {quote.date && (
                        <div className="mt-3 font-lora font-normal text-[16px] leading-[18px] text-[#8e9db4]">
                          {quote.date}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Source embed section - dedicated area */}
                  <div className="flex-1 p-4 space-y-6">
                    {/* Link Preview - for all sources with URL */}
                    {quote.sourceUrl && (
                      <LinkPreview sourceUrl={quote.sourceUrl} />
                    )}
                    
                    {/* Source Info (if no URL but has source) */}
                    {quote.source && !quote.sourceUrl && (
                      <div className="bg-gray-800/40 backdrop-blur rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-medium text-gray-300">Source</h4>
                        <p className="text-sm text-gray-100">{quote.source}</p>
                      </div>
                    )}
                  </div>
                </aside>
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