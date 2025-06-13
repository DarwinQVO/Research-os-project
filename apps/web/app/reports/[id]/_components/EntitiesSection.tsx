'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
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
import { EditEntityDialog } from './EditEntityDialog';
import { Entity } from '@research-os/db/entity';

interface EntitiesSectionProps {
  clientId: string;
  reportId: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function EntitiesSection({ clientId, reportId }: EntitiesSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editEntity, setEditEntity] = useState<Entity | null>(null);
  
  const { data: entities, error } = useSWR<Entity[]>(
    `/api/clients/${clientId}/reports/${reportId}/entities`,
    fetcher
  );

  const handleDelete = async (entityId: string) => {
    try {
      const response = await fetch(
        `/api/entities/${entityId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        await mutate(`/api/clients/${clientId}/reports/${reportId}/entities`);
        setDeleteId(null);
      } else {
        console.error('Failed to delete entity');
      }
    } catch (error) {
      console.error('Error deleting entity:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'person': return '👤';
      case 'company': return '🏢';
      case 'industry': return '🏭';
      default: return '📎';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'person': return 'text-blue-600';
      case 'company': return 'text-green-600';
      case 'industry': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 text-red-700">
        Failed to load entities
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Button 
          variant="ghost" 
          className="w-full justify-between p-4 h-auto"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">Speakers & Entities</span>
            {entities && (
              <span className="text-sm text-muted-foreground">
                ({entities.length})
              </span>
            )}
          </div>
        </Button>
        
        {isOpen && (
          <div className="border-t p-4 space-y-2">
            {!entities ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading entities...
              </div>
            ) : entities.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No speakers or entities yet. Add quotes to create them.
              </div>
            ) : (
              entities.map((entity) => (
                <div
                  key={entity.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getTypeIcon(entity.type)}</span>
                    <div>
                      <div className="font-medium">{entity.name}</div>
                      <div className={`text-xs capitalize ${getTypeColor(entity.type)}`}>
                        {entity.type}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditEntity(entity)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(entity.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Entity Dialog */}
      {editEntity && (
        <EditEntityDialog
          reportId={reportId}
          entity={editEntity}
          open={!!editEntity}
          onOpenChange={(open) => !open && setEditEntity(null)}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entity</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the entity
              and remove it from all associated quotes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}