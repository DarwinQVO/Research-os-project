import { useState } from 'react';
import Link from 'next/link';
import { FileText, Calendar, MoreVertical } from 'lucide-react';
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

interface ReportCardProps {
  report: {
    id: string;
    title: string;
    createdAt: string;
  };
  clientId: string;
  onDelete?: () => void;
}

export function ReportCard({ report, clientId, onDelete }: ReportCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        mutate(`/api/clients/${clientId}`);
        onDelete?.();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all relative group">
      <Link href={`/reports/${report.id}`} className="block">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-1" />
          <div className="flex-1 pr-8">
            <h3 className="font-semibold text-lg mb-2 text-blue-600 hover:text-blue-700">{report.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(report.createdAt)}</span>
            </div>
          </div>
        </div>
      </Link>
      
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Report</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{report.title}"? This will also delete all associated quotes. This action cannot be undone.
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