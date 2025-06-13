'use client';

import { useState } from 'react';
import { ExternalLink, User, Building, Factory, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import useSWR from 'swr';
import { Entity } from '@research-os/db/entity';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BaseDrawer } from '../../../../../_components/BaseDrawer';

interface EntityDrawerProps {
  entity: Entity | null;
  isOpen: boolean;
  onClose: () => void;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function EntityDrawer({ entity, isOpen, onClose }: EntityDrawerProps) {
  const [quotesOpen, setQuotesOpen] = useState(true);
  const [entitiesOpen, setEntitiesOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  // Fetch entity content
  const { data: content } = useSWR(
    entity ? `/api/entities/${entity.id}` : null,
    fetcher
  );

  if (!entity) return null;

  // Get entity type icon
  const getTypeIcon = () => {
    switch (entity.type) {
      case 'person': return User;
      case 'company': return Building;
      case 'industry': return Factory;
      default: return FileText;
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  // Get domain from URL
  const getDomain = (url?: string) => {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return null;
    }
  };

  const TypeIcon = getTypeIcon();
  const faviconUrl = entity.primaryUrl ? getFaviconUrl(entity.primaryUrl) : null;
  const domain = entity.primaryUrl ? getDomain(entity.primaryUrl) : null;

  return (
    <BaseDrawer
      open={isOpen}
      onOpenChange={onClose}
      title={entity.name}
      description={`Entity details for ${entity.name}`}
      size="large"
    >
      <div className="h-full grid grid-cols-[2fr_3fr]">
        {/* Left Panel - Entity Info */}
        <aside className="bg-[#16161c] border-r border-[#26262e] overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Entity Header */}
            <header className="px-6 py-6">
            </header>

            {/* Entity Info */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Big Avatar */}
              <div className="flex justify-center mb-6">
                {entity.avatarUrl ? (
                  <img 
                    src={entity.avatarUrl} 
                    alt={`${entity.name} avatar`}
                    className="w-32 h-32 rounded-2xl object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextSibling) nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={cn(
                    "w-32 h-32 rounded-2xl bg-[#26262e] flex items-center justify-center text-[#a7b4c6] font-nunito font-medium text-2xl",
                    entity.avatarUrl ? "hidden" : "flex"
                  )}
                >
                  {getInitials(entity.name)}
                </div>
              </div>

              {/* Name */}
              <h1 className="font-lora font-light text-3xl text-[#d4d4e1] text-center mb-6">
                {entity.name}
              </h1>

              {/* Type */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <TypeIcon className="w-5 h-5 text-[#a7b4c6]" />
                <span className="text-sm font-nunito text-[#a7b4c6] capitalize">
                  {entity.type}
                </span>
              </div>

              {/* Primary URL */}
              {entity.primaryUrl && domain && (
                <div className="mb-6">
                  <a 
                    href={entity.primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-[#45caff] hover:text-[#45caff]/80 transition-colors text-sm p-3 bg-[#0f0f15] rounded-lg border border-[#26262e] hover:border-[#45caff]/30"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-4 h-4 flex-shrink-0">
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
                      <div className="min-w-0 flex-1">
                        <div className="text-[#d4d4e1] font-medium truncate">
                          {domain}
                        </div>
                        <div className="text-xs text-[#a7b4c6] truncate mt-0.5">
                          {entity.primaryUrl}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                </div>
              )}

              {/* Description */}
              {entity.description && (
                <div className="mb-6">
                  <p className="text-sm text-[#d4d4e1] leading-relaxed">
                    {entity.description}
                  </p>
                </div>
              )}

              {/* Statistics */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#a7b4c6]">Quotes</span>
                  <span className="text-[#d4d4e1]">
                    {content?.quotes?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a7b4c6]">Sources</span>
                  <span className="text-[#d4d4e1]">
                    {content?.sources?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a7b4c6]">Related</span>
                  <span className="text-[#d4d4e1]">
                    {content?.relatedEntities?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Panel - Relationships */}
        <div className="bg-[#0a0a0f] overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Right Header */}
            <header className="px-8 py-6">
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-b from-[#2a2a35] via-[#1e1e25] to-[#16161c] p-4">
                <h2 className="font-lora font-light text-xl text-[#d4d4e1]">
                  Related Content
                </h2>
              </div>
            </header>

            {/* Right Content - Scrollable Relationships */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {/* Quotes Accordion */}
              <Collapsible open={quotesOpen} onOpenChange={setQuotesOpen}>
                <CollapsibleTrigger className="w-full">
                  <Card className="border-[#26262e] bg-[#1a1a21] hover:bg-[#1e1e25] hover:ring-1 hover:ring-[#45caff]/30 hover:scale-[1.01] transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-[#d4d4e1]">Quotes</h3>
                          <span className="text-sm text-[#a7b4c6]">
                            ({content?.quotes?.length || 0})
                          </span>
                        </div>
                        {quotesOpen ? (
                          <ChevronDown className="w-4 h-4 text-[#a7b4c6]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#a7b4c6]" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="space-y-3">
                    {content?.quotes?.map((quote: any) => (
                      <div key={quote.id} className="p-4 bg-[#1a1a21] rounded-lg border border-[#26262e] transition-all duration-300 hover:bg-[#1e1e25] hover:border-[#45caff]/30 hover:scale-[1.01] cursor-pointer">
                        <p className="text-sm text-[#d4d4e1] line-clamp-3 mb-2 leading-relaxed">
                          "{quote.shortText}"
                        </p>
                        {quote.sourceTitle && (
                          <p className="text-xs text-[#a7b4c6]">— {quote.sourceTitle}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Related Entities */}
              {content?.relatedEntities && content.relatedEntities.length > 0 && (
                <Collapsible open={entitiesOpen} onOpenChange={setEntitiesOpen}>
                  <CollapsibleTrigger className="w-full">
                    <Card className="border-[#26262e] bg-[#1a1a21] hover:bg-[#1e1e25] transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-[#d4d4e1]">Related Entities</h3>
                            <span className="text-sm text-[#a7b4c6]">
                              ({content.relatedEntities.length})
                            </span>
                          </div>
                          {entitiesOpen ? (
                            <ChevronDown className="w-4 h-4 text-[#a7b4c6]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#a7b4c6]" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      {content.relatedEntities.map((relatedEntity: any) => (
                        <div 
                          key={relatedEntity.id}
                          className="flex items-center gap-3 p-3 bg-[#1a1a21] rounded-lg border border-[#26262e] transition-all duration-300 hover:bg-[#1e1e25] hover:border-[#45caff]/30 hover:scale-[1.02] cursor-pointer"
                        >
                          {relatedEntity.avatarUrl ? (
                            <img 
                              src={relatedEntity.avatarUrl} 
                              alt={relatedEntity.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#45caff]/20 flex items-center justify-center text-xs text-[#45caff]">
                              {getInitials(relatedEntity.name)}
                            </div>
                          )}
                          <span className="text-sm text-[#d4d4e1] truncate">{relatedEntity.name}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Sources */}
              {content?.sources && content.sources.length > 0 && (
                <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
                  <CollapsibleTrigger className="w-full">
                    <Card className="border-[#26262e] bg-[#1a1a21] hover:bg-[#1e1e25] transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-[#d4d4e1]">Sources</h3>
                            <span className="text-sm text-[#a7b4c6]">
                              ({content.sources.length})
                            </span>
                          </div>
                          {sourcesOpen ? (
                            <ChevronDown className="w-4 h-4 text-[#a7b4c6]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#a7b4c6]" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      {content.sources.map((source: any) => {
                        const sourceDomain = getDomain(source.url);
                        const sourceFavicon = getFaviconUrl(source.url);
                        
                        return (
                          <div 
                            key={source.id}
                            className="flex items-center gap-3 p-3 bg-[#1a1a21] rounded-lg border border-[#26262e] transition-all duration-300 hover:bg-[#1e1e25] hover:border-[#45caff]/30 hover:scale-[1.02] cursor-pointer"
                          >
                            {sourceFavicon ? (
                              <img 
                                src={sourceFavicon} 
                                alt={sourceDomain || 'Source'}
                                className="w-5 h-5 rounded-sm flex-shrink-0"
                              />
                            ) : (
                              <div className="w-5 h-5 bg-[#45caff]/20 rounded-sm flex-shrink-0" />
                            )}
                            <span className="text-sm text-[#d4d4e1] truncate">
                              {sourceDomain || 'Unknown'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseDrawer>
  );
}