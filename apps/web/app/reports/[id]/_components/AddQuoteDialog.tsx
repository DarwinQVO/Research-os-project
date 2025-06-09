'use client';

import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { TagsInput } from '@/app/clients/_components/TagsInput';
import { mutate } from 'swr';

interface AddQuoteDialogProps {
  reportId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddQuoteDialog({ reportId, open, onOpenChange }: AddQuoteDialogProps) {
  const [formData, setFormData] = useState({
    text: '',
    shortText: '',
    author: '',
    source: '',
    sourceUrl: '',
    tags: [] as string[],
    isPublic: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleTextChange = (text: string) => {
    setFormData(prev => ({
      ...prev,
      text,
      shortText: prev.shortText || text.slice(0, 120)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.text.length < 10) {
      setError('Quote text must be at least 10 characters');
      return;
    }
    
    if (formData.shortText.length < 5) {
      setError('Short text must be at least 5 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/reports/${reportId}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create quote');
      }

      const { quote } = await response.json();
      
      // Optimistic update
      mutate(`/api/reports/${reportId}/quotes`, (current: any) => {
        if (!current) return [quote];
        return [quote, ...current];
      }, false);
      
      // Reset form
      setFormData({
        text: '',
        shortText: '',
        author: '',
        source: '',
        sourceUrl: '',
        tags: [],
        isPublic: false,
      });
      
      onOpenChange(false);
      
      // Show success (could add toast here)
      console.log('Quote added successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Quote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="text">Quote text *</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Enter the full quote text..."
                className="min-h-[100px]"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="shortText">Short version *</Label>
              <Input
                id="shortText"
                value={formData.shortText}
                onChange={(e) => setFormData(prev => ({ ...prev, shortText: e.target.value }))}
                placeholder="Short version for display..."
                maxLength={300}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Quote author..."
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                placeholder="Source publication or context..."
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sourceUrl">Source URL</Label>
              <Input
                id="sourceUrl"
                type="url"
                value={formData.sourceUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Tags</Label>
              <TagsInput
                value={formData.tags}
                onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                placeholder="Type and press Enter to add tags..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
              <Label htmlFor="isPublic">Publish to Client</Label>
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
              {isSubmitting ? 'Adding...' : 'Add Quote'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}