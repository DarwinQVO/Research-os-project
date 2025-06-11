import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LinkPreviewMini } from './LinkPreviewMini';

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
  return (
    <div
      onClick={onClick}
      className="relative group bg-[#1e1e25] rounded-xl p-6 shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl hover:border hover:border-[#45caff99] break-inside-avoid mb-6 w-[270px] flex flex-col"
    >
      {/* Curly quotes decoration */}
      <div className="relative flex-1 flex flex-col">
        <div 
          className="text-[32px] text-quoteText leading-none pointer-events-none text-center -mb-3"
          style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif'}}
          aria-hidden="true"
        >
          ‟
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="font-lora font-normal text-[16px] leading-[24px] text-quoteText line-clamp-[10] text-center px-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-0">{children}</p>,
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
              {quote.shortText}
            </ReactMarkdown>
          </div>
          <div 
            className="text-[32px] text-quoteText leading-none pointer-events-none text-center mt-1"
            style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif', transform: 'scaleX(-1)'}}
            aria-hidden="true"
          >
            ‟
          </div>
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