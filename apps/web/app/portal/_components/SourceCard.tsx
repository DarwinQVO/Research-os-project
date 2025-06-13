import { cn } from '@/lib/utils';
import { SourceMeta } from '@research-os/db/source';
import { MoreVertical, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/lib/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SourceCardProps {
  source: SourceMeta;
  onClick: () => void;
  isSelected?: boolean;
  hasNewQuotes?: boolean;
}

export function SourceCard({ source, onClick, isSelected = false, hasNewQuotes = false }: SourceCardProps) {
  const { toast } = useToast();
  const title = source.title || 'Untitled Source';
  const len = title.length;
  
  const copySourceUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(source.url);
    toast({
      title: "Copied!",
      description: "Source URL copied to clipboard",
    });
  };

  const openSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(source.url, '_blank');
  };

  // Get domain from URL for favicon
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  };
  
  const domain = getDomain(source.url);
  
  // Get favicon URL
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };
  
  const faviconUrl = getFaviconUrl(source.url);
  
  // Type icon mapping
  const getTypeIcon = () => {
    switch (source.type) {
      case 'video': return '🎥';
      case 'social': return '💬';
      case 'article': return '📄';
      default: return '🔗';
    }
  };

  // Use mask for long text
  const shouldUseMask = len > 180;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative w-full bg-[#16161c] rounded-2xl p-5 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-[#45caff]/10 hover:bg-[#1a1a21] hover:ring-1 hover:ring-[#45caff]/50 hover:scale-[1.02] hover:-translate-y-1",
        isSelected && "ring-2 ring-[#45caff] bg-[#1a1a21]"
      )}
      style={{ minHeight: '180px' }}
    >
      {/* New quotes indicator */}
      {hasNewQuotes && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-[#45caff] rounded-full animate-pulse" />
      )}

      {/* Hover overlay for additional info */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a21]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
      
      {/* Kebab menu */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="p-1 rounded-md hover:bg-[#26262e] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4 text-[#a7b4c6]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#16161c] border-[#26262e]">
            <DropdownMenuItem onClick={openSource} className="text-[#d4d4e1] hover:bg-[#26262e]">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Source
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copySourceUrl} className="text-[#d4d4e1] hover:bg-[#26262e]">
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Title content */}
      <div className="flex-1 flex flex-col justify-center h-full">
        <div 
          className={cn(
            "relative overflow-hidden",
            shouldUseMask && "mask-image-gradient"
          )}
          style={{ 
            maxHeight: shouldUseMask ? '240px' : 'none',
            maskImage: shouldUseMask ? 'linear-gradient(to bottom, #000 70%, transparent)' : 'none'
          }}
        >
          <h3 
            className="font-nunito font-light text-[#a7b4c6] text-center transition-all duration-300 group-hover:text-[#45caff] group-hover:scale-105"
            style={{
              fontSize: 'clamp(16px, 1.4vw, 20px)',
              lineHeight: '1.4'
            }}
          >
            {title}
          </h3>
        </div>
      </div>
      
      {/* Domain badge - bottom left */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#26262e]/80 backdrop-blur-sm rounded-lg px-3 py-1.5 transition-all duration-300 group-hover:bg-[#45caff]/20 group-hover:scale-105 group-hover:shadow-lg">
        <div className="w-4 h-4 flex items-center justify-center">
          {faviconUrl ? (
            <img 
              src={faviconUrl} 
              alt={`${domain} favicon`}
              className="w-4 h-4 rounded-sm"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextSibling) nextSibling.style.display = 'block';
              }}
            />
          ) : null}
          <div className="text-xs" style={{ display: faviconUrl ? 'none' : 'block' }}>
            {getTypeIcon()}
          </div>
        </div>
        <span className="text-xs font-nunito text-[#a7b4c6] truncate max-w-[120px] transition-colors duration-300 group-hover:text-[#d4d4e1]">
          {domain}
        </span>
      </div>
      
      {/* Quote count badge - bottom right */}
      {source.quoteCount && source.quoteCount > 0 && (
        <div className="absolute bottom-4 right-4 bg-[#45caff]/10 backdrop-blur-sm rounded-lg px-2 py-1 transition-all duration-300 group-hover:bg-[#45caff]/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[#45caff]/20">
          <span className="text-xs font-nunito text-[#45caff] transition-colors duration-300 group-hover:text-white">
            {source.quoteCount} quote{source.quoteCount === 1 ? '' : 's'}
          </span>
        </div>
      )}
    </div>
  );
}