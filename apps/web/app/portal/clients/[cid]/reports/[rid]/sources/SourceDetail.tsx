'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { X, ArrowLeft, Calendar, User } from 'lucide-react';
import { SourceMeta, SourceContent } from '@research-os/db/source';
import { ContentTabs } from './ContentTabs';
import { useToast } from '@/lib/use-toast';

interface SourceDetailProps {
  source: SourceMeta | null;
  isOpen: boolean;
  onClose: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch source content');
  }
  return res.json();
};

export function SourceDetail({ source, isOpen, onClose }: SourceDetailProps) {
  const { toast } = useToast();
  const { data: content, error, isLoading } = useSWR<SourceContent>(
    isOpen && source ? `/api/portal/sources/${source.id}/content` : null,
    fetcher
  );

  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScrollPosition(window.scrollY);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollPosition);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen, scrollPosition]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!source || !isOpen) return null;

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

  const copySourceUrl = () => {
    navigator.clipboard.writeText(source.url);
    toast({
      title: "Copied!",
      description: "Source URL copied to clipboard",
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          layoutId={source.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="h-full flex"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Pane - 70% */}
          <div className="flex-1 bg-[#0a0a0f] border-r border-[#26262e] overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Left Content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#45caff]"></div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center py-20">
                      <p className="text-[#a7b4c6]">Failed to load content</p>
                    </div>
                  ) : content ? (
                    <ContentTabs content={content} />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - 30% (400px fixed) */}
          <div className="w-[400px] bg-[#16161c] overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Sticky Header */}
              <header className="sticky top-0 bg-[#16161c] border-b border-[#26262e] p-6 z-10">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 text-[#a7b4c6] hover:text-[#d4d4e1] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 text-[#a7b4c6] hover:text-[#d4d4e1] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  {getFaviconUrl(source.url) && (
                    <img 
                      src={getFaviconUrl(source.url)!} 
                      alt={`${getDomain(source.url)} favicon`}
                      className="w-5 h-5 rounded-sm"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="font-nunito font-light text-[#d4d4e1] text-lg truncate">
                      {source.title}
                    </h1>
                    <p className="text-sm text-[#a7b4c6] truncate">
                      {getDomain(source.url)}
                    </p>
                  </div>
                </div>
              </header>

              {/* Right Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* URL */}
                  <div>
                    <label className="block text-sm font-nunito text-[#a7b4c6] mb-2">
                      URL
                    </label>
                    <button
                      onClick={copySourceUrl}
                      className="w-full flex items-center gap-3 text-[#45caff] hover:text-[#45caff]/80 transition-colors text-sm p-3 bg-[#0f0f15] rounded-lg border border-[#26262e] hover:border-[#45caff]/30 text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFaviconUrl(source.url) && (
                          <img 
                            src={getFaviconUrl(source.url)!} 
                            alt={`${getDomain(source.url)} favicon`}
                            className="w-4 h-4 rounded-sm flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[#d4d4e1] font-medium truncate">
                            {getDomain(source.url)}
                          </div>
                          <div className="text-xs text-[#a7b4c6] truncate mt-0.5">
                            Click to copy URL
                          </div>
                        </div>
                      </div>
                    </button>
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
                    <label className="block text-sm font-nunito text-[#a7b4c6] mb-3">
                      Statistics
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#0f0f15] rounded-lg p-3 text-center border border-[#26262e]">
                        <div className="text-lg font-bold text-[#45caff]">
                          {content?.quotes?.length || 0}
                        </div>
                        <div className="text-xs text-[#a7b4c6] mt-1">Quotes</div>
                      </div>
                      <div className="bg-[#0f0f15] rounded-lg p-3 text-center border border-[#26262e]">
                        <div className="text-lg font-bold text-[#45caff]">
                          {content?.entities?.length || 0}
                        </div>
                        <div className="text-xs text-[#a7b4c6] mt-1">Entities</div>
                      </div>
                      <div className="bg-[#0f0f15] rounded-lg p-3 text-center border border-[#26262e]">
                        <div className="text-lg font-bold text-[#45caff]">
                          {content?.images?.length || 0}
                        </div>
                        <div className="text-xs text-[#a7b4c6] mt-1">Images</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}