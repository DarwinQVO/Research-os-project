'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Clock, Eye, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { mutate } from 'swr';
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
import { EditQuoteDialog } from './EditQuoteDialog';

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
  entityId?: string;
  sourceId?: string;
  speaker?: string;
  sourceTitle?: string;
}

interface ResearcherQuoteCardProps {
  quote: Quote;
  onClick: () => void;
  reportId: string;
  clientId?: string;
  onStatusChange?: (newStatus: 'Published' | 'Approved' | 'Pending') => void;
}

export function ResearcherQuoteCard({ quote, onClick, reportId, clientId, onStatusChange }: ResearcherQuoteCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const getFaviconUrl = (url?: string) => {
    if (!url) return null;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };

  const updateQuoteStatus = async (newStatus: 'Published' | 'Approved' | 'Pending') => {
    if (!clientId) return;
    
    setIsUpdating(true);
    
    try {
      const updateData = {
        isPublic: newStatus === 'Published',
        isApproved: newStatus === 'Approved' || newStatus === 'Published'
      };

      // Call the onStatusChange prop if provided (for optimistic updates)
      if (onStatusChange) {
        onStatusChange(newStatus);
      } else {
        // Fallback: Make the API call directly without optimistic updates
        const response = await fetch(`/api/clients/${clientId}/reports/${reportId}/quotes/${quote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error('Failed to update quote status');
        }
        
        // Revalidate all quote lists
        mutate(`/api/clients/${clientId}/reports/${reportId}/quotes?status=published`);
        mutate(`/api/clients/${clientId}/reports/${reportId}/quotes?status=approved`);
        mutate(`/api/clients/${clientId}/reports/${reportId}/quotes?status=pending`);
      }
      
    } catch (error) {
      console.error('Error updating quote status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-green-600 text-white';
      case 'Approved': return 'bg-yellow-600 text-white';
      case 'Pending': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Published': return <Eye className="h-3 w-3" />;
      case 'Approved': return <Check className="h-3 w-3" />;
      case 'Pending': return <Clock className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const handleDeleteQuote = async () => {
    if (!clientId) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }

      // Revalidate all quote lists
      mutate(`/api/clients/${clientId}/reports/${reportId}/quotes?status=published`);
      mutate(`/api/clients/${clientId}/reports/${reportId}/quotes?status=approved`);
      mutate(`/api/clients/${clientId}/reports/${reportId}/quotes?status=pending`);

    } catch (error) {
      console.error('Error deleting quote:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 break-inside-avoid mb-4 group">
      {/* Status Controls - Quick Action Buttons */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <Button
            onClick={() => updateQuoteStatus('Published')}
            variant={quote.status === 'Published' ? 'default' : 'outline'}
            size="sm"
            className={`h-6 px-2 text-xs ${quote.status === 'Published' ? 'bg-green-600 text-white' : 'border-green-600 text-green-600 hover:bg-green-50'}`}
            disabled={isUpdating}
            title="Publish to client"
          >
            <Eye className="h-3 w-3 mr-1" />
            Pub
          </Button>
          
          <Button
            onClick={() => updateQuoteStatus('Approved')}
            variant={quote.status === 'Approved' ? 'default' : 'outline'}
            size="sm"
            className={`h-6 px-2 text-xs ${quote.status === 'Approved' ? 'bg-yellow-600 text-white' : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50'}`}
            disabled={isUpdating}
            title="Mark as approved"
          >
            <Check className="h-3 w-3 mr-1" />
            App
          </Button>
          
          <Button
            onClick={() => updateQuoteStatus('Pending')}
            variant={quote.status === 'Pending' ? 'default' : 'outline'}
            size="sm"
            className={`h-6 px-2 text-xs ${quote.status === 'Pending' ? 'bg-gray-600 text-white' : 'border-gray-600 text-gray-600 hover:bg-gray-50'}`}
            disabled={isUpdating}
            title="Mark as pending"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pen
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">
            {new Date(quote.createdAt).toLocaleDateString()}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditDialogOpen(true);
                }}
              >
                <Edit className="h-3 w-3 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quote Content */}
      <div 
        onClick={onClick}
        className="cursor-pointer"
      >
        <div className="text-gray-800 text-sm leading-relaxed line-clamp-4 mb-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-0">{children}</p>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                </a>
              ),
            }}
          >
            {quote.shortText}
          </ReactMarkdown>
        </div>
        
        {/* Author and Source */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {quote.author && (
              <div className="truncate">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <span className="text-xs text-gray-500">{children}</span>,
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {quote.author}
                </ReactMarkdown>
              </div>
            )}
            {quote.author && quote.sourceUrl && (
              <span>|</span>
            )}
            {quote.sourceUrl && (
              <div className="flex items-center gap-1">
                {getFaviconUrl(quote.sourceUrl) && (
                  <img
                    src={getFaviconUrl(quote.sourceUrl) || ''}
                    alt=""
                    className="w-4 h-4"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span className="truncate max-w-20">
                  {new URL(quote.sourceUrl).hostname.replace('www.', '')}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Edit Quote Dialog */}
      <EditQuoteDialog
        reportId={reportId}
        clientId={clientId}
        quote={{
          id: quote.id,
          shortText: quote.shortText,
          text: quote.text || quote.shortText,
          entityId: quote.entityId,
          sourceId: quote.sourceId,
          sourceUrl: quote.sourceUrl,
          date: quote.date,
          isPublic: quote.isPublic || false,
          isApproved: quote.isApproved || false,
          speaker: quote.speaker || quote.author,
          sourceTitle: quote.sourceTitle || quote.source,
        }}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteQuote}
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