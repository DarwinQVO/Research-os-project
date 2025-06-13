'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { ExternalLink, Edit2, Globe, Video, FileText, Hash } from 'lucide-react';
import type { SourceMeta } from '@research-os/db/source';
import { EditSourceDialog } from './EditSourceDialog';
import useSWR from 'swr';

interface SourceDrawerProps {
  source: SourceMeta | null;
  reportId: string;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function SourceDrawer({ 
  source, 
  reportId, 
  clientId, 
  open, 
  onOpenChange 
}: SourceDrawerProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch quotes from this source
  const { data: quotes = [] } = useSWR(
    source ? `/api/sources/${source.id}/quotes` : null,
    fetcher
  );

  // Fetch entities mentioned in quotes from this source
  const { data: entities = [] } = useSWR(
    source ? `/api/sources/${source.id}/entities` : null,
    fetcher
  );

  if (!source) return null;

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

  const getStatusChip = (status: string) => {
    const variants = {
      pending: 'bg-gray-100 text-gray-700 border-gray-200',
      approved: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      published: 'bg-green-100 text-green-700 border-green-200'
    };

    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${variants[status as keyof typeof variants]}`}
      >
        {status}
      </Badge>
    );
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
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getTypeIcon(source.type)}
                <SheetTitle className="text-left line-clamp-2">
                  {source.title}
                </SheetTitle>
              </div>
              {getStatusChip(source.status || 'pending')}
            </div>
            
            <SheetDescription className="text-left">
              <div className="space-y-2">
                {source.author && (
                  <p><strong>Author:</strong> {source.author}</p>
                )}
                {source.publishedAt && (
                  <p><strong>Published:</strong> {formatDate(source.publishedAt)}</p>
                )}
                <div className="flex items-center gap-2">
                  <strong>URL:</strong>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
                  >
                    <span className="truncate">{source.url}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {source.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-600">{source.description}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Statistics</h3>
              <Button
                onClick={() => setIsEditDialogOpen(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Source
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-2xl font-bold">{quotes.length}</p>
                <p className="text-sm text-gray-600">Quotes</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-2xl font-bold">{entities.length}</p>
                <p className="text-sm text-gray-600">Entities Mentioned</p>
              </div>
            </div>

            {quotes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Recent Quotes</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {quotes.slice(0, 5).map((quote: any) => (
                    <div key={quote.id} className="border rounded-lg p-3">
                      <p className="text-sm line-clamp-3">{quote.shortText}</p>
                      {quote.speaker && (
                        <p className="text-xs text-gray-500 mt-1">— {quote.speaker}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entities.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Entities Mentioned</h3>
                <div className="flex flex-wrap gap-2">
                  {entities.slice(0, 10).map((entity: any) => (
                    <Badge key={entity.id} variant="secondary" className="text-xs">
                      {entity.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Source Dialog */}
      {isEditDialogOpen && (
        <EditSourceDialog
          reportId={reportId}
          clientId={clientId}
          source={source}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  );
}