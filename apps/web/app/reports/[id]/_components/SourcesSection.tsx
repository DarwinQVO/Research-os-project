'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Globe, Video, FileText, Hash, ExternalLink, MoreHorizontal, Edit, Trash2, Settings } from 'lucide-react';
import { AddSourceDialog } from './AddSourceDialog';
import { EditSourceDialog } from './EditSourceDialog';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Source {
  id: string;
  url: string;
  title: string;
  author?: string;
  publishedAt?: string;
  type: 'article' | 'video' | 'social' | 'other';
  description?: string;
  thumbnail?: string;
  status?: 'pending' | 'approved' | 'published';
  createdAt: string;
}

interface SourcesSectionProps {
  reportId: string;
  clientId: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function SourcesSection({ reportId, clientId }: SourcesSectionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteDialogSource, setDeleteDialogSource] = useState<Source | null>(null);
  const [editDialogSource, setEditDialogSource] = useState<Source | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: sources, error } = useSWR<Source[]>(
    `/api/reports/${reportId}/sources`,
    fetcher
  );

  // Get counts for different statuses
  const pendingSources = sources?.filter(s => (s.status || 'pending') === 'pending') || [];
  const approvedSources = sources?.filter(s => s.status === 'approved') || [];
  const publishedSources = sources?.filter(s => s.status === 'published') || [];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'social':
        return <Hash className="h-4 w-4" />;
      case 'article':
        return <FileText className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return null;
    }
  };

  const handleDeleteSource = async () => {
    if (!deleteDialogSource) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/sources/${deleteDialogSource.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete source');
      }

      // Optimistically remove from cache
      mutate(`/api/reports/${reportId}/sources`, 
        (currentData: Source[] | undefined) => {
          if (!currentData) return currentData;
          return currentData.filter((s: Source) => s.id !== deleteDialogSource.id);
        }, 
        false
      );

    } catch (error) {
      console.error('Error deleting source:', error);
      // Revert optimistic update on error
      mutate(`/api/reports/${reportId}/sources`);
    } finally {
      setIsDeleting(false);
      setDeleteDialogSource(null);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Failed to load sources</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Sources</h2>
          {sources && sources.length > 0 && (
            <div className="flex items-center gap-2">
              {pendingSources.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {pendingSources.length} pending
                </Badge>
              )}
              {publishedSources.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  {publishedSources.length} published
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sources && sources.length > 0 && (
            <Link href={`/reports/${reportId}/sources`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Moderate
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Source
          </Button>
        </div>
      </div>

      {!sources ? (
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-2">No sources added yet</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add First Source
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <div
              key={source.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 text-gray-500">
                  {getTypeIcon(source.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{source.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        {source.author && <span>{source.author}</span>}
                        {source.author && source.publishedAt && <span>•</span>}
                        {source.publishedAt && <span>{formatDate(source.publishedAt)}</span>}
                        {(source.author || source.publishedAt) && <span>•</span>}
                        <Badge 
                          variant={
                            (source.status || 'pending') === 'published' ? 'default' : 
                            source.status === 'approved' ? 'secondary' : 'outline'
                          }
                          className={`text-xs ${
                            (source.status || 'pending') === 'published' ? 'bg-green-100 text-green-700 border-green-200' :
                            source.status === 'approved' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {source.status || 'pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <span className="truncate max-w-[300px]">{source.url}</span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setEditDialogSource(source)}
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteDialogSource(source)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddSourceDialog
        reportId={reportId}
        clientId={clientId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {/* Edit Source Dialog */}
      {editDialogSource && (
        <EditSourceDialog
          reportId={reportId}
          clientId={clientId}
          source={editDialogSource}
          open={!!editDialogSource}
          onOpenChange={(open) => !open && setEditDialogSource(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogSource} onOpenChange={(open) => !open && setDeleteDialogSource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialogSource?.title}"? This action cannot be undone and may affect quotes that reference this source.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSource}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}