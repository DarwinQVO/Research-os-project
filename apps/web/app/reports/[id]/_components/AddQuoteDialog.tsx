'use client';

import { useState, useCallback } from 'react';
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
import { SimpleMarkdownTextarea } from './SimpleMarkdownTextarea';
import { Switch } from '@/components/ui/switch';
import { mutate } from 'swr';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AddQuoteDialogProps {
  reportId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddQuoteDialog({ reportId, open, onOpenChange }: AddQuoteDialogProps) {
  const [formData, setFormData] = useState({
    text: '',
    author: '',
    source: '',
    sourceUrl: '',
    date: '',
    isPublic: false,
    isApproved: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const extractFirstUrl = useCallback((text: string) => {
    // First try to find markdown links: [text](url)
    // This regex handles URLs with encoded parentheses
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+(?:%28[^%29]*%29)?[^\s\)]*)\)/;
    const markdownMatch = text.match(markdownLinkRegex);
    
    if (markdownMatch) {
      try {
        let url = markdownMatch[2];
        // Decode the URL for display/use
        url = url.replace(/%28/g, '(').replace(/%29/g, ')');
        return {
          url: url,
          domain: new URL(url).hostname
        };
      } catch (e) {
        console.error('Invalid URL in markdown link:', e);
      }
    }
    
    // If no markdown link, look for plain URLs
    const plainUrlRegex = /https?:\/\/[^\s]+/;
    const plainMatch = text.match(plainUrlRegex);
    
    if (plainMatch) {
      try {
        return {
          url: plainMatch[0],
          domain: new URL(plainMatch[0]).hostname
        };
      } catch (e) {
        console.error('Invalid plain URL:', e);
      }
    }
    
    return null;
  }, []);

  const handleTextChange = (text: string) => {
    setFormData(prev => ({
      ...prev,
      text
    }));
  };

  const handleTextBlur = () => {
    // No longer extract URLs from quote text
    // Source URL only comes from author field
  };

  const handleAuthorBlur = () => {
    console.log('handleAuthorBlur called with author:', formData.author);
    if (!formData.sourceUrl && formData.author) {
      const extracted = extractFirstUrl(formData.author);
      console.log('Extracted URL data from author:', extracted);
      if (extracted) {
        setFormData(prev => ({
          ...prev,
          sourceUrl: extracted.url,
          source: prev.source || extracted.domain
        }));
      }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.text.length < 10) {
      setError('Quote text must be at least 10 characters');
      return;
    }
    

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/reports/${reportId}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          shortText: formData.text.slice(0, 300) // Auto-generate shortText from text
        }),
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
        author: '',
        source: '',
        sourceUrl: '',
        date: '',
        isPublic: false,
        isApproved: false,
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
              <SimpleMarkdownTextarea
                value={formData.text}
                onChange={handleTextChange}
                onBlur={handleTextBlur}
                placeholder="Enter the full quote text... (e.g. [text](url))"
                minHeight="min-h-[100px]"
                required
              />
              {formData.text && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">Preview:</p>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="text-sm">{children}</p>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {formData.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            
            
            <div className="grid gap-2">
              <Label htmlFor="author">Author</Label>
              <SimpleMarkdownTextarea
                value={formData.author}
                onChange={(author) => setFormData(prev => ({ ...prev, author }))}
                onBlur={handleAuthorBlur}
                placeholder="Quote author... (e.g. [name](profile-url))"
                minHeight="min-h-[60px]"
              />
              {formData.author && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">Preview:</p>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="font-medium text-lg">{children}</p>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {formData.author}
                  </ReactMarkdown>
                </div>
              )}
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
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                placeholder="May 2025 • 05/2025 • etc"
                maxLength={20}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isApproved"
                  checked={formData.isApproved}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isApproved: checked }))}
                />
                <Label htmlFor="isApproved">Mark as Approved</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                />
                <Label htmlFor="isPublic">Publish to Client</Label>
              </div>
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