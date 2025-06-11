'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mutate } from 'swr';
import { User, Building, HelpCircle } from 'lucide-react';

interface EditEntityDialogProps {
  reportId: string;
  clientId?: string;
  entity: {
    id: string;
    name: string;
    type: 'person' | 'company' | 'industry' | 'other';
    primaryUrl?: string;
    confidence?: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEntityDialog({ reportId, clientId, entity, open, onOpenChange }: EditEntityDialogProps) {
  const [formData, setFormData] = useState({
    name: entity.name,
    type: entity.type,
    primaryUrl: entity.primaryUrl || '',
    confidence: entity.confidence || 0.9,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update form when entity changes
  useEffect(() => {
    setFormData({
      name: entity.name,
      type: entity.type,
      primaryUrl: entity.primaryUrl || '',
      confidence: entity.confidence || 0.9,
    });
  }, [entity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/entities/${entity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          primaryUrl: formData.primaryUrl || undefined,
          confidence: formData.confidence,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update entity');
      }

      const { entity: updatedEntity } = await response.json();
      
      // Optimistic update for entities list
      const entitiesEndpoint = clientId 
        ? `/api/clients/${clientId}/reports/${reportId}/entities`
        : `/api/reports/${reportId}/entities`;
      
      mutate(entitiesEndpoint, (current: any) => {
        if (!current) return current;
        return current.map((e: any) => e.id === entity.id ? updatedEntity : e);
      }, false);
      
      onOpenChange(false);
      
      console.log('Entity updated successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'person':
        return <User className="h-4 w-4" />;
      case 'company':
        return <Building className="h-4 w-4" />;
      case 'industry':
        return <Building className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Entity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Entity name"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'person' | 'company' | 'industry' | 'other') => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Person
                    </div>
                  </SelectItem>
                  <SelectItem value="company">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Company
                    </div>
                  </SelectItem>
                  <SelectItem value="industry">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Industry
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Other
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="primaryUrl">Primary URL</Label>
              <Input
                id="primaryUrl"
                type="url"
                value={formData.primaryUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryUrl: e.target.value }))}
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500">
                Main website or profile URL for this entity
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confidence">Confidence</Label>
              <Select
                value={formData.confidence.toString()}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, confidence: parseFloat(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.0">High (1.0)</SelectItem>
                  <SelectItem value="0.9">Very High (0.9)</SelectItem>
                  <SelectItem value="0.8">Good (0.8)</SelectItem>
                  <SelectItem value="0.7">Medium (0.7)</SelectItem>
                  <SelectItem value="0.6">Low (0.6)</SelectItem>
                  <SelectItem value="0.5">Uncertain (0.5)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                How confident are you in this entity identification?
              </p>
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
              {isSubmitting ? 'Updating...' : 'Update Entity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}