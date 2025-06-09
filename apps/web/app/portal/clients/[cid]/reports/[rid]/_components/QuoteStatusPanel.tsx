'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Masonry from 'react-masonry-css';
import { QuoteCard } from './QuoteCard';

interface Quote {
  id: string;
  shortText: string;
  author?: string;
  source?: string;
  sourceUrl?: string;
  tags: string[];
  createdAt: string;
  status: 'Published' | 'Approved' | 'Pending';
}

interface QuoteStatusPanelProps {
  quotes: Quote[];
  onQuoteClick: (index: number) => void;
}

export function QuoteStatusPanel({ quotes, onQuoteClick }: QuoteStatusPanelProps) {
  const quoteCounts = useMemo(() => {
    const counts = {
      Published: 0,
      Approved: 0,
      Pending: 0,
    };
    
    quotes.forEach(quote => {
      counts[quote.status]++;
    });
    
    return counts;
  }, [quotes]);

  const filterQuotesByStatus = (status: 'Published' | 'Approved' | 'Pending') => {
    return quotes.filter(quote => quote.status === status);
  };

  const getQuoteIndex = (quote: Quote, status: 'Published' | 'Approved' | 'Pending') => {
    const filteredQuotes = filterQuotesByStatus(status);
    const indexInFiltered = filteredQuotes.findIndex(q => q.id === quote.id);
    return quotes.findIndex(q => q.id === quote.id);
  };

  const breakpointColumns = {
    default: 3,
    1024: 2,
    480: 1,
  };

  const renderQuoteGrid = (filteredQuotes: Quote[], status: 'Published' | 'Approved' | 'Pending') => {
    if (filteredQuotes.length === 0) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-400 text-lg">No {status.toLowerCase()} quotes found</p>
            <p className="text-gray-500 text-sm mt-2">
              {status === 'Published' && 'No quotes have been published to the client yet.'}
              {status === 'Approved' && 'No quotes have been approved for publication yet.'}
              {status === 'Pending' && 'No quotes are pending review.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex -ml-[14px] w-auto"
        columnClassName="pl-[14px] bg-clip-padding"
      >
        {filteredQuotes.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            onClick={() => onQuoteClick(getQuoteIndex(quote, status))}
          />
        ))}
      </Masonry>
    );
  };

  return (
    <Tabs defaultValue="Published" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="Published" className="flex items-center gap-2">
          Published
          <Badge variant="secondary" className="ml-1">
            {quoteCounts.Published}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="Approved" className="flex items-center gap-2">
          Approved
          <Badge variant="secondary" className="ml-1">
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
        {renderQuoteGrid(filterQuotesByStatus('Published'), 'Published')}
      </TabsContent>
      
      <TabsContent value="Approved" className="mt-6">
        {renderQuoteGrid(filterQuotesByStatus('Approved'), 'Approved')}
      </TabsContent>
      
      <TabsContent value="Pending" className="mt-6">
        {renderQuoteGrid(filterQuotesByStatus('Pending'), 'Pending')}
      </TabsContent>
    </Tabs>
  );
}