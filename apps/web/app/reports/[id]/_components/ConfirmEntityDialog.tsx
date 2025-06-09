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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ExternalLink, CheckCircle } from 'lucide-react';
import { mutate } from 'swr';
import type { EntitySuggestion } from '@research-os/ai';

interface ConfirmEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  reportTitle: string;
}

export function ConfirmEntityDialog({ 
  open, 
  onOpenChange, 
  reportId, 
  reportTitle 
}: ConfirmEntityDialogProps) {
  const [entityName, setEntityName] = useState(reportTitle);
  const [suggestions, setSuggestions] = useState<EntitySuggestion[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<EntitySuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const handleGetSuggestions = async () => {
    if (entityName.length < 2) {
      setError('Entity name must be at least 2 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuggestions([]);
    setSelectedEntity(null);

    try {
      const response = await fetch(`/reports/${reportId}/api/disambiguate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: entityName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get suggestions');
      }

      const { suggestions: newSuggestions } = await response.json();
      setSuggestions(newSuggestions);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedEntity) return;

    setIsConfirming(true);
    setError('');

    try {
      const response = await fetch(`/reports/${reportId}/api/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chosen: {
            name: selectedEntity.name,
            type: selectedEntity.type,
            primaryUrl: selectedEntity.primaryUrl
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm entity');
      }

      // Optimistic update
      mutate(`/api/reports/${reportId}/entity`);
      
      // Reset and close dialog
      setEntityName(reportTitle);
      setSuggestions([]);
      setSelectedEntity(null);
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsConfirming(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'person': return '👤';
      case 'company': return '🏢';
      case 'industry': return '🏭';
      default: return '📋';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔍 Identify Entity</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="entityName">Entity Name</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="entityName"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Enter entity name..."
                className="flex-1"
              />
              <Button 
                onClick={handleGetSuggestions}
                disabled={isLoading || entityName.length < 2}
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? 'Searching...' : 'Get Suggestions'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-3">
              <Label>Select Entity (found {suggestions.length} suggestions)</Label>
              {suggestions.map((suggestion, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all ${
                    selectedEntity === suggestion 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedEntity(suggestion)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                        <CardTitle className="text-base">{suggestion.name}</CardTitle>
                        {selectedEntity === suggestion && (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={getConfidenceColor(suggestion.confidence)}
                      >
                        {Math.round(suggestion.confidence * 100)}% match
                      </Badge>
                    </div>
                    <CardDescription className="capitalize">
                      {suggestion.type}
                    </CardDescription>
                  </CardHeader>
                  {suggestion.primaryUrl && (
                    <CardContent className="pt-0">
                      <a 
                        href={suggestion.primaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {suggestion.primaryUrl}
                      </a>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedEntity || isConfirming}
          >
            {isConfirming ? 'Confirming...' : 'Confirm Entity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}