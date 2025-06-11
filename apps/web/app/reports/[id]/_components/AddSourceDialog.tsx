'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mutate } from 'swr';
import { Loader2, Globe, Video, FileText, Hash } from 'lucide-react';

interface AddSourceDialogProps {
  reportId: string;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface URLMetadata {
  url: string;
  title: string;
  author?: string;
  publishedAt?: string;
  type: 'article' | 'video' | 'social' | 'other';
  description?: string;
  thumbnail?: string;
}

export function AddSourceDialog({ reportId, clientId, open, onOpenChange }: AddSourceDialogProps) {
  const [url, setUrl] = useState('');
  const [metadata, setMetadata] = useState<URLMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch metadata when URL changes
  useEffect(() => {
    if (!url) {
      setMetadata(null);
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      setMetadata(null);
      return;
    }

    // Debounce the metadata fetch
    const timeoutId = setTimeout(async () => {
      setIsLoadingMetadata(true);
      setError('');
      
      try {
        const response = await fetch('/api/metadata-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }

        const data = await response.json();
        setMetadata(data);
      } catch (error) {
        console.error('Error fetching metadata:', error);
        setError('Failed to fetch metadata');
      } finally {
        setIsLoadingMetadata(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/clients/${clientId}/reports/${reportId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create source');
      }

      const { source } = await response.json();
      
      // Update the sources list
      mutate(`/api/clients/${clientId}/reports/${reportId}/sources`);
      
      // Reset form
      setUrl('');
      setMetadata(null);
      
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Source</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
            
            {isLoadingMetadata && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            )}
            
            {metadata && !isLoadingMetadata && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-500">
                    {getTypeIcon(metadata.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">{metadata.title}</h3>
                    {metadata.author && (
                      <p className="text-sm text-gray-600">By {metadata.author}</p>
                    )}
                    {metadata.publishedAt && (
                      <p className="text-sm text-gray-600">
                        {formatDate(metadata.publishedAt)}
                      </p>
                    )}
                    {metadata.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {metadata.description}
                      </p>
                    )}
                  </div>
                  {metadata.thumbnail && (
                    <img
                      src={metadata.thumbnail}
                      alt=""
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                </div>
              </div>
            )}
            
            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !url || isLoadingMetadata}
            >
              {isSubmitting ? 'Adding...' : 'Add Source'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}