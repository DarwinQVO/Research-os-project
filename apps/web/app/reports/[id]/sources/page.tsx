'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, CheckCircle, Globe, ArrowLeft, Edit2 } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { useToast } from '@/lib/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import type { SourceMeta, SourceStatus } from '@research-os/db/source';
import { EditSourceDialog } from '../_components/EditSourceDialog';

const fetcher = async (url: string) => {
  console.log('Fetching URL:', url);
  const res = await fetch(url);
  console.log('Response status:', res.status);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Fetch error:', res.status, errorText);
    throw new Error(`Failed to fetch ${url}: ${res.status} ${errorText}`);
  }
  
  const data = await res.json();
  console.log('Response data:', data);
  return data;
};

interface SourceModerationCardProps {
  source: SourceMeta;
  onStatusChange: (sourceId: string, newStatus: SourceStatus) => void;
  currentTab: SourceStatus;
  onEdit: (source: SourceMeta) => void;
}

function SourceModerationCard({ source, onStatusChange, currentTab, onEdit }: SourceModerationCardProps) {
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return '';
    }
  };

  const renderActions = () => {
    switch (currentTab) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(source.id, 'approved')}
              className="text-green-600 hover:text-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(source.id, 'published')}
              className="text-blue-600 hover:text-blue-700"
            >
              <Globe className="h-4 w-4 mr-1" />
              Publish
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        );
      case 'approved':
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(source.id, 'published')}
              className="text-blue-600 hover:text-blue-700"
            >
              <Globe className="h-4 w-4 mr-1" />
              Publish
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(source.id, 'pending')}
              className="text-gray-600 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Pending
            </Button>
          </div>
        );
      case 'published':
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange(source.id, 'approved')}
            className="text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Unpublish
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-[320px] bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        {getFaviconUrl(source.url) && (
          <img
            src={getFaviconUrl(source.url)}
            alt=""
            className="w-4 h-4 mt-1 flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">
            {source.title}
          </h3>
          {source.author && (
            <p className="text-sm text-gray-600 mt-1">{source.author}</p>
          )}
          {source.publishedAt && (
            <p className="text-xs text-gray-500 mt-1">{source.publishedAt}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Badge variant="secondary" className="text-xs">
          {source.type}
        </Badge>
        {source.quoteCount && source.quoteCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {source.quoteCount} quotes
          </Badge>
        )}
      </div>

      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(source)}
            className="text-gray-600 hover:text-gray-700 text-xs"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
        {renderActions()}
      </div>
    </div>
  );
}

interface SourceMasonryGridProps {
  sources: SourceMeta[];
  onStatusChange: (sourceId: string, newStatus: SourceStatus) => void;
  currentTab: SourceStatus;
  onEdit: (source: SourceMeta) => void;
}

function SourceMasonryGrid({ sources, onStatusChange, currentTab, onEdit }: SourceMasonryGridProps) {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
      {sources.map((source) => (
        <div key={source.id} className="break-inside-avoid">
          <SourceModerationCard
            source={source}
            onStatusChange={onStatusChange}
            currentTab={currentTab}
            onEdit={onEdit}
          />
        </div>
      ))}
    </div>
  );
}

export default function SourceModerationPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<SourceStatus>('pending');
  const [editingSource, setEditingSource] = useState<SourceMeta | null>(null);
  const { toast } = useToast();

  // Fetch report data using SWR
  const { data: report, error: reportError, isLoading: reportLoading } = useSWR(
    `/api/reports/${params.id}`,
    fetcher,
    {
      onError: (error) => {
        console.error('SWR Error fetching report:', error);
      },
      onSuccess: (data) => {
        console.log('SWR Success fetching report:', data);
      }
    }
  );

  // SWR keys for different status tabs
  const pendingKey = `/api/reports/${params.id}/sources?status=pending`;
  const approvedKey = `/api/reports/${params.id}/sources?status=approved`;
  const publishedKey = `/api/reports/${params.id}/sources?status=published`;

  const { data: pendingSources = [], error: pendingError, isLoading: pendingLoading } = useSWR(
    report ? pendingKey : null, 
    fetcher,
    { 
      onError: (error) => console.error('Pending sources error:', error),
      onSuccess: (data) => console.log('Pending sources loaded:', data.length, 'items')
    }
  );
  const { data: approvedSources = [], error: approvedError, isLoading: approvedLoading } = useSWR(
    report ? approvedKey : null, 
    fetcher,
    { 
      onError: (error) => console.error('Approved sources error:', error),
      onSuccess: (data) => console.log('Approved sources loaded:', data.length, 'items')
    }
  );
  const { data: publishedSources = [], error: publishedError, isLoading: publishedLoading } = useSWR(
    report ? publishedKey : null, 
    fetcher,
    { 
      onError: (error) => console.error('Published sources error:', error),
      onSuccess: (data) => console.log('Published sources loaded:', data.length, 'items')
    }
  );

  const handleStatusChange = async (sourceId: string, newStatus: SourceStatus) => {
    try {
      // Find the source in current list
      const currentSources = activeTab === 'pending' ? pendingSources : 
                            activeTab === 'approved' ? approvedSources : publishedSources;
      const source = currentSources.find((s: SourceMeta) => s.id === sourceId);
      
      if (!source) return;

      // Determine current and target keys
      const currentKey = activeTab === 'pending' ? pendingKey : 
                        activeTab === 'approved' ? approvedKey : publishedKey;
      const targetKey = newStatus === 'pending' ? pendingKey : 
                       newStatus === 'approved' ? approvedKey : publishedKey;

      // Optimistic updates
      // Remove from current list
      mutate(currentKey, currentSources.filter((s: SourceMeta) => s.id !== sourceId), false);
      
      // Add to target list if different
      if (currentKey !== targetKey) {
        const targetSources = newStatus === 'pending' ? pendingSources : 
                             newStatus === 'approved' ? approvedSources : publishedSources;
        const updatedSource = { ...source, status: newStatus };
        mutate(targetKey, [updatedSource, ...targetSources], false);
      }

      // API call
      console.log('Updating source status:', { sourceId, newStatus });
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed:', response.status, errorText);
        throw new Error(`Failed to update source status: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Update successful:', result);

      // Revalidate all lists
      mutate(pendingKey);
      mutate(approvedKey);
      mutate(publishedKey);

      toast({
        title: 'Success',
        description: `Source moved to ${newStatus}`,
      });

    } catch (error) {
      console.error('Error updating source status:', error);
      
      // Revert optimistic updates on error
      mutate(pendingKey);
      mutate(approvedKey);
      mutate(publishedKey);

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update source status',
        variant: 'destructive',
      });
    }
  };

  const handleEditSource = (source: SourceMeta) => {
    setEditingSource(source);
  };

  const handleEditComplete = () => {
    setEditingSource(null);
    // Revalidate all source lists after edit
    mutate(pendingKey);
    mutate(approvedKey);
    mutate(publishedKey);
    
    toast({
      title: 'Success',
      description: 'Source updated successfully',
    });
  };

  const isLoading = activeTab === 'pending' ? pendingLoading : 
                   activeTab === 'approved' ? approvedLoading : publishedLoading;
  const error = activeTab === 'pending' ? pendingError : 
               activeTab === 'approved' ? approvedError : publishedError;
  const currentSources = activeTab === 'pending' ? pendingSources : 
                        activeTab === 'approved' ? approvedSources : publishedSources;

  if (reportLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
          <p className="text-sm text-gray-500 mt-2">Report ID: {params.id}</p>
          <p className="text-sm text-gray-500">URL: /api/reports/{params.id}</p>
        </div>
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Error Loading Report</h1>
          <p className="text-gray-600 mb-2">Report ID: {params.id}</p>
          <p className="text-gray-600 mb-4">Error: {reportError.message}</p>
          <div className="space-x-2">
            <Link href={`/reports/${params.id}`}>
              <Button variant="outline">Back to Report</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h1>
          <p className="text-gray-600 mb-4">The report you're looking for doesn't exist.</p>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/reports/${params.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Report
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Source Moderation</h1>
              <p className="text-gray-600">Report: {report.title}</p>
            </div>
          </div>
          
          <Link href={`/reports/${params.id}/quotes`}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              📚 View Quotes
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SourceStatus)}>
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingSources.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {pendingSources.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="relative">
              Approved
              {approvedSources.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {approvedSources.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published" className="relative">
              Published
              {publishedSources.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {publishedSources.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="text-center py-8">Loading pending sources...</div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 font-medium mb-2">Error loading sources</div>
                <div className="text-sm text-gray-600">
                  {error.message || 'Unknown error occurred'}
                </div>
                <button 
                  onClick={() => {
                    mutate(pendingKey);
                    mutate(approvedKey);
                    mutate(publishedKey);
                  }}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : currentSources.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No pending sources</p>
              </div>
            ) : (
              <SourceMasonryGrid
                sources={currentSources}
                onStatusChange={handleStatusChange}
                currentTab={activeTab}
                onEdit={handleEditSource}
              />
            )}
          </TabsContent>

          <TabsContent value="approved">
            {isLoading ? (
              <div className="text-center py-8">Loading approved sources...</div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 font-medium mb-2">Error loading sources</div>
                <div className="text-sm text-gray-600">
                  {error.message || 'Unknown error occurred'}
                </div>
                <button 
                  onClick={() => {
                    mutate(pendingKey);
                    mutate(approvedKey);
                    mutate(publishedKey);
                  }}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : currentSources.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No approved sources</p>
              </div>
            ) : (
              <SourceMasonryGrid
                sources={currentSources}
                onStatusChange={handleStatusChange}
                currentTab={activeTab}
                onEdit={handleEditSource}
              />
            )}
          </TabsContent>

          <TabsContent value="published">
            {isLoading ? (
              <div className="text-center py-8">Loading published sources...</div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 font-medium mb-2">Error loading sources</div>
                <div className="text-sm text-gray-600">
                  {error.message || 'Unknown error occurred'}
                </div>
                <button 
                  onClick={() => {
                    mutate(pendingKey);
                    mutate(approvedKey);
                    mutate(publishedKey);
                  }}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : currentSources.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No published sources</p>
              </div>
            ) : (
              <SourceMasonryGrid
                sources={currentSources}
                onStatusChange={handleStatusChange}
                currentTab={activeTab}
                onEdit={handleEditSource}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
      
      {/* Edit Source Dialog */}
      {editingSource && report && (
        <EditSourceDialog
          reportId={params.id}
          clientId={report.clientId}
          source={editingSource}
          open={!!editingSource}
          onOpenChange={(open) => {
            if (!open) {
              handleEditComplete();
            }
          }}
        />
      )}
    </div>
  );
}