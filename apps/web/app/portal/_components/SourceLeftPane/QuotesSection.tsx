'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Quote {
  id: string;
  shortText: string;
  text?: string;
  speaker?: string;
  createdAt: string;
}

interface QuotesSectionProps {
  quotes: Quote[];
}

function MiniQuoteCard({ quote }: { quote: Quote }) {
  return (
    <div className="bg-[#16161c] rounded-xl p-4 border border-[#26262e] hover:border-[#45caff]/30 transition-colors">
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
          <div 
            className="text-[24px] text-[#a7b4c6] leading-none pointer-events-none text-center mt-1"
            style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif', transform: 'scaleX(-1)'}}
            aria-hidden="true"
          >
            ‟
          </div>
        </div>

        {/* Attribution */}
        {quote.speaker && (
          <div className="text-center">
            <span className="text-xs text-[#a7b4c6]">— {quote.speaker}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function QuotesSection({ quotes }: QuotesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 w-full group"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-[#a7b4c6] group-hover:text-[#d4d4e1] transition-colors" />
        ) : (
          <ChevronRight className="w-5 h-5 text-[#a7b4c6] group-hover:text-[#d4d4e1] transition-colors" />
        )}
        <h3 className="font-nunito font-light text-[#d4d4e1] text-lg">
          Quotes ({quotes.length})
        </h3>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="space-y-4 pl-8">
          {quotes.length === 0 ? (
            <p className="text-[#a7b4c6] text-sm italic">
              No quotes found from this source.
            </p>
          ) : (
            <div className="grid gap-4">
              {quotes.map((quote) => (
                <MiniQuoteCard key={quote.id} quote={quote} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}