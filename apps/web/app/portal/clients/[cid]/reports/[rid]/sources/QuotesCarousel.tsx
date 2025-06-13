'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Quote {
  id: string;
  shortText: string;
  text?: string;
  speaker?: string;
  date?: string;
  createdAt: string;
}

interface QuotesCarouselProps {
  quotes: Quote[];
}

function CompactQuoteCard({ quote }: { quote: Quote }) {
  const textLength = quote.shortText.length;
  const shouldFade = textLength > 200;

  return (
    <div className="flex-shrink-0 w-80 bg-[#16161c] rounded-xl p-5 border border-[#26262e] hover:border-[#45caff]/30 transition-colors snap-start">
      <div className="space-y-3">
        {/* Quote text */}
        <div className="relative">
          <div 
            className="text-[24px] text-[#a7b4c6] leading-none pointer-events-none text-center -mb-2"
            style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif'}}
            aria-hidden="true"
          >
            ‟
          </div>
          <div
            className={`relative overflow-hidden ${shouldFade ? 'max-h-32' : ''}`}
            style={{
              maskImage: shouldFade ? 'linear-gradient(to bottom, #000 70%, transparent)' : 'none'
            }}
          >
            <p className="font-lora font-light text-[#d4d4e1] text-sm leading-relaxed text-center px-2">
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {quote.shortText}
              </ReactMarkdown>
            </p>
          </div>
          {!shouldFade && (
            <div 
              className="text-[24px] text-[#a7b4c6] leading-none pointer-events-none text-center mt-1"
              style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif', transform: 'scaleX(-1)'}}
              aria-hidden="true"
            >
              ‟
            </div>
          )}
        </div>

        {/* Attribution */}
        {quote.speaker && (
          <div className="text-center">
            <span className="text-xs text-[#a7b4c6]">— {quote.speaker}</span>
          </div>
        )}

        {/* Date */}
        {quote.date && (
          <div className="text-center">
            <span className="text-xs text-[#8e9db4]">{quote.date}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function QuotesCarousel({ quotes }: QuotesCarouselProps) {
  if (quotes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[#a7b4c6] text-center">No quotes found from this source.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 snap-x snap-mandatory pb-4" style={{ width: 'max-content' }}>
          {quotes.map((quote) => (
            <CompactQuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      </div>
    </div>
  );
}