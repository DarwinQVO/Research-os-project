import { cn } from '@/lib/utils';
import { SourceMeta } from '@research-os/db/source';

interface SourceCardProps {
  source: SourceMeta;
  onClick: () => void;
}

export function SourceCard({ source, onClick }: SourceCardProps) {
  const title = source.title || 'Untitled Source';
  const len = title.length;
  
  // Adaptive height and font sizing based on title length
  let sizeClass: string;
  let heightClass: string;
  
  if (len < 50) {
    // Short titles
    sizeClass = 'text-[20px] leading-[30px]';
    heightClass = 'h-[180px]';
  } else if (len < 100) {
    // Medium titles
    sizeClass = 'text-[18px] leading-[27px]';
    heightClass = 'h-[260px]';
  } else if (len < 150) {
    // Long titles
    sizeClass = 'text-[16px] leading-[24px]';
    heightClass = 'h-[340px]';
  } else {
    // Ultra-long titles
    sizeClass = 'text-[14px] leading-[21px]';
    heightClass = 'h-[340px]';
  }
  
  const isUltraLong = len >= 150;
  
  // Get domain from URL for favicon
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  };
  
  const domain = getDomain(source.url);
  
  // Type icon mapping
  const getTypeIcon = () => {
    switch (source.type) {
      case 'video': return '🎥';
      case 'social': return '💬';
      case 'article': return '📄';
      default: return '🔗';
    }
  };
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative w-[264px] bg-[#16161c] rounded-2xl px-6 py-8 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:bg-[#1a1a21] hover:ring-1 hover:ring-[#45caff33] break-inside-avoid mb-6",
        heightClass
      )}
    >
      {/* Top quote mark */}
      <div 
        className="text-[28px] text-[#a7b4c6] leading-none pointer-events-none text-center -mb-1"
        style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif'}}
        aria-hidden="true"
      >
        ‟
      </div>
      
      {/* Title content */}
      <div className="flex-1 flex flex-col justify-center">
        <div className={cn(
          "relative overflow-hidden",
          isUltraLong ? "max-h-[200px]" : ""
        )}>
          <h3 className={cn(
            "font-nunito font-light text-[#a7b4c6] text-center transition-[font-size] duration-200",
            sizeClass
          )}>
            {title}
          </h3>
          {isUltraLong && (
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#16161c] via-[#16161c]/70 to-transparent" />
          )}
        </div>
      </div>
      
      {/* Bottom quote mark - hidden for ultra-long */}
      {!isUltraLong && (
        <div 
          className="text-[28px] text-[#a7b4c6] leading-none pointer-events-none text-center mt-2"
          style={{fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", serif', transform: 'scaleX(-1)'}}
          aria-hidden="true"
        >
          ‟
        </div>
      )}
      
      {/* Domain badge - bottom left */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#26262e]/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
        <div className="w-4 h-4 flex items-center justify-center text-xs">
          {getTypeIcon()}
        </div>
        <span className="text-xs font-nunito text-[#a7b4c6] truncate max-w-[120px]">
          {domain}
        </span>
      </div>
      
      {/* Quote count badge - bottom right */}
      {source.quoteCount && source.quoteCount > 0 && (
        <div className="absolute bottom-4 right-4 bg-[#45caff]/10 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-xs font-nunito text-[#45caff]">
            {source.quoteCount} quote{source.quoteCount === 1 ? '' : 's'}
          </span>
        </div>
      )}
      
      {/* Hover overlay for metadata */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e25]/95 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute bottom-16 left-4 right-4">
          {source.author && (
            <p className="text-xs text-[#a7b4c6] mb-1 truncate">
              By {source.author}
            </p>
          )}
          {source.publishedAt && (
            <p className="text-xs text-[#a7b4c6]/70 truncate">
              {new Date(source.publishedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}