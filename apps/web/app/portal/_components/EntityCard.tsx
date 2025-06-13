import { cn } from '@/lib/utils';
import { Entity } from '@research-os/db/entity';
import { MoreVertical, ExternalLink, Copy, User, Building, Factory, FileText } from 'lucide-react';
import { useToast } from '@/lib/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface EntityCardProps {
  entity: Entity;
  onClick: () => void;
  isSelected?: boolean;
}

export function EntityCard({ entity, onClick, isSelected = false }: EntityCardProps) {
  const { toast } = useToast();
  
  const copyEntityUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entity.primaryUrl) {
      navigator.clipboard.writeText(entity.primaryUrl);
      toast({
        title: "Copied!",
        description: "Entity URL copied to clipboard",
      });
    }
  };

  const openEntityUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entity.primaryUrl) {
      window.open(entity.primaryUrl, '_blank');
    }
  };

  // Get domain from URL for favicon
  const getDomain = (url?: string) => {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return null;
    }
  };
  
  const domain = entity.primaryUrl ? getDomain(entity.primaryUrl) : null;
  
  // Get favicon URL
  const getFaviconUrl = (url?: string) => {
    if (!url) return null;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };
  
  const faviconUrl = entity.primaryUrl ? getFaviconUrl(entity.primaryUrl) : null;
  
  // Type icon mapping
  const getTypeIcon = () => {
    switch (entity.type) {
      case 'person': return User;
      case 'company': return Building;
      case 'industry': return Factory;
      default: return FileText;
    }
  };

  // Get avatar or initials
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const TypeIcon = getTypeIcon();
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative w-full bg-[#16161c] rounded-2xl p-5 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-[#45caff]/10 hover:bg-[#1a1a21] hover:ring-1 hover:ring-[#45caff]/50 hover:scale-[1.02] hover:-translate-y-1",
        isSelected && "ring-2 ring-[#45caff] bg-[#1a1a21]"
      )}
      style={{ minHeight: '200px' }}
    >
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
            {entity.primaryUrl && (
              <>
                <DropdownMenuItem onClick={openEntityUrl} className="text-[#d4d4e1] hover:bg-[#26262e]">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyEntityUrl} className="text-[#d4d4e1] hover:bg-[#26262e]">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Content */}
      <div className="flex flex-col h-full">
        {/* Avatar - 96px as specified */}
        <div className="flex justify-center mb-4 transform transition-transform duration-300 group-hover:scale-110">
          {entity.avatarUrl ? (
            <img 
              src={entity.avatarUrl} 
              alt={`${entity.name} avatar`}
              className="w-24 h-24 rounded-2xl object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextSibling) nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={cn(
              "w-24 h-24 rounded-2xl bg-[#26262e] flex items-center justify-center text-[#a7b4c6] font-nunito font-medium text-lg",
              entity.avatarUrl ? "hidden" : "flex"
            )}
          >
            {getInitials(entity.name)}
          </div>
        </div>

        {/* Name (1-2 lines max as specified) */}
        <h3 
          className="font-nunito font-medium text-[#d4d4e1] text-center mb-3 text-base leading-tight line-clamp-2 transition-all duration-300 group-hover:text-[#45caff] group-hover:scale-105"
        >
          {entity.name}
        </h3>

        {/* Primary URL with favicon and domain */}
        {entity.primaryUrl && domain && (
          <div className="flex items-center justify-center gap-2 mb-3 px-3 py-1.5 bg-[#26262e]/60 rounded-lg mx-auto transition-all duration-300 group-hover:bg-[#45caff]/20 group-hover:scale-105">
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
              <TypeIcon 
                className={cn("w-4 h-4 text-[#a7b4c6]", faviconUrl ? "hidden" : "block")} 
              />
            </div>
            <span className="text-xs font-nunito text-[#a7b4c6] truncate max-w-[120px]">
              {domain}
            </span>
          </div>
        )}

        {/* Description (2-3 lines max as specified) */}
        {entity.description && (
          <p className="text-sm text-[#a7b4c6] text-center line-clamp-3 mb-4 font-nunito">
            {entity.description}
          </p>
        )}

        {/* Statistics at bottom */}
        <div className="mt-auto flex justify-center gap-4 transform transition-all duration-300 group-hover:translate-y-[-2px] group-hover:scale-105">
          {(entity as any).quoteCount !== undefined && (
            <div className="bg-[#45caff]/10 backdrop-blur-sm rounded-lg px-3 py-1 transition-all duration-300 group-hover:bg-[#45caff]/30 group-hover:shadow-lg group-hover:shadow-[#45caff]/20">
              <span className="text-xs font-nunito text-[#45caff] transition-colors duration-300 group-hover:text-white">
                {(entity as any).quoteCount} quote{(entity as any).quoteCount === 1 ? '' : 's'}
              </span>
            </div>
          )}
          {(entity as any).sourceCount !== undefined && (entity as any).sourceCount > 0 && (
            <div className="bg-[#26262e]/60 backdrop-blur-sm rounded-lg px-3 py-1 transition-all duration-300 group-hover:bg-[#d4d4e1]/20 group-hover:shadow-lg">
              <span className="text-xs font-nunito text-[#a7b4c6] transition-colors duration-300 group-hover:text-[#d4d4e1]">
                {(entity as any).sourceCount} source{(entity as any).sourceCount === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}