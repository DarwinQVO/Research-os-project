'use client';

interface LinkPreviewMiniProps {
  sourceUrl: string;
  className?: string;
}

export function LinkPreviewMini({ sourceUrl, className = '' }: LinkPreviewMiniProps) {
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const faviconUrl = getFaviconUrl(sourceUrl);
  const domain = getDomain(sourceUrl);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {faviconUrl && (
        <img
          src={faviconUrl}
          alt=""
          className="w-4 h-4 flex-shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <span className="truncate text-xs text-gray-400">
        {domain}
      </span>
    </div>
  );
}