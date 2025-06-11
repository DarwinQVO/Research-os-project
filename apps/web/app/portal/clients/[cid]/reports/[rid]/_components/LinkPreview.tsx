'use client';

import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { ExternalLink } from 'lucide-react';

interface LinkPreviewProps {
  sourceUrl: string;
  className?: string;
}

interface LinkPreviewData {
  title: string;
  description: string;
  image: string;
  favicon: string;
  type: string;
}

export function LinkPreview({ sourceUrl, className = '' }: LinkPreviewProps) {
  const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sourceUrl) {
      setIsLoading(false);
      return;
    }

    // Check if it's a video platform URL
    const isVideoUrl = ReactPlayer.canPlay(sourceUrl);
    const domain = new URL(sourceUrl).hostname.toLowerCase();
    const isVideoProvider = domain.includes('youtube') || 
                           domain.includes('youtu.be') || 
                           domain.includes('twitter') || 
                           domain.includes('x.com');

    if (isVideoUrl && isVideoProvider) {
      // For video URLs, we don't need to fetch preview data
      setPreviewData({
        title: domain,
        description: '',
        image: '',
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        type: 'video'
      });
      setIsLoading(false);
      return;
    }

    // Fetch preview data for other URLs
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(sourceUrl)}`);
        if (response.ok) {
          const data = await response.json();
          setPreviewData(data);
        } else {
          throw new Error('Failed to fetch preview');
        }
      } catch (err) {
        console.error('Link preview error:', err);
        // Fallback data
        const domain = new URL(sourceUrl).hostname;
        setPreviewData({
          title: domain,
          description: '',
          image: '',
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          type: 'website'
        });
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [sourceUrl]);

  if (isLoading) {
    return (
      <div className={`bg-muted/40 backdrop-blur rounded-xl p-4 animate-pulse ${className}`}>
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  if (!previewData) {
    return null;
  }

  const domain = new URL(sourceUrl).hostname;
  const isVideoUrl = ReactPlayer.canPlay(sourceUrl);
  const isVideoProvider = domain.includes('youtube') || 
                         domain.includes('youtu.be') || 
                         domain.includes('twitter') || 
                         domain.includes('x.com');
  
  // Normalize domain display
  const displayDomain = domain.replace('youtu.be', 'youtube.com').replace('www.', '');

  // Render video player for supported video URLs
  if (isVideoUrl && isVideoProvider) {
    return (
      <div className={`bg-[color:var(--mymind-bg)]/40 backdrop-blur rounded-xl p-4 ${className}`}>
        <div className="aspect-video rounded-lg overflow-hidden">
          <ReactPlayer
            url={sourceUrl}
            width="100%"
            height="100%"
            controls
            config={{
              youtube: {
                playerVars: {
                  showinfo: 1,
                  origin: typeof window !== 'undefined' ? window.location.origin : ''
                }
              }
            }}
          />
        </div>
        {/* No URL/domain info for embedded videos - it's obvious it's YouTube/Twitter */}
      </div>
    );
  }

  // Render standard link preview
  return (
    <div className={`bg-[color:var(--mymind-bg)]/40 backdrop-blur rounded-xl p-4 space-y-3 ${className}`}>
      {previewData.image && (
        <div className="flex items-start gap-3">
          <img
            src={previewData.image}
            alt=""
            className="w-[90px] h-[90px] object-cover rounded-lg flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2 mb-1">
              {previewData.title}
            </h4>
            {previewData.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {previewData.description}
              </p>
            )}
          </div>
        </div>
      )}
      
      {!previewData.image && previewData.title && (
        <div>
          <h4 className="font-medium text-sm mb-1">
            {previewData.title}
          </h4>
          {previewData.description && (
            <p className="text-xs text-muted-foreground line-clamp-3">
              {previewData.description}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-muted/20">
        <div className="flex items-center gap-2">
          <img
            src={previewData.favicon}
            alt=""
            className="w-4 h-4"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="font-lora font-normal text-[16px] leading-[18px] text-metaMuted">{displayDomain}</span>
        </div>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-[color:var(--mymind-accent)] hover:opacity-80"
        >
          Open
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}