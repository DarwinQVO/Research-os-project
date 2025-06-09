import { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { mutate } from 'swr';

interface ClientCardProps {
  id: string;
  name: string;
  onDelete?: () => void;
}

export function ClientCard({ id, name, onDelete }: ClientCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        mutate('/api/clients');
        onDelete?.();
      }
    } catch (error) {
      console.error('Error deleting client:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{name}</h3>
          <Link 
            href={`/clients/${id}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View Details →
          </Link>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{name}"? This will also delete all associated reports and quotes. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}