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
  };
  onClick: () => void;
}

export function QuoteCard({ quote, onClick }: QuoteCardProps) {
  const getQuoteTextSize = (textLength: number) => {
    if (textLength <= 100) return 'text-base';
    if (textLength <= 200) return 'text-sm';
    if (textLength <= 300) return 'text-xs';
    return 'text-[11px]';
  };

  const textLength = quote.shortText.length;
  const fontSize = getQuoteTextSize(textLength);

  return (
    <div
      onClick={onClick}
      className="relative group bg-[#1e1e25] rounded-xl p-6 shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl hover:border hover:border-[#45caff99] break-inside-avoid mb-6 w-[270px] flex flex-col"
    >
      {/* Curly quotes decoration */}
      <div className="relative flex-1">
        <div 
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-[40px] text-[#45caff99] font-serif leading-none pointer-events-none"
          aria-hidden="true"
        >
          "
        </div>
        
        <div className={`text-gray-100 ${fontSize} leading-relaxed mt-4`}>
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
          <div 
            className="text-[40px] text-[#45caff99] font-serif leading-none pointer-events-none text-center mt-2"
            aria-hidden="true"
          >
            "
          </div>
        </div>
      </div>
      
      {/* Footer - appears on hover */}
      <footer className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-[#1e1e25] via-[#1e1e25]/95 to-transparent pt-8 pb-4 px-4">
        {quote.author && (
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
              {quote.author}
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