'use client';

import useSWR from 'swr';
import { ExternalLink, Calendar, User } from 'lucide-react';
import { SourceMeta, SourceContent } from '@research-os/db/source';
import { QuotesSection } from './SourceLeftPane/QuotesSection';
import { ImagesSection } from './SourceLeftPane/ImagesSection';
import { EntitiesSection } from './SourceLeftPane/EntitiesSection';
import { BaseDrawer } from './BaseDrawer';

interface SourceDetailProps {
  source: SourceMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch source content');
  }
  return res.json();
};

export function SourceDetail({ source, open, onOpenChange }: SourceDetailProps) {
  const { data: content, error, isLoading } = useSWR<SourceContent>(
    open ? `/api/portal/sources/${source.id}/content` : null,
    fetcher
  );

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };

  const getTypeIcon = () => {
    switch (source.type) {
      case 'video': return '🎥';
      case 'social': return '💬';
      case 'article': return '📄';
      default: return '🔗';
    }
  };

  return (
    <BaseDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={source.title}
      description={`Source details for ${source.title}`}
      size="large"
    >
      <div className="h-full grid grid-cols-[3fr_2fr]">
        {/* Left Pane - Content */}
        <div className="bg-[#0a0a0f] border-r border-[#26262e] overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Left Header */}
            <header className="px-8 py-6">
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-b from-[#2a2a35] via-[#1e1e25] to-[#16161c] p-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getTypeIcon()}</div>
                  <div>
                    <h1 className="font-lora font-light text-xl text-[#d4d4e1]">
                      {source.title}
                    </h1>
                    <p className="text-sm text-[#8e9db4] mt-1">
                      {getDomain(source.url)}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* Left Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-8 py-6 space-y-8">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#45caff]"></div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-20">
                    <p className="text-[#a7b4c6]">Failed to load content</p>
                  </div>
                ) : content ? (
                  <>
                    <QuotesSection quotes={content.quotes} />
                    <ImagesSection images={content.images} />
                    <EntitiesSection entities={content.entities} />
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Metadata */}
        <aside className="bg-[#16161c] overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Right Header */}
            <header className="px-6 py-6">
            </header>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* URL */}
                <div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-[#45caff] hover:text-[#45caff]/80 transition-colors text-sm p-3 bg-[#0f0f15] rounded-lg border border-[#26262e] hover:border-[#45caff]/30"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-4 h-4 flex-shrink-0">
                        {getFaviconUrl(source.url) ? (
                          <img 
                            src={getFaviconUrl(source.url)!} 
                            alt={`${getDomain(source.url)} favicon`}
                            className="w-4 h-4 rounded-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[#d4d4e1] font-medium truncate">
                          {getDomain(source.url)}
                        </div>
                        <div className="text-xs text-[#a7b4c6] truncate mt-0.5">
                          {source.url}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                </div>

                {/* Author */}
                {source.author && (
                  <div className="flex items-center gap-2 text-[#d4d4e1]">
                    <User className="w-4 h-4 text-[#a7b4c6]" />
                    <span className="text-sm">{source.author}</span>
                  </div>
                )}

                {/* Published Date */}
                {source.publishedAt && (
                  <div className="flex items-center gap-2 text-[#d4d4e1]">
                    <Calendar className="w-4 h-4 text-[#a7b4c6]" />
                    <span className="text-sm">
                      {new Date(source.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {/* Type */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon()}</span>
                  <span className="text-sm text-[#d4d4e1] capitalize">
                    {source.type}
                  </span>
                </div>

                {/* Description */}
                {source.description && (
                  <p className="text-sm text-[#d4d4e1] leading-relaxed">
                    {source.description}
                  </p>
                )}

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a7b4c6]">Quotes</span>
                    <span className="text-[#d4d4e1]">
                      {content?.quotes?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a7b4c6]">Entities</span>
                    <span className="text-[#d4d4e1]">
                      {content?.entities?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a7b4c6]">Images</span>
                    <span className="text-[#d4d4e1]">
                      {content?.images?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </BaseDrawer>
  );
}