'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR, { mutate } from 'swr';
import { SourceMeta } from '@research-os/db/source';
import { SourceGrid } from '../_components/SourceGrid';
import { SourceDetail } from './SourceDetail';
import { EmptyState } from './EmptyState';
import { ThemeToggle } from '../_components/ThemeToggle';
import { ToastProvider } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toaster';

interface SourcesPageProps {
  params: Promise<{ cid: string; rid: string }> | { cid: string; rid: string };
}

const fetcher = async (url: string) => {
  try {
    console.log('Fetching from URL:', url);
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Fetch error:', res.status, errorText);
      const error = new Error('An error occurred while fetching the data.') as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    
    const text = await res.text();
    console.log('Response text:', text);
    
    if (!text) {
      console.warn('Empty response received');
      return [];
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Invalid JSON:', text);
      throw new Error(`Invalid JSON response: ${text}`);
    }
  } catch (error) {
    console.error('Fetcher error:', error);
    throw error;
  }
};


export default function SourcesPage({ params }: SourcesPageProps) {
  const [selectedSource, setSelectedSource] = useState<SourceMeta | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{ cid: string; rid: string } | null>(null);
  const [newQuoteSources, setNewQuoteSources] = useState<Set<string>>(new Set());

  // Handle async params
  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
  }, [params]);

  const { data: sources, error: sourcesError, isLoading: sourcesLoading } = useSWR(
    resolvedParams ? `/api/reports/${resolvedParams.rid}/sources?status=published` : null,
    fetcher
  );

  const handleSourceClick = (source: SourceMeta) => {
    setSelectedSource(source);
    setIsDetailOpen(true);
    // Remove from new quotes set when opened
    setNewQuoteSources(prev => {
      const next = new Set(prev);
      next.delete(source.id);
      return next;
    });
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedSource(null);
  };

  // Simulate real-time updates (in a real app, this would be from WebSocket or polling)
  useEffect(() => {
    if (!resolvedParams || !sources) return;

    const interval = setInterval(() => {
      // Refetch sources data
      mutate(`/api/reports/${resolvedParams.rid}/sources?status=published`);
      
      // Simulate new quotes notification
      if (sources.length > 0 && Math.random() < 0.1) {
        const randomSource = sources[Math.floor(Math.random() * sources.length)];
        setNewQuoteSources(prev => new Set(Array.from(prev).concat(randomSource.id)));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [resolvedParams, sources]);

  // Show loading while params are being resolved
  if (!resolvedParams) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (sourcesError) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Source Library</h1>
          <p className="text-gray-400">
            {(sourcesError as any)?.status === 404 
              ? 'Client or Report not found' 
              : 'Failed to load sources'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
        {/* Navigation Header */}
        <header className="flex justify-start items-center gap-10 px-6 h-[56px] border-b border-[#26262e] sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-sm">
          <h1 className="font-lora font-light text-[28px] text-[#d4d4e1]">
            Source Library
          </h1>
          
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {sourcesLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center py-20"
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-100 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading sources...</p>
                </div>
              </motion.div>
            ) : sources && sources.length > 0 ? (
              <motion.div
                key="sources"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
                className="max-w-[1440px] mx-auto"
              >
                <SourceGrid 
                  sources={sources} 
                  onSourceClick={handleSourceClick}
                  selectedSource={selectedSource}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
              >
                <EmptyState />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Source Detail Modal */}
        <SourceDetail
          source={selectedSource}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
        />

        <Toaster />
      </div>
    </ToastProvider>
  );
}