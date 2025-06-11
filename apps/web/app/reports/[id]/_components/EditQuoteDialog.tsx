'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { SimpleMarkdownTextarea } from './SimpleMarkdownTextarea';
import { Switch } from '@/components/ui/switch';
import { mutate } from 'swr';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useSWR from 'swr';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Video, FileText, Hash, User, Building, HelpCircle } from 'lucide-react';
import { EntityCombobox } from './EntityCombobox';

interface EditQuoteDialogProps {
  reportId: string;
  clientId?: string;
  quote: {
    id: string;
    shortText: string;
    text: string;
    entityId?: string;
    sourceId?: string;
    sourceUrl?: string;
    date?: string;
    isPublic: boolean;
    isApproved: boolean;
    speaker?: string;
    sourceTitle?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Source {
  id: string;
  url: string;
  title: string;
  author?: string;
  publishedAt?: string;
  type: 'article' | 'video' | 'social' | 'other';
}

interface Entity {
  id: string;
  name: string;
  type: 'person' | 'company' | 'industry' | 'other';
  primaryUrl?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Format date to MMM d, yyyy format
const formatDateToDisplay = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  } catch (error) {
    return '';
  }
};

export function EditQuoteDialog({ reportId, clientId, quote, open, onOpenChange }: EditQuoteDialogProps) {
  const [formData, setFormData] = useState({
    text: quote.text || quote.shortText,
    entityId: quote.entityId || '',
    sourceId: quote.sourceId || '',
    sourceUrl: quote.sourceUrl || '',
    date: quote.date || '',
    isPublic: quote.isPublic,
    isApproved: quote.isApproved,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Update form when quote changes
  useEffect(() => {
    setFormData({
      text: quote.text || quote.shortText,
      entityId: quote.entityId || '',
      sourceId: quote.sourceId || '',
      sourceUrl: quote.sourceUrl || '',
      date: quote.date || '',
      isPublic: quote.isPublic,
      isApproved: quote.isApproved,
    });
  }, [quote]);
  
  // Fetch available sources - try clientId path first, fallback to reportId path
  const { data: sources } = useSWR<Source[]>(
    clientId 
      ? `/api/clients/${clientId}/reports/${reportId}/sources` 
      : `/api/reports/${reportId}/sources`,
    fetcher
  );

  // Fetch available entities - try clientId path first, fallback to reportId path
  const { data: entities } = useSWR<Entity[]>(
    clientId 
      ? `/api/clients/${clientId}/reports/${reportId}/entities` 
      : `/api/reports/${reportId}/entities`,
    fetcher
  );

  const handleTextChange = (text: string) => {
    setFormData(prev => ({
      ...prev,
      text
    }));
  };

  const handleSourceChange = (sourceId: string) => {
    if (!sourceId || sourceId === 'no-sources') {
      setFormData(prev => ({
        ...prev,
        sourceId: '',
        sourceUrl: ''
      }));
      return;
    }
    
    const selectedSource = sources?.find(s => s.id === sourceId);
    if (selectedSource) {
      const formattedDate = selectedSource.publishedAt ? formatDateToDisplay(selectedSource.publishedAt) : '';
      
      setFormData(prev => ({
        ...prev,
        sourceId: sourceId,
        sourceUrl: selectedSource.url,
        date: formattedDate || prev.date // Only update if we have a valid formatted date
      }));
    }
  };

  const handleEntityCreate = async (entityData: { name: string; type: string }) => {
    try {
      const endpoint = clientId 
        ? `/api/clients/${clientId}/reports/${reportId}/entities`
        : `/api/reports/${reportId}/entities`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: entityData.name,
          type: entityData.type,
          confidence: 0.9 // Default confidence for manually created entities
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create entity');
      }

      const newEntity = await response.json();
      
      // Update the entities list in SWR cache
      const entityEndpoint = clientId 
        ? `/api/clients/${clientId}/reports/${reportId}/entities`
        : `/api/reports/${reportId}/entities`;
      
      mutate(
        entityEndpoint,
        (current: Entity[] | undefined) => current ? [...current, newEntity] : [newEntity],
        false
      );
      
      // Auto-select the newly created entity
      setFormData(prev => ({ ...prev, entityId: newEntity.id }));
      
      // Revalidate to ensure fresh data
      mutate(entityEndpoint);
      
    } catch (error) {
      console.error('Error creating entity:', error);
      setError('Failed to create new speaker. Please try again.');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-3 w-3" />;
      case 'social':
        return <Hash className="h-3 w-3" />;
      case 'article':
        return <FileText className="h-3 w-3" />;
      default:
        return <Globe className="h-3 w-3" />;
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'person':
        return <User className="h-3 w-3" />;
      case 'company':
        return <Building className="h-3 w-3" />;
      case 'industry':
        return <Building className="h-3 w-3" />;
      default:
        return <HelpCircle className="h-3 w-3" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.text.length < 10) {
      setError('Quote text must be at least 10 characters');
      return;
    }
    
    if (!formData.entityId || formData.entityId === 'no-entities') {
      setError('Please select a speaker');
      return;
    }
    
    if (!formData.sourceId || formData.sourceId === 'no-sources') {
      setError('Please select a source');
      return;
    }
    
    if (!formData.sourceUrl) {
      setError('Please provide a source URL');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortText: formData.text, // Use full text as shortText
          text: formData.text,
          entityId: formData.entityId,
          sourceId: formData.sourceId,
          sourceUrl: formData.sourceUrl,
          date: formData.date,
          isPublic: formData.isPublic,
          isApproved: formData.isApproved,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quote');
      }

      const { quote: updatedQuote } = await response.json();
      
      // Optimistic update
      mutate(`/api/reports/${reportId}/quotes`, (current: any) => {
        if (!current) return current;
        return current.map((q: any) => q.id === quote.id ? updatedQuote : q);
      }, false);
      
      onOpenChange(false);
      
      // Show success (could add toast here)
      console.log('Quote updated successfully');
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
          <DialogTitle>Edit Quote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="text">Quote text *</Label>
              <SimpleMarkdownTextarea
                value={formData.text}
                onChange={handleTextChange}
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
              <Label htmlFor="entityId">Speaker *</Label>
              <EntityCombobox
                entities={entities || []}
                selectedEntity={formData.entityId}
                onEntityChange={(entityId) => setFormData(prev => ({ ...prev, entityId }))}
                onEntityCreate={handleEntityCreate}
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sourceId">Source *</Label>
              <Select
                value={formData.sourceId}
                onValueChange={handleSourceChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  {sources && sources.length > 0 ? (
                    sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(source.type)}
                          <span className="truncate">{source.title}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-sources" disabled>
                      No sources found for this report
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {formData.sourceId && formData.sourceId !== 'no-sources' && sources && (
                <div className="text-xs text-gray-600 mt-1">
                  {(() => {
                    const selectedSource = sources.find(s => s.id === formData.sourceId);
                    if (selectedSource) {
                      return (
                        <div>
                          <span className="font-medium">Title:</span> {selectedSource.title}
                          {selectedSource.author && (
                            <span className="ml-3"><span className="font-medium">Author:</span> {selectedSource.author}</span>
                          )}
                          {selectedSource.publishedAt && (
                            <span className="ml-3"><span className="font-medium">Date:</span> {formatDateToDisplay(selectedSource.publishedAt)}</span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sourceUrl">Source URL *</Label>
              <Input
                id="sourceUrl"
                type="url"
                value={formData.sourceUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, sourceUrl: e.target.value }))}
                placeholder="https://example.com/timestamp#t=1m30s"
                required
              />
              <p className="text-xs text-gray-500">
                Timestamped link to the exact moment (e.g., YouTube #t=1m30s)
              </p>
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
              {isSubmitting ? 'Updating...' : 'Update Quote'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}