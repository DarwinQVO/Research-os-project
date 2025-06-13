'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe, Video, FileText, Hash } from 'lucide-react';
import type { SourceMeta, SourceStatus } from '@research-os/db/source';

interface SourceListProps {
  sources: SourceMeta[];
  selectedSources: string[];
  onSelectionChange: (sourceIds: string[]) => void;
  onSourceClick: (source: SourceMeta) => void;
}

export function SourceList({ 
  sources, 
  selectedSources, 
  onSelectionChange, 
  onSourceClick 
}: SourceListProps) {
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

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return '';
    }
  };

  const getStatusChip = (status: SourceStatus) => {
    const variants = {
      pending: 'bg-gray-100 text-gray-700 border-gray-200',
      approved: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      published: 'bg-green-100 text-green-700 border-green-200'
    };

    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${variants[status]}`}
      >
        {status}
      </Badge>
    );
  };

  const handleSourceSelection = (sourceId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSources, sourceId]);
    } else {
      onSelectionChange(selectedSources.filter(id => id !== sourceId));
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-2">
      {sources.map((source) => (
        <div
          key={source.id}
          className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer max-w-[400px] group"
          onClick={() => onSourceClick(source)}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selectedSources.includes(source.id)}
              onCheckedChange={(checked) => 
                handleSourceSelection(source.id, checked as boolean)
              }
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFaviconUrl(source.url) && (
                    <img
                      src={getFaviconUrl(source.url)}
                      alt=""
                      className="w-4 h-4 flex-shrink-0"
                    />
                  )}
                  <h3 className="font-medium truncate text-sm">
                    {source.title}
                  </h3>
                </div>
                {getStatusChip(source.status || 'pending')}
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                {source.author && source.publishedAt && (
                  <span>{source.author} • {formatDate(source.publishedAt)}</span>
                )}
                {source.author && !source.publishedAt && (
                  <span>{source.author}</span>
                )}
                {!source.author && source.publishedAt && (
                  <span>{formatDate(source.publishedAt)}</span>
                )}
              </div>
              
              <div className="text-xs text-blue-600 truncate">
                {source.url}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {sources.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No sources found</p>
        </div>
      )}
    </div>
  );
}