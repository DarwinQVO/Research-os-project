'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import Masonry from 'react-masonry-css';
import { QuoteCard } from './_components/QuoteCard';
import { QuoteDrawer } from './_components/QuoteDrawer';
import { ThemeToggle } from './_components/ThemeToggle';

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

  // Handle async params
  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
  }, [params]);

  const { data: quotes, error, isLoading } = useSWR(
    resolvedParams ? `/api/reports/${resolvedParams.rid}/quotes/all?clientId=${resolvedParams.cid}` : null,
    fetcher
  );

  // Filter to only show published quotes for client portal
  const publishedQuotes = useMemo(() => {
    if (!quotes) return [];
    return quotes.filter((quote: Quote) => quote.isPublic);
  }, [quotes]);

  const breakpointColumns = {
    default: 3,
    1024: 2,
    480: 1,
  };

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
          <h1 className="text-2xl font-bold mb-2">Quote Library</h1>
          <p className="text-gray-400">
            {(error as any)?.status === 404 ? 'Client or Report not found' : 'Failed to load quotes'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Navigation Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0f] sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-bold">Quote Library</h1>
              
              {/* Simple tabs */}
              <nav className="flex space-x-1">
                <button className="px-3 py-1 text-sm rounded-md bg-gray-800 text-gray-100">
                  Quotes
                </button>
                <button 
                  className="px-3 py-1 text-sm rounded-md text-gray-500 cursor-not-allowed"
                  disabled
                >
                  Sources
                </button>
              </nav>
            </div>
            
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 md:px-12 lg:px-24 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-100 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading quotes...</p>
            </div>
          </div>
        ) : publishedQuotes && publishedQuotes.length > 0 ? (
          <Masonry
            breakpointCols={breakpointColumns}
            className="flex -ml-[24px] w-auto"
            columnClassName="pl-[24px] bg-clip-padding"
          >
            {publishedQuotes.map((quote: Quote, index: number) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onClick={() => handleQuoteClick(index)}
              />
            ))}
          </Masonry>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-gray-400 text-lg">No quotes found</p>
              <p className="text-gray-500 text-sm mt-2">
                This report doesn&apos;t have any quotes yet.
              </p>
            </div>
          </div>
        )}
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
    </div>
  );
}