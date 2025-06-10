'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Clock, Eye } from 'lucide-react';
import { mutate } from 'swr';

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
}

interface ResearcherQuoteCardProps {
  quote: Quote;
  onClick: () => void;
  reportId: string;
  onStatusChange?: (newStatus: 'Published' | 'Approved' | 'Pending') => void;
}

export function ResearcherQuoteCard({ quote, onClick, reportId, onStatusChange }: ResearcherQuoteCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

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
    setIsUpdating(true);
    
    try {
      const updateData = {
        isPublic: newStatus === 'Published',
        isApproved: newStatus === 'Approved' || newStatus === 'Published'
      };

      // Optimistically update the UI first (immediate feedback)
      const updatedQuote = {
        ...quote,
        status: newStatus,
        isPublic: updateData.isPublic,
        isApproved: updateData.isApproved
      };

      // Update cache optimistically with the new quote data
      mutate(`/api/reports/${reportId}/quotes`, 
        (currentData: any) => {
          if (!currentData) return currentData;
          return currentData.map((q: any) => q.id === quote.id ? updatedQuote : q);
        }, 
        false // Don't revalidate immediately
      );

      // Switch to the corresponding tab immediately
      if (onStatusChange) {
        onStatusChange(newStatus);
      }

      // Then make the API call in the background
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update quote status');
        // If API fails, revert the optimistic update
        mutate(`/api/reports/${reportId}/quotes`);
      }
      
    } catch (error) {
      console.error('Error updating quote status:', error);
      // Revert optimistic update on error
      mutate(`/api/reports/${reportId}/quotes`);
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

        <div className="text-xs text-gray-500">
          {new Date(quote.createdAt).toLocaleDateString()}
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
    </div>
  );
}