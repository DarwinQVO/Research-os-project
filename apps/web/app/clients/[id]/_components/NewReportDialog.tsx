'use client';

import { useState } from 'react';
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
import { mutate } from 'swr';

interface NewReportDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewReportDialog({ clientId, open, onOpenChange }: NewReportDialogProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.length < 3) {
      setError('Report title must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/clients/${clientId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create report');
      }

      const { report } = await response.json();
      
      // Optimistic update
      mutate(`/api/clients/${clientId}`, (current: any) => {
        if (!current) return current;
        return {
          ...current,
          reports: [...(current.reports || []), report]
        };
      }, false);
      
      setTitle('');
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter report title..."
                minLength={3}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 col-span-4">
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
              {isSubmitting ? 'Creating...' : 'Create Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}