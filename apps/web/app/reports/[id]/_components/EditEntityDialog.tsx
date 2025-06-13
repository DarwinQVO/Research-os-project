'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Building, Factory, FileText, Upload, X } from 'lucide-react';
import { useToast } from '@/lib/use-toast';
import { entityEditSchema } from '@/lib/zodSchemas';
import { Entity } from '@research-os/db/entity';
import { mutate } from 'swr';

interface EditEntityDialogProps {
  entity: Entity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
}

export function EditEntityDialog({ entity, open, onOpenChange, reportId }: EditEntityDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'person' as 'person' | 'company' | 'industry' | 'other',
    description: '',
    primaryUrl: '',
    avatarUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const { toast } = useToast();

  // Reset form when entity changes
  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name || '',
        type: entity.type || 'person',
        description: entity.description || '',
        primaryUrl: entity.primaryUrl || '',
        avatarUrl: entity.avatarUrl || ''
      });
      setAvatarPreview(entity.avatarUrl || '');
      setErrors({});
    }
  }, [entity]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'person': return User;
      case 'company': return Building;
      case 'industry': return Factory;
      default: return FileText;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, avatarUrl: url }));
    setAvatarPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = entityEditSchema.parse({
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        primaryUrl: formData.primaryUrl || undefined,
        avatarUrl: formData.avatarUrl || undefined
      });

      // Update entity
      console.log('Sending entity update:', validatedData);
      const response = await fetch(`/api/entities/${entity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || `Failed to update entity (${response.status})`);
      }

      const result = await response.json();
      console.log('Update result:', result);

      // Revalidate data
      mutate(`/api/reports/${reportId}/entities`);

      toast({
        title: 'Success',
        description: 'Entity updated successfully',
      });

      onOpenChange(false);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        // Handle validation errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update entity',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const TypeIcon = getTypeIcon(formData.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Entity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Avatar & Basic Info */}
            <div className="space-y-4">
              {/* Avatar Section */}
              <div className="space-y-3">
                <Label>Avatar</Label>
                <div className="flex items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                        onError={() => setAvatarPreview('')}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                        {formData.name ? getInitials(formData.name) : <User className="w-8 h-8" />}
                      </div>
                    )}
                  </div>
                  
                  {/* Avatar URL Input */}
                  <div className="flex-1">
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      value={formData.avatarUrl}
                      onChange={(e) => handleAvatarUrlChange(e.target.value)}
                      className={errors.avatarUrl ? 'border-red-500' : ''}
                    />
                    {errors.avatarUrl && (
                      <p className="text-sm text-red-500 mt-1">{errors.avatarUrl}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Direct URL to an image (JPG, PNG, WebP)
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? 'border-red-500' : ''}
                  placeholder="Entity name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'person' | 'company' | 'industry' | 'other') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" />
                        {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
                      </div>
                    </SelectValue>
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
                        <Factory className="h-4 w-4" />
                        Industry
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Other
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type}</p>
                )}
              </div>
            </div>

            {/* Right Column - URLs & Description */}
            <div className="space-y-4">
              {/* Primary URL */}
              <div className="space-y-2">
                <Label htmlFor="primaryUrl">Primary URL</Label>
                <Input
                  id="primaryUrl"
                  type="url"
                  value={formData.primaryUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryUrl: e.target.value }))}
                  className={errors.primaryUrl ? 'border-red-500' : ''}
                  placeholder="https://example.com"
                />
                {errors.primaryUrl && (
                  <p className="text-sm text-red-500">{errors.primaryUrl}</p>
                )}
                <p className="text-xs text-gray-500">
                  Website, LinkedIn, Twitter, etc.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={errors.description ? 'border-red-500' : ''}
                  placeholder="Brief description (max 160 characters)"
                  maxLength={160}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
                <p className="text-xs text-gray-500 text-right">
                  {formData.description.length}/160 characters
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}