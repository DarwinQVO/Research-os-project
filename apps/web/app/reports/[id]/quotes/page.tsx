'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { ResearcherQuoteCard } from '../_components/ResearcherQuoteCard';
import { QuoteDrawer } from '@/app/portal/clients/[cid]/reports/[rid]/_components/QuoteDrawer';
import { AddQuoteDialog } from '../_components/AddQuoteDialog';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

interface Quote {
  id: string;
  shortText: string;
  text?: string;
  author?: string;
  source?: string;
  sourceUrl?: string;
  date?: string;
  createdAt: string;
  isPublic?: boolean;
  isApproved?: boolean;
  status?: 'Published' | 'Approved' | 'Pending';
}

interface ReportQuotesPageProps {
  params: { id: string };
}

export default function ReportQuotesPage({ params }: ReportQuotesPageProps) {
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Published');

  const { data: report } = useSWR(`/api/reports/${params.id}`, fetcher);
  const { data: quotes, error, isLoading } = useSWR(
    report ? `/api/reports/${params.id}/quotes?clientId=${report.clientId}` : null,
    fetcher
  );

  // Compute quote status and filter by status
  const quotesWithStatus = useMemo(() => {
    if (!quotes) return [];
    return quotes.map((quote: Quote) => ({
      ...quote,
      status: quote.isPublic ? 'Published' : 
              (quote.isApproved ? 'Approved' : 'Pending') as 'Published' | 'Approved' | 'Pending'
    }));
  }, [quotes]);

  const quoteCounts = useMemo(() => {
    const counts = {
      Published: 0,
      Approved: 0,
      Pending: 0,
    };
    
    quotesWithStatus.forEach((quote: Quote) => {
      if (quote.status) {
        counts[quote.status]++;
      }
    });
    
    return counts;
  }, [quotesWithStatus]);

  const filterQuotesByStatus = (status: 'Published' | 'Approved' | 'Pending') => {
    return quotesWithStatus.filter((quote: Quote) => quote.status === status);
  };

  const breakpointColumns = {
    default: 3,
    1024: 2,
    480: 1,
  };

  const handleQuoteClick = (index: number, filteredQuotes?: Quote[]) => {
    // Find the actual index in the full quotes array
    const actualIndex = filteredQuotes ? 
      quotesWithStatus.findIndex((q: Quote) => q.id === filteredQuotes[index].id) : 
      index;
    setSelectedQuoteIndex(actualIndex);
    setIsDrawerOpen(true);
  };

  const handlePrevious = () => {
    if (selectedQuoteIndex !== null && selectedQuoteIndex > 0) {
      setSelectedQuoteIndex(selectedQuoteIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedQuoteIndex !== null && quotesWithStatus && selectedQuoteIndex < quotesWithStatus.length - 1) {
      setSelectedQuoteIndex(selectedQuoteIndex + 1);
    }
  };

  const selectedQuote = selectedQuoteIndex !== null && quotesWithStatus ? quotesWithStatus[selectedQuoteIndex] : null;

  if (isLoading) {
    return (
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quotes...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Failed to load quotes
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/reports/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Report
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Quotes</h1>
            <p className="text-gray-600 mt-1">{report?.title}</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setIsAddQuoteOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Quote
        </Button>
      </div>

      {/* Content */}
      {quotesWithStatus && quotesWithStatus.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="Published" className="flex items-center gap-2">
              Published
              <Badge variant="secondary" className="ml-1 bg-green-600/20 text-green-700">
                {quoteCounts.Published}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="Approved" className="flex items-center gap-2">
              Approved
              <Badge variant="secondary" className="ml-1 bg-yellow-600/20 text-yellow-700">
                {quoteCounts.Approved}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="Pending" className="flex items-center gap-2">
              Pending
              <Badge variant="secondary" className="ml-1">
                {quoteCounts.Pending}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="Published" className="mt-6">
            {(() => {
              const publishedQuotes = filterQuotesByStatus('Published');
              return publishedQuotes.length > 0 ? (
                <Masonry
                  breakpointCols={breakpointColumns}
                  className="flex -ml-[14px] w-auto"
                  columnClassName="pl-[14px] bg-clip-padding"
                >
                  {publishedQuotes.map((quote: Quote, index: number) => (
                    <ResearcherQuoteCard
                      key={quote.id}
                      quote={quote}
                      onClick={() => handleQuoteClick(index, publishedQuotes)}
                      reportId={params.id}
                      onStatusChange={(newStatus) => setActiveTab(newStatus)}
                    />
                  ))}
                </Masonry>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <p className="text-gray-400 text-lg">No published quotes found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      No quotes have been published to the client yet.
                    </p>
                  </div>
                </div>
              );
            })()}
          </TabsContent>
          
          <TabsContent value="Approved" className="mt-6">
            {(() => {
              const approvedQuotes = filterQuotesByStatus('Approved');
              return approvedQuotes.length > 0 ? (
                <Masonry
                  breakpointCols={breakpointColumns}
                  className="flex -ml-[14px] w-auto"
                  columnClassName="pl-[14px] bg-clip-padding"
                >
                  {approvedQuotes.map((quote: Quote, index: number) => (
                    <ResearcherQuoteCard
                      key={quote.id}
                      quote={quote}
                      onClick={() => handleQuoteClick(index, approvedQuotes)}
                      reportId={params.id}
                      onStatusChange={(newStatus) => setActiveTab(newStatus)}
                    />
                  ))}
                </Masonry>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <p className="text-gray-400 text-lg">No approved quotes found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      No quotes have been approved for publication yet.
                    </p>
                  </div>
                </div>
              );
            })()}
          </TabsContent>
          
          <TabsContent value="Pending" className="mt-6">
            {(() => {
              const pendingQuotes = filterQuotesByStatus('Pending');
              return pendingQuotes.length > 0 ? (
                <Masonry
                  breakpointCols={breakpointColumns}
                  className="flex -ml-[14px] w-auto"
                  columnClassName="pl-[14px] bg-clip-padding"
                >
                  {pendingQuotes.map((quote: Quote, index: number) => (
                    <ResearcherQuoteCard
                      key={quote.id}
                      quote={quote}
                      onClick={() => handleQuoteClick(index, pendingQuotes)}
                      reportId={params.id}
                      onStatusChange={(newStatus) => setActiveTab(newStatus)}
                    />
                  ))}
                </Masonry>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <p className="text-gray-400 text-lg">No pending quotes found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      No quotes are pending review.
                    </p>
                  </div>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-400 text-lg">No quotes found</p>
            <p className="text-gray-500 text-sm mt-2">
              Start by adding your first quote to this report.
            </p>
          </div>
        </div>
      )}

      {/* Quote Drawer */}
      <QuoteDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        quote={selectedQuote}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={selectedQuoteIndex !== null && selectedQuoteIndex > 0}
        hasNext={selectedQuoteIndex !== null && quotesWithStatus && selectedQuoteIndex < quotesWithStatus.length - 1}
      />

      {/* Add Quote Dialog */}
      <AddQuoteDialog
        reportId={params.id}
        open={isAddQuoteOpen}
        onOpenChange={setIsAddQuoteOpen}
      />
    </main>
  );
}