import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LinkPreviewMini } from './LinkPreviewMini';
import { cn } from '@/lib/utils';

interface QuoteCardProps {
  quote: {
    id: string;
    shortText: string;
    text?: string;
    author?: string;
    source?: string;
    sourceUrl?: string;
    date?: string;
    createdAt: string;
    // New fields from entity/source relationships
    speaker?: string;
    sourceTitle?: string;
  };
  onClick: () => void;
}

export function QuoteCard({ quote, onClick }: QuoteCardProps) {
  const previewText = quote.shortText;
  const len = previewText.length;
  
  // Map text length to size tiers with max-height
  let cls: string;
  if (len < 120) {
    cls = 'text-[18px] leading-[27px] max-h-[220px]';
  } else if (len < 240) {
    cls = 'text-[16px] leading-[24px] max-h-[300px]';
  } else if (len < 360) {
    cls = 'text-[14px] leading-[21px] max-h-[360px]';
  } else {
    cls = 'text-[12px] leading-[18px] max-h-[420px] long';
  }
  
  return (
    <div
      onClick={onClick}
      className="group relative w-[260px] sm:w-[270px] md:w-[280px] mx-auto bg-[#16161c] rounded-2xl px-5 sm:px-6 py-6 sm:py-7 md:py-8 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-[#45caff]/10 hover:bg-[#1a1a21] hover:ring-1 hover:ring-[#45caff]/50 hover:scale-[1.02] hover:-translate-y-1 break-inside-avoid mb-4 sm:mb-5 md:mb-6"
    >
      {/* Curly quotes decoration */}
      <div className="relative flex-1 flex flex-col">
        <div 
          className="text-[32px] text-quoteText leading-none pointer-events-none text-center -mb-1 transition-all duration-300 group-hover:text-[#45caff] group-hover:scale-110"
          style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif'}}
          aria-hidden="true"
        >
          ‟
        </div>
        
        <div className="flex-1 flex flex-col">
          <p className={cn(
            "relative font-lora font-light text-quoteText text-center overflow-hidden transition-all duration-300 group-hover:text-[#d4d4e1]",
            cls
          )}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <span>{children}</span>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#45caff] hover:text-[#45caff99] underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {previewText}
            </ReactMarkdown>
            {cls.includes('long') && (
              <>
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#16161c] via-[#16161c]/70 to-transparent" />
                <span className="hidden" id="omit-bottom-quote" />
              </>
            )}
          </p>
          {!cls.includes('long') && (
            <div 
              className="text-[32px] text-quoteText leading-none pointer-events-none text-center mt-2 transition-all duration-300 group-hover:text-[#45caff] group-hover:scale-110"
              style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif', transform: 'scaleX(-1)'}}
              aria-hidden="true"
            >
              ‟
            </div>
          )}
        </div>
      </div>
      
      {/* Footer - appears on hover */}
      <footer className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-[#1e1e25] via-[#1e1e25]/95 to-transparent pt-8 pb-4 px-4 transform translate-y-4 group-hover:translate-y-0">
        {(quote.speaker || quote.author) && (
          <div className="mb-1">
            <span className="text-xs text-gray-400 transition-colors duration-300 group-hover:text-[#45caff]">— </span>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <span className="text-xs text-gray-400 transition-colors duration-300 group-hover:text-[#d4d4e1]">{children}</span>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#45caff] hover:text-[#45caff99] underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {quote.speaker || quote.author}
            </ReactMarkdown>
          </div>
        )}
        {quote.sourceUrl && (
          <div className="transform transition-all duration-300 group-hover:scale-105">
            <LinkPreviewMini sourceUrl={quote.sourceUrl} />
          </div>
        )}
      </footer>
    </div>
  );
}