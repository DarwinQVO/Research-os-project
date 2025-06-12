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
      className="group relative w-[270px] mx-auto bg-[#16161c] rounded-2xl px-6 py-8 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:bg-[#1a1a21] hover:ring-1 hover:ring-[#45caff33] break-inside-avoid mb-6"
    >
      {/* Curly quotes decoration */}
      <div className="relative flex-1 flex flex-col">
        <div 
          className="text-[32px] text-quoteText leading-none pointer-events-none text-center -mb-1"
          style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif'}}
          aria-hidden="true"
        >
          ‟
        </div>
        
        <div className="flex-1 flex flex-col">
          <p className={cn(
            "relative font-lora font-light text-quoteText text-center overflow-hidden transition-[font-size] duration-200",
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
              className="text-[32px] text-quoteText leading-none pointer-events-none text-center mt-2"
              style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif', transform: 'scaleX(-1)'}}
              aria-hidden="true"
            >
              ‟
            </div>
          )}
        </div>
      </div>
      
      {/* Footer - appears on hover */}
      <footer className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-[#1e1e25] via-[#1e1e25]/95 to-transparent pt-8 pb-4 px-4">
        {(quote.speaker || quote.author) && (
          <div className="mb-1">
            <span className="text-xs text-gray-400">— </span>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <span className="text-xs text-gray-400">{children}</span>,
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
          <LinkPreviewMini sourceUrl={quote.sourceUrl} />
        )}
      </footer>
    </div>
  );
}