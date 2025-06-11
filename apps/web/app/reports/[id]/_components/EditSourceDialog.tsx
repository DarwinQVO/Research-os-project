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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mutate } from 'swr';
import { Globe, Video, FileText, Hash } from 'lucide-react';

interface EditSourceDialogProps {
  reportId: string;
  clientId?: string;
  source: {
    id: string;
    url: string;
    title: string;
    author?: string;
    publishedAt?: string;
    type: 'article' | 'video' | 'social' | 'other';
    description?: string;
    thumbnail?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSourceDialog({ reportId, clientId, source, open, onOpenChange }: EditSourceDialogProps) {
  const [formData, setFormData] = useState({
    url: source.url,
    title: source.title,
    author: source.author || '',
    publishedAt: source.publishedAt || '',
    type: source.type,
    description: source.description || '',
    thumbnail: source.thumbnail || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update form when source changes
  useEffect(() => {
    setFormData({
      url: source.url,
      title: source.title,
      author: source.author || '',
      publishedAt: source.publishedAt || '',
      type: source.type,
      description: source.description || '',
      thumbnail: source.thumbnail || '',
    });
  }, [source]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.url) {
      setError('URL is required');
      return;
    }
    
    if (!formData.title) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formData.url,
          title: formData.title,
          author: formData.author || undefined,
          publishedAt: formData.publishedAt || undefined,
          type: formData.type,
          description: formData.description || undefined,
          thumbnail: formData.thumbnail || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update source');
      }

      const { source: updatedSource } = await response.json();
      
      // Optimistic update for sources list
      const sourcesEndpoint = clientId 
        ? `/api/clients/${clientId}/reports/${reportId}/sources`
        : `/api/reports/${reportId}/sources`;
      
      mutate(sourcesEndpoint, (current: any) => {
        if (!current) return current;
        return current.map((s: any) => s.id === source.id ? updatedSource : s);
      }, false);
      
      onOpenChange(false);
      
      console.log('Source updated successfully');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Source</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Source title"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Author name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'article' | 'video' | 'social' | 'other') => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Article
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </div>
                  </SelectItem>
                  <SelectItem value="social">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Social Media
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Other
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="publishedAt">Published Date</Label>
              <Input
                id="publishedAt"
                type="date"
                value={formData.publishedAt ? formData.publishedAt.split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  publishedAt: e.target.value ? new Date(e.target.value).toISOString() : ''
                }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the source"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Source'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}