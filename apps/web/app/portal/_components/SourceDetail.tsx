'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { X, ExternalLink, Calendar, User } from 'lucide-react';
import { SourceMeta, SourceContent } from '@research-os/db/source';
import { QuotesSection } from './SourceLeftPane/QuotesSection';
import { ImagesSection } from './SourceLeftPane/ImagesSection';
import { EntitiesSection } from './SourceLeftPane/EntitiesSection';

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

  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (open) {
      // Store scroll position and prevent body scroll
      setScrollPosition(window.scrollY);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position and body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollPosition);
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [open, scrollPosition]);

  if (!open) return null;

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
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
    <div className="fixed inset-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-sm">
      <div className="h-full flex">
        {/* Left Pane - 70% */}
        <div className="flex-1 bg-[#0a0a0f] border-r border-[#26262e] overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Left Header */}
            <header className="flex items-center justify-between px-8 py-6 border-b border-[#26262e]">
              <div className="flex items-center gap-4">
                <div className="text-2xl">{getTypeIcon()}</div>
                <div>
                  <h1 className="font-nunito font-light text-[#d4d4e1] text-xl">
                    {source.title}
                  </h1>
                  <p className="text-sm text-[#a7b4c6] mt-1">
                    {getDomain(source.url)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 text-[#a7b4c6] hover:text-[#d4d4e1] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
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

        {/* Right Sidebar - 30% (400px fixed) */}
        <div className="w-[400px] bg-[#16161c] overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Right Header */}
            <header className="px-6 py-6 border-b border-[#26262e]">
              <h2 className="font-nunito font-light text-[#d4d4e1] text-lg">
                Source Details
              </h2>
            </header>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* URL */}
                <div>
                  <label className="block text-sm font-nunito text-[#a7b4c6] mb-2">
                    URL
                  </label>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#45caff] hover:text-[#45caff]/80 transition-colors text-sm break-all"
                  >
                    <span className="truncate">{source.url}</span>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                </div>

                {/* Author */}
                {source.author && (
                  <div>
                    <label className="block text-sm font-nunito text-[#a7b4c6] mb-2">
                      Author
                    </label>
                    <div className="flex items-center gap-2 text-[#d4d4e1]">
                      <User className="w-4 h-4 text-[#a7b4c6]" />
                      <span className="text-sm">{source.author}</span>
                    </div>
                  </div>
                )}

                {/* Published Date */}
                {source.publishedAt && (
                  <div>
                    <label className="block text-sm font-nunito text-[#a7b4c6] mb-2">
                      Published
                    </label>
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
                  </div>
                )}

                {/* Type */}
                <div>
                  <label className="block text-sm font-nunito text-[#a7b4c6] mb-2">
                    Type
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon()}</span>
                    <span className="text-sm text-[#d4d4e1] capitalize">
                      {source.type}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {source.description && (
                  <div>
                    <label className="block text-sm font-nunito text-[#a7b4c6] mb-2">
                      Description
                    </label>
                    <p className="text-sm text-[#d4d4e1] leading-relaxed">
                      {source.description}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div>
                  <label className="block text-sm font-nunito text-[#a7b4c6] mb-2">
                    Statistics
                  </label>
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
          </div>
        </div>
      </div>
    </div>
  );
}