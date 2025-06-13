'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
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
  
  // Use separate SWR keys for each status
  const publishedKey = report ? `/api/clients/${report.clientId}/reports/${params.id}/quotes?status=published` : null;
  const approvedKey = report ? `/api/clients/${report.clientId}/reports/${params.id}/quotes?status=approved` : null;
  const pendingKey = report ? `/api/clients/${report.clientId}/reports/${params.id}/quotes?status=pending` : null;
  
  const { data: publishedQuotes = [], error: publishedError, isLoading: publishedLoading } = useSWR(publishedKey, fetcher);
  const { data: approvedQuotes = [], error: approvedError, isLoading: approvedLoading } = useSWR(approvedKey, fetcher);
  const { data: pendingQuotes = [], error: pendingError, isLoading: pendingLoading } = useSWR(pendingKey, fetcher);
  
  const isLoading = publishedLoading || approvedLoading || pendingLoading;
  const error = publishedError || approvedError || pendingError;
  
  // Combine all quotes for the drawer navigation
  const allQuotes = useMemo(() => {
    return [...publishedQuotes, ...approvedQuotes, ...pendingQuotes];
  }, [publishedQuotes, approvedQuotes, pendingQuotes]);

  const quoteCounts = {
    Published: publishedQuotes.length,
    Approved: approvedQuotes.length,
    Pending: pendingQuotes.length,
  };

  const breakpointColumns = {
    default: 3,
    1024: 2,
    480: 1,
  };

  const handleQuoteClick = (index: number, status: 'Published' | 'Approved' | 'Pending') => {
    // Find the actual index in all quotes array
    let actualIndex = 0;
    if (status === 'Published') {
      actualIndex = index;
    } else if (status === 'Approved') {
      actualIndex = publishedQuotes.length + index;
    } else {
      actualIndex = publishedQuotes.length + approvedQuotes.length + index;
    }
    setSelectedQuoteIndex(actualIndex);
    setIsDrawerOpen(true);
  };

  const handlePrevious = () => {
    if (selectedQuoteIndex !== null && selectedQuoteIndex > 0) {
      setSelectedQuoteIndex(selectedQuoteIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedQuoteIndex !== null && selectedQuoteIndex < allQuotes.length - 1) {
      setSelectedQuoteIndex(selectedQuoteIndex + 1);
    }
  };

  const selectedQuote = selectedQuoteIndex !== null ? allQuotes[selectedQuoteIndex] : null;

  // Function to handle status change with optimistic updates
  const handleStatusChange = async (
    quoteId: string, 
    currentStatus: 'Published' | 'Approved' | 'Pending',
    newStatus: 'Published' | 'Approved' | 'Pending'
  ) => {
    if (!report) return;
    
    // Determine which lists to update
    const currentKey = currentStatus === 'Published' ? publishedKey : 
                      currentStatus === 'Approved' ? approvedKey : pendingKey;
    const targetKey = newStatus === 'Published' ? publishedKey : 
                     newStatus === 'Approved' ? approvedKey : pendingKey;
    
    // Find the quote in current list
    const currentList = currentStatus === 'Published' ? publishedQuotes : 
                       currentStatus === 'Approved' ? approvedQuotes : pendingQuotes;
    const quote = currentList.find((q: Quote) => q.id === quoteId);
    
    if (!quote || !currentKey || !targetKey) return;
    
    // Optimistic update: remove from current list
    mutate(currentKey, currentList.filter((q: Quote) => q.id !== quoteId), false);
    
    // Optimistic update: add to target list
    const targetList = newStatus === 'Published' ? publishedQuotes : 
                      newStatus === 'Approved' ? approvedQuotes : pendingQuotes;
    const updatedQuote = {
      ...quote,
      status: newStatus,
      isPublic: newStatus === 'Published',
      isApproved: newStatus === 'Approved' || newStatus === 'Published'
    };
    mutate(targetKey, [updatedQuote, ...targetList], false);
    
    try {
      // Make the API call
      const response = await fetch(`/api/clients/${report.clientId}/reports/${params.id}/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: newStatus === 'Published',
          isApproved: newStatus === 'Approved' || newStatus === 'Published'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quote status');
      }
      
      // Revalidate all lists after successful update
      mutate(publishedKey);
      mutate(approvedKey);
      mutate(pendingKey);
      
    } catch (error) {
      console.error('Error updating quote status:', error);
      // Revert optimistic updates on error
      mutate(currentKey);
      mutate(targetKey);
    }
  };

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
        
        <div className="flex items-center gap-2">
          <Link href={`/reports/${params.id}/sources`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              📄 Moderate Sources
            </Button>
          </Link>
          <Button 
            onClick={() => setIsAddQuoteOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Quote
          </Button>
        </div>
      </div>

      {/* Content */}
      {allQuotes.length > 0 ? (
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
            {publishedQuotes.length > 0 ? (
              <Masonry
                breakpointCols={breakpointColumns}
                className="flex -ml-[14px] w-auto"
                columnClassName="pl-[14px] bg-clip-padding"
              >
                {publishedQuotes.map((quote: Quote, index: number) => (
                  <ResearcherQuoteCard
                    key={quote.id}
                    quote={{ ...quote, status: 'Published' }}
                    onClick={() => handleQuoteClick(index, 'Published')}
                    reportId={params.id}
                    clientId={report?.clientId}
                    onStatusChange={(newStatus) => handleStatusChange(quote.id, 'Published', newStatus)}
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
            )}
          </TabsContent>
          
          <TabsContent value="Approved" className="mt-6">
            {approvedQuotes.length > 0 ? (
              <Masonry
                breakpointCols={breakpointColumns}
                className="flex -ml-[14px] w-auto"
                columnClassName="pl-[14px] bg-clip-padding"
              >
                {approvedQuotes.map((quote: Quote, index: number) => (
                  <ResearcherQuoteCard
                    key={quote.id}
                    quote={{ ...quote, status: 'Approved' }}
                    onClick={() => handleQuoteClick(index, 'Approved')}
                    reportId={params.id}
                    clientId={report?.clientId}
                    onStatusChange={(newStatus) => handleStatusChange(quote.id, 'Approved', newStatus)}
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
            )}
          </TabsContent>
          
          <TabsContent value="Pending" className="mt-6">
            {pendingQuotes.length > 0 ? (
              <Masonry
                breakpointCols={breakpointColumns}
                className="flex -ml-[14px] w-auto"
                columnClassName="pl-[14px] bg-clip-padding"
              >
                {pendingQuotes.map((quote: Quote, index: number) => (
                  <ResearcherQuoteCard
                    key={quote.id}
                    quote={{ ...quote, status: 'Pending' }}
                    onClick={() => handleQuoteClick(index, 'Pending')}
                    reportId={params.id}
                    clientId={report?.clientId}
                    onStatusChange={(newStatus) => handleStatusChange(quote.id, 'Pending', newStatus)}
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
            )}
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
        hasNext={selectedQuoteIndex !== null && selectedQuoteIndex < allQuotes.length - 1}
      />

      {/* Add Quote Dialog */}
      <AddQuoteDialog
        reportId={params.id}
        clientId={report?.clientId}
        open={isAddQuoteOpen}
        onOpenChange={setIsAddQuoteOpen}
      />
    </main>
  );
}