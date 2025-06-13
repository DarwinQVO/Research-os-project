'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { QuoteCard } from './_components/QuoteCard';
import { QuoteDrawer } from './_components/QuoteDrawer';
import { ThemeToggle } from './_components/ThemeToggle';
import PortalTabs from '../../../../_components/TabsQuotesSources';
import { SourceCard } from '../../../../_components/SourceCard';
import { SourceDetail } from '../../../../_components/SourceDetail';
import { EntityCard } from '../../../../_components/EntityCard';
import { EntityDrawer } from './entities/EntityDrawer';
import { SourceMeta } from '@research-os/db/source';
import { Entity } from '@research-os/db/entity';

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
    
    // Check if response is empty
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

interface PortalPageProps {
  params: Promise<{ cid: string; rid: string }> | { cid: string; rid: string };
}

interface Quote {
  id: string;
  shortText: string;
  text?: string;
  author?: string;
  source?: string;
  sourceUrl?: string;
  tags: string[];
  createdAt: string;
  isPublic?: boolean;
  isApproved?: boolean;
  status?: 'Published' | 'Approved' | 'Pending';
}

export default function PortalPage({ params }: PortalPageProps) {
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{ cid: string; rid: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'quotes' | 'sources' | 'entities'>('quotes');
  const [selectedSource, setSelectedSource] = useState<SourceMeta | null>(null);
  const [isSourceDetailOpen, setIsSourceDetailOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [isEntityDrawerOpen, setIsEntityDrawerOpen] = useState(false);

  // Handle async params
  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
  }, [params]);

  const { data: quotes, error: quotesError, isLoading: quotesLoading } = useSWR(
    resolvedParams ? `/api/reports/${resolvedParams.rid}/quotes/all?clientId=${resolvedParams.cid}` : null,
    fetcher
  );

  const { data: sources, error: sourcesError, isLoading: sourcesLoading } = useSWR(
    resolvedParams ? `/api/portal/reports/${resolvedParams.rid}/sources` : null,
    fetcher
  );

  const { data: entities, error: entitiesError, isLoading: entitiesLoading } = useSWR(
    resolvedParams ? `/api/reports/${resolvedParams.rid}/entities?public=1` : null,
    fetcher
  );

  // Filter to only show published quotes for client portal
  const publishedQuotes = useMemo(() => {
    if (!quotes) return [];
    return quotes.filter((quote: Quote) => quote.isPublic);
  }, [quotes]);


  const handleQuoteClick = (index: number) => {
    setSelectedQuoteIndex(index);
    setIsDrawerOpen(true);
  };

  const handlePrevious = () => {
    if (selectedQuoteIndex !== null && selectedQuoteIndex > 0) {
      setSelectedQuoteIndex(selectedQuoteIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedQuoteIndex !== null && publishedQuotes && selectedQuoteIndex < publishedQuotes.length - 1) {
      setSelectedQuoteIndex(selectedQuoteIndex + 1);
    }
  };

  const handleSourceClick = (source: SourceMeta) => {
    setSelectedSource(source);
    setIsSourceDetailOpen(true);
  };

  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(entity);
    setIsEntityDrawerOpen(true);
  };

  const isLoading = activeTab === 'quotes' ? quotesLoading : 
                   activeTab === 'sources' ? sourcesLoading : entitiesLoading;
  const error = activeTab === 'quotes' ? quotesError : 
               activeTab === 'sources' ? sourcesError : entitiesError;
  const currentData = activeTab === 'quotes' ? publishedQuotes : 
                     activeTab === 'sources' ? sources : entities;

  const selectedQuote = selectedQuoteIndex !== null && publishedQuotes ? publishedQuotes[selectedQuoteIndex] : null;

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

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            {activeTab === 'quotes' ? 'Quote Library' : 
             activeTab === 'sources' ? 'Source Library' : 'Entity Library'}
          </h1>
          <p className="text-gray-400">
            {(error as any)?.status === 404 
              ? 'Client or Report not found' 
              : `Failed to load ${activeTab}`
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Navigation Header */}
      <header className="flex justify-start items-center gap-10 px-6 h-[56px] relative sticky top-0 z-40 bg-[#0a0a0f]">
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-b from-[#2a2a35] via-[#1e1e25] to-[#16161c] px-4 py-2">
          <h1 className="font-lora font-light text-[28px] text-[#d4d4e1]">
            {activeTab === 'quotes' ? 'Quote Library' : 
             activeTab === 'sources' ? 'Source Library' : 'Entity Library'}
          </h1>
        </div>
        
        <PortalTabs 
          value={activeTab} 
          onChange={(newTab) => {
            setActiveTab(newTab);
            // Store scroll position when switching tabs
            const scrollElement = document.documentElement;
            scrollElement.style.scrollBehavior = 'auto';
            setTimeout(() => {
              scrollElement.style.scrollBehavior = '';
            }, 200);
          }} 
        />
        
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center py-20"
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-100 mx-auto mb-4"></div>
                <p className="text-gray-400">
                  Loading {activeTab}...
                </p>
              </div>
            </motion.div>
          ) : currentData && currentData.length > 0 ? (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="portal-card-spacing columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 space-y-4 sm:space-y-5 md:space-y-6 max-w-[1440px] mx-auto"
            >
              {activeTab === 'quotes' ? (
                publishedQuotes?.map((quote: Quote, index: number) => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    onClick={() => handleQuoteClick(index)}
                  />
                ))
              ) : activeTab === 'sources' ? (
                sources?.map((source: SourceMeta) => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    onClick={() => handleSourceClick(source)}
                  />
                ))
              ) : (
                entities?.map((entity: Entity) => (
                  <EntityCard
                    key={entity.id}
                    entity={entity}
                    onClick={() => handleEntityClick(entity)}
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center py-20"
            >
              <div className="text-center">
                <p className="text-gray-400 text-lg">
                  No {activeTab} found
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  This report doesn&apos;t have any {activeTab} yet.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quote Drawer */}
      <QuoteDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        quote={selectedQuote}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={selectedQuoteIndex !== null && selectedQuoteIndex > 0}
        hasNext={selectedQuoteIndex !== null && publishedQuotes && selectedQuoteIndex < publishedQuotes.length - 1}
      />

      {/* Source Detail */}
      {selectedSource && (
        <SourceDetail
          source={selectedSource}
          open={isSourceDetailOpen}
          onOpenChange={setIsSourceDetailOpen}
        />
      )}

      {/* Entity Drawer */}
      <EntityDrawer
        entity={selectedEntity}
        isOpen={isEntityDrawerOpen}
        onClose={() => setIsEntityDrawerOpen(false)}
      />
    </div>
  );
}