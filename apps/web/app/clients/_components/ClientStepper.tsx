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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TagsInput } from './TagsInput';
import { MultiSelect } from './MultiSelect';
import { clientExtendedSchema } from '@/lib/zodSchemas';
import { mutate } from 'swr';

interface ClientStepperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editClient?: any;
}

export function ClientStepper({ open, onOpenChange, editClient }: ClientStepperProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: editClient?.name || '',
    mandatorySources: editClient?.mandatorySources || [],
    context: editClient?.context || '',
    niches: editClient?.niches || [],
    interests: editClient?.interests || [],
    language: editClient?.language || 'en'
  });

  const isEditing = Boolean(editClient);
  const maxSteps = 3;

  const nichesOptions = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Entertainment', 
    'Sports', 'Politics', 'Business', 'Science', 'Travel'
  ];

  const interestsOptions = [
    'AI/ML', 'Blockchain', 'Cybersecurity', 'Cloud Computing', 'IoT',
    'Data Analytics', 'Mobile Development', 'Web Development', 'DevOps', 'Startups'
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < maxSteps) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError('');
    
    const result = clientExtendedSchema.safeParse(formData);
    if (!result.success) {
      setError('Please check all fields are valid');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing ? `/api/clients/${editClient.id}` : '/api/clients';
      const method = isEditing ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} client`);
      }

      const responseData = await response.json();
      
      // Optimistic update
      if (isEditing) {
        mutate(`/api/clients/${editClient.id}`);
      } else {
        mutate('/api/clients', (current?: any[]) => [...(current || []), responseData.client], false);
      }
      
      // Reset form
      setFormData({
        name: '',
        mandatorySources: [],
        context: '',
        niches: [],
        interests: [],
        language: 'en'
      });
      setStep(1);
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSave = () => {
    const result = clientExtendedSchema.safeParse(formData);
    return result.success;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Enter client name..."
                className="mt-1"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="mandatorySources">Mandatory Sources</Label>
              <TagsInput
                value={formData.mandatorySources}
                onChange={(value) => updateFormData('mandatorySources', value)}
                placeholder="e.g. nytimes.com, sec.gov..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="context">Context</Label>
              <Textarea
                id="context"
                value={formData.context}
                onChange={(e) => updateFormData('context', e.target.value)}
                placeholder="Enter context information..."
                className="mt-1 resize-none"
                rows={6}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Niches</Label>
              <MultiSelect
                options={nichesOptions}
                value={formData.niches}
                onChange={(value) => updateFormData('niches', value)}
                placeholder="Select niches..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Interests</Label>
              <MultiSelect
                options={interestsOptions}
                value={formData.interests}
                onChange={(value) => updateFormData('interests', value)}
                placeholder="Select interests..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Language</Label>
              <RadioGroup
                value={formData.language}
                onValueChange={(value) => updateFormData('language', value)}
                className="mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="en" />
                  <Label htmlFor="en">English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="es" id="es" />
                  <Label htmlFor="es">Español</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Client' : 'New Client'} - Step {step} of {maxSteps}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {renderStep()}
          {error && (
            <div className="text-sm text-red-600 mt-4">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handlePrev}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < maxSteps ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!canSave() || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Client' : 'Create Client'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}