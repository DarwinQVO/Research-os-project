'use client';

import { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, Globe, Clock } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { useToast } from '@/lib/use-toast';
import type { SourceMeta, SourceStatus } from '@research-os/db/source';

interface ModerationSheetProps {
  reportId: string;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ModerationSheet({ 
  reportId, 
  clientId, 
  open, 
  onOpenChange 
}: ModerationSheetProps) {
  const [activeTab, setActiveTab] = useState('sources');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch sources data
  const { data: sources = [] } = useSWR<SourceMeta[]>(
    open ? `/api/reports/${reportId}/sources` : null,
    fetcher
  );

  // Fetch quotes data
  const { data: quotes = [] } = useSWR(
    open ? `/api/clients/${clientId}/reports/${reportId}/quotes` : null,
    fetcher
  );

  // Get counts by status
  const sourceCounts = {
    pending: sources.filter(s => (s.status || 'pending') === 'pending').length,
    approved: sources.filter(s => s.status === 'approved').length,
    published: sources.filter(s => s.status === 'published').length,
  };

  const quoteCounts = {
    pending: quotes.filter((q: any) => !q.isApproved && !q.isPublic).length,
    approved: quotes.filter((q: any) => q.isApproved && !q.isPublic).length,
    published: quotes.filter((q: any) => q.isPublic).length,
  };

  const handleSourceStatusChange = async (sourceIds: string[], newStatus: SourceStatus) => {
    try {
      await Promise.all(
        sourceIds.map(sourceId =>
          fetch(`/api/sources/${sourceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          })
        )
      );

      // Revalidate sources data
      mutate(`/api/reports/${reportId}/sources`);
      setSelectedSources([]);

      toast({
        title: 'Success',
        description: `Updated ${sourceIds.length} source(s) to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update sources',
        variant: 'destructive',
      });
    }
  };

  const handleQuoteStatusChange = async (quoteIds: string[], isPublic: boolean, isApproved: boolean) => {
    try {
      await Promise.all(
        quoteIds.map(quoteId =>
          fetch(`/api/clients/${clientId}/reports/${reportId}/quotes/${quoteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPublic, isApproved })
          })
        )
      );

      // Revalidate quotes data
      mutate(`/api/clients/${clientId}/reports/${reportId}/quotes`);
      setSelectedQuotes([]);

      const status = isPublic ? 'published' : isApproved ? 'approved' : 'pending';
      toast({
        title: 'Success',
        description: `Updated ${quoteIds.length} quote(s) to ${status}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quotes',
        variant: 'destructive',
      });
    }
  };

  const getStatusChip = (status: string) => {
    const variants = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
      approved: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: CheckCircle },
      published: { bg: 'bg-green-100', text: 'text-green-700', icon: Globe }
    };
    
    const variant = variants[status as keyof typeof variants] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge variant="outline" className={`text-xs ${variant.bg} ${variant.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>Moderation Panel</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sources" className="flex items-center gap-2">
                Sources
                <Badge variant="secondary" className="text-xs">
                  {sources.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="quotes" className="flex items-center gap-2">
                Quotes
                <Badge variant="secondary" className="text-xs">
                  {quotes.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sources" className="space-y-4 mt-4">
              <div className="flex flex-wrap gap-2">
                <div className="text-xs text-gray-600">
                  {sourceCounts.pending} pending • {sourceCounts.approved} approved • {sourceCounts.published} published
                </div>
              </div>

              {selectedSources.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{selectedSources.length} selected:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSourceStatusChange(selectedSources, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleSourceStatusChange(selectedSources, 'published')}
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSourceStatusChange(selectedSources, 'pending')}
                  >
                    Reset
                  </Button>
                </div>
              )}

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sources.map((source) => (
                  <div key={source.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedSources.includes(source.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSources([...selectedSources, source.id]);
                        } else {
                          setSelectedSources(selectedSources.filter(id => id !== source.id));
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{source.title}</p>
                      <p className="text-xs text-gray-500 truncate">{source.url}</p>
                    </div>
                    {getStatusChip(source.status || 'pending')}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="quotes" className="space-y-4 mt-4">
              <div className="flex flex-wrap gap-2">
                <div className="text-xs text-gray-600">
                  {quoteCounts.pending} pending • {quoteCounts.approved} approved • {quoteCounts.published} published
                </div>
              </div>

              {selectedQuotes.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{selectedQuotes.length} selected:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuoteStatusChange(selectedQuotes, false, true)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleQuoteStatusChange(selectedQuotes, true, true)}
                  >
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleQuoteStatusChange(selectedQuotes, false, false)}
                  >
                    Reset
                  </Button>
                </div>
              )}

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {quotes.map((quote: any) => {
                  const status = quote.isPublic ? 'published' : quote.isApproved ? 'approved' : 'pending';
                  
                  return (
                    <div key={quote.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedQuotes.includes(quote.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedQuotes([...selectedQuotes, quote.id]);
                          } else {
                            setSelectedQuotes(selectedQuotes.filter(id => id !== quote.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{quote.shortText}</p>
                        {quote.author && (
                          <p className="text-xs text-gray-500 mt-1">— {quote.author}</p>
                        )}
                      </div>
                      {getStatusChip(status)}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}