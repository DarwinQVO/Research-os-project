interface QuoteCardProps {
  quote: {
    id: string;
    shortText: string;
    author?: string;
    source?: string;
    sourceUrl?: string;
    tags: string[];
    createdAt: string;
  };
  onClick: () => void;
}

export function QuoteCard({ quote, onClick }: QuoteCardProps) {
  const getFaviconUrl = (url?: string) => {
    if (!url) return null;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-[#1e1e25] rounded-xl p-4 shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl hover:border hover:border-[#3b82f6aa] break-inside-avoid mb-4"
    >
      <p className="text-gray-100 text-sm leading-relaxed line-clamp-6 mb-3">
        {quote.shortText}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          {quote.author && (
            <span className="truncate">{quote.author}</span>
          )}
          {quote.author && quote.sourceUrl && (
            <span>|</span>
          )}
          {quote.sourceUrl && (
            <div className="flex items-center gap-1">
              {getFaviconUrl(quote.sourceUrl) && (
                <img
                  src={getFaviconUrl(quote.sourceUrl) || ''}
                  alt=""
                  className="w-4 h-4"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span className="truncate max-w-20">
                {new URL(quote.sourceUrl).hostname.replace('www.', '')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}