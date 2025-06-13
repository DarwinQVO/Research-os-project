'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ResearcherQuoteCard } from './ResearcherQuoteCard';
import { EditEntityDialog } from './EditEntityDialog';
import { 
  CheckCircle, 
  Globe, 
  Clock, 
  Filter,
  X,
  Link as LinkIcon,
  Calendar,
  User,
  FileText,
  Video,
  MessageSquare,
  MoreHorizontal,
  Building,
  Factory,
  Edit
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { useToast } from '@/lib/use-toast';
import type { SourceMeta, SourceStatus } from '@research-os/db/source';
import type { Entity, EntityStatus } from '@research-os/db/entity';

interface ModerationViewProps {
  reportId: string;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ModerationView({ 
  reportId, 
  clientId, 
  open, 
  onOpenChange 
}: ModerationViewProps) {
  const [activeTab, setActiveTab] = useState('quotes');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch sources data
  const { data: sources = [] } = useSWR<SourceMeta[]>(
    open ? `/api/reports/${reportId}/sources` : null,
    fetcher
  );

  // Fetch quotes data
  const { data: quotes = [] } = useSWR(
    open ? `/api/clients/${clientId}/reports/${reportId}/quotes` : null,
    fetcher
  );

  // Fetch entities data
  const { data: entities = [] } = useSWR<Entity[]>(
    open ? `/api/reports/${reportId}/entities` : null,
    fetcher
  );

  // Filter data based on status
  const filteredSources = filterStatus === 'all' 
    ? sources 
    : sources.filter(s => (s.status || 'pending') === filterStatus);

  const filteredQuotes = filterStatus === 'all'
    ? quotes
    : quotes.filter((q: any) => {
        if (filterStatus === 'published') return q.isPublic;
        if (filterStatus === 'approved') return q.isApproved && !q.isPublic;
        if (filterStatus === 'pending') return !q.isApproved && !q.isPublic;
        return true;
      });

  const filteredEntities = filterStatus === 'all'
    ? entities
    : entities.filter(e => (e.status || 'pending') === filterStatus);

  // Get counts by status
  const sourceCounts = {
    all: sources.length,
    pending: sources.filter(s => (s.status || 'pending') === 'pending').length,
    approved: sources.filter(s => s.status === 'approved').length,
    published: sources.filter(s => s.status === 'published').length,
  };

  const quoteCounts = {
    all: quotes.length,
    pending: quotes.filter((q: any) => !q.isApproved && !q.isPublic).length,
    approved: quotes.filter((q: any) => q.isApproved && !q.isPublic).length,
    published: quotes.filter((q: any) => q.isPublic).length,
  };

  const entityCounts = {
    all: entities.length,
    pending: entities.filter(e => (e.status || 'pending') === 'pending').length,
    approved: entities.filter(e => e.status === 'approved').length,
    published: entities.filter(e => e.status === 'published').length,
  };

  const handleSourceStatusChange = async (sourceIds: string[], newStatus: SourceStatus) => {
    try {
      await Promise.all(
        sourceIds.map(sourceId =>
          fetch(`/api/sources/${sourceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          })
        )
      );

      // Revalidate sources data
      mutate(`/api/reports/${reportId}/sources`);
      setSelectedSources([]);

      toast({
        title: 'Success',
        description: `Updated ${sourceIds.length} source(s) to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update sources',
        variant: 'destructive',
      });
    }
  };

  const handleQuoteStatusChange = async (quoteId: string, isPublic: boolean, isApproved: boolean) => {
    try {
      await fetch(`/api/clients/${clientId}/reports/${reportId}/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic, isApproved })
      });

      // Revalidate quotes data
      mutate(`/api/clients/${clientId}/reports/${reportId}/quotes`);
      
      const status = isPublic ? 'published' : isApproved ? 'approved' : 'pending';
      toast({
        title: 'Success',
        description: `Quote updated to ${status}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quote',
        variant: 'destructive',
      });
    }
  };

  const handleBulkQuoteStatusChange = async (quoteIds: string[], isPublic: boolean, isApproved: boolean) => {
    try {
      await Promise.all(
        quoteIds.map(quoteId =>
          fetch(`/api/clients/${clientId}/reports/${reportId}/quotes/${quoteId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPublic, isApproved })
          })
        )
      );

      mutate(`/api/clients/${clientId}/reports/${reportId}/quotes`);
      setSelectedQuotes([]);

      const status = isPublic ? 'published' : isApproved ? 'approved' : 'pending';
      toast({
        title: 'Success',
        description: `Updated ${quoteIds.length} quote(s) to ${status}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quotes',
        variant: 'destructive',
      });
    }
  };

  const handleEntityStatusChange = async (entityIds: string[], newStatus: EntityStatus) => {
    try {
      await Promise.all(
        entityIds.map(entityId =>
          fetch(`/api/entities/${entityId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          })
        )
      );

      // Revalidate entities data
      mutate(`/api/reports/${reportId}/entities`);
      setSelectedEntities([]);

      toast({
        title: 'Success',
        description: `Updated ${entityIds.length} entit${entityIds.length === 1 ? 'y' : 'ies'} to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update entities',
        variant: 'destructive',
      });
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'article': return FileText;
      case 'video': return Video;
      case 'social': return MessageSquare;
      default: return MoreHorizontal;
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'person': return User;
      case 'company': return Building;
      case 'industry': return Factory;
      default: return FileText;
    }
  };

  const getEntityInitials = (name: string) => {
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Content Moderation</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="quotes" className="flex items-center gap-2">
                Quotes
                <Badge variant="secondary" className="text-xs">
                  {quoteCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="sources" className="flex items-center gap-2">
                Sources
                <Badge variant="secondary" className="text-xs">
                  {sourceCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="entities" className="flex items-center gap-2">
                Entities
                <Badge variant="secondary" className="text-xs">
                  {entityCounts.all}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
                className="flex items-center gap-1"
              >
                <Clock className="h-3 w-3" />
                Pending
                <Badge variant="secondary" className="text-xs ml-1">
                  {activeTab === 'quotes' ? quoteCounts.pending : 
                   activeTab === 'sources' ? sourceCounts.pending : entityCounts.pending}
                </Badge>
              </Button>
              <Button
                variant={filterStatus === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('approved')}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Approved
                <Badge variant="secondary" className="text-xs ml-1">
                  {activeTab === 'quotes' ? quoteCounts.approved : 
                   activeTab === 'sources' ? sourceCounts.approved : entityCounts.approved}
                </Badge>
              </Button>
              <Button
                variant={filterStatus === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('published')}
                className="flex items-center gap-1"
              >
                <Globe className="h-3 w-3" />
                Published
                <Badge variant="secondary" className="text-xs ml-1">
                  {activeTab === 'quotes' ? quoteCounts.published : 
                   activeTab === 'sources' ? sourceCounts.published : entityCounts.published}
                </Badge>
              </Button>
            </div>
          </div>

          <TabsContent value="quotes" className="flex-1 overflow-hidden flex flex-col">
            {selectedQuotes.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4">
                <span className="text-sm font-medium">{selectedQuotes.length} selected:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkQuoteStatusChange(selectedQuotes, false, true)}
                >
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleBulkQuoteStatusChange(selectedQuotes, true, true)}
                >
                  Publish All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedQuotes([])}
                >
                  Clear Selection
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 pr-2">
              {filteredQuotes.map((quote: any) => (
                <div key={quote.id} className="relative">
                  <div className="absolute top-3 left-3 z-10">
                    <Checkbox
                      checked={selectedQuotes.includes(quote.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedQuotes([...selectedQuotes, quote.id]);
                        } else {
                          setSelectedQuotes(selectedQuotes.filter(id => id !== quote.id));
                        }
                      }}
                      className="bg-white"
                    />
                  </div>
                  <ResearcherQuoteCard
                    quote={quote}
                    onClick={() => {}}
                    reportId={reportId}
                    clientId={clientId}
                    onStatusChange={(status) => {
                      const isPublic = status === 'Published';
                      const isApproved = status === 'Approved' || status === 'Published';
                      handleQuoteStatusChange(quote.id, isPublic, isApproved);
                    }}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sources" className="flex-1 overflow-hidden flex flex-col">
            {selectedSources.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4">
                <span className="text-sm font-medium">{selectedSources.length} selected:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSourceStatusChange(selectedSources, 'approved')}
                >
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleSourceStatusChange(selectedSources, 'published')}
                >
                  Publish All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedSources([])}
                >
                  Clear Selection
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 pr-2">
              {filteredSources.map((source) => {
                const Icon = getSourceIcon(source.type);
                const statusColor = source.status === 'published' ? 'text-green-600 bg-green-50' :
                                  source.status === 'approved' ? 'text-yellow-600 bg-yellow-50' :
                                  'text-gray-600 bg-gray-50';

                return (
                  <div 
                    key={source.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedSources.includes(source.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSources([...selectedSources, source.id]);
                          } else {
                            setSelectedSources(selectedSources.filter(id => id !== source.id));
                          }
                        }}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm line-clamp-2">{source.title}</h3>
                          <Badge variant="outline" className={`text-xs shrink-0 ${statusColor}`}>
                            {source.status || 'pending'}
                          </Badge>
                        </div>

                        {source.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{source.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Icon className="h-3 w-3" />
                            {source.type}
                          </span>
                          {source.author && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {source.author}
                            </span>
                          )}
                          {source.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(source.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <a 
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <LinkIcon className="h-3 w-3" />
                            View Source
                          </a>

                          <div className="flex gap-1">
                            {source.status !== 'approved' && source.status !== 'published' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSourceStatusChange([source.id], 'approved')}
                                className="h-7 text-xs"
                              >
                                Approve
                              </Button>
                            )}
                            {source.status !== 'published' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleSourceStatusChange([source.id], 'published')}
                                className="h-7 text-xs"
                              >
                                Publish
                              </Button>
                            )}
                            {source.status !== 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSourceStatusChange([source.id], 'pending')}
                                className="h-7 text-xs"
                              >
                                Reset
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="entities" className="flex-1 overflow-hidden flex flex-col">
            {selectedEntities.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4">
                <span className="text-sm font-medium">{selectedEntities.length} selected:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEntityStatusChange(selectedEntities, 'approved')}
                >
                  Approve All
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleEntityStatusChange(selectedEntities, 'published')}
                >
                  Publish All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedEntities([])}
                >
                  Clear Selection
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 pr-2">
              {filteredEntities.map((entity) => {
                const EntityIcon = getEntityIcon(entity.type);
                const statusColor = entity.status === 'published' ? 'text-green-600 bg-green-50' :
                                  entity.status === 'approved' ? 'text-yellow-600 bg-yellow-50' :
                                  'text-gray-600 bg-gray-50';

                return (
                  <div 
                    key={entity.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedEntities.includes(entity.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEntities([...selectedEntities, entity.id]);
                          } else {
                            setSelectedEntities(selectedEntities.filter(id => id !== entity.id));
                          }
                        }}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            {entity.avatarUrl ? (
                              <img 
                                src={entity.avatarUrl} 
                                alt={`${entity.name} avatar`}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-sm">
                                {getEntityInitials(entity.name)}
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium text-sm">{entity.name}</h3>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <EntityIcon className="h-3 w-3" />
                                {entity.type}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-xs shrink-0 ${statusColor}`}>
                            {entity.status || 'pending'}
                          </Badge>
                        </div>

                        {entity.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{entity.description}</p>
                        )}

                        {entity.primaryUrl && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <LinkIcon className="h-3 w-3" />
                            <a 
                              href={entity.primaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {entity.primaryUrl}
                            </a>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingEntity(entity);
                              setIsEditDialogOpen(true);
                            }}
                            className="h-7 text-xs flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          
                          <div className="flex gap-1">
                            {entity.status !== 'approved' && entity.status !== 'published' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEntityStatusChange([entity.id], 'approved')}
                                className="h-7 text-xs"
                              >
                                Approve
                              </Button>
                            )}
                            {entity.status !== 'published' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleEntityStatusChange([entity.id], 'published')}
                                className="h-7 text-xs"
                              >
                                Publish
                              </Button>
                            )}
                            {entity.status !== 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEntityStatusChange([entity.id], 'pending')}
                                className="h-7 text-xs"
                              >
                                Reset
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Entity Dialog */}
        <EditEntityDialog
          entity={editingEntity}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          reportId={reportId}
        />
      </DialogContent>
    </Dialog>
  );
}