'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface Entity {
  id: string;
  name: string;
  type: 'person' | 'company' | 'industry' | 'other';
  primaryUrl?: string;
}

interface EntityComboboxProps {
  entities: Entity[];
  selectedEntity: string;
  onEntityChange: (entityId: string) => void;
  onEntityCreate: (entity: { name: string; type: string }) => Promise<void>;
  disabled?: boolean;
}

export function EntityCombobox({
  entities,
  selectedEntity,
  onEntityChange,
  onEntityCreate,
  disabled = false,
}: EntityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<'person' | 'company' | 'industry' | 'other'>('person');
  const [isCreating, setIsCreating] = useState(false);

  const selectedEntityObj = entities.find(entity => entity.id === selectedEntity);

  const handleCreateEntity = async () => {
    if (!newEntityName.trim()) return;
    
    setIsCreating(true);
    try {
      await onEntityCreate({
        name: newEntityName.trim(),
        type: newEntityType
      });
      setCreateDialogOpen(false);
      setNewEntityName('');
      setNewEntityType('person');
      setOpen(false);
    } catch (error) {
      console.error('Failed to create entity:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateFromSearch = () => {
    setNewEntityName(searchValue);
    setCreateDialogOpen(true);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedEntityObj
              ? selectedEntityObj.name
              : "Select speaker..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Search speakers..." 
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No speaker found.</p>
                {searchValue && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateFromSearch}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create "{searchValue}"
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {entities.map((entity) => (
                <CommandItem
                  key={entity.id}
                  value={entity.name}
                  onSelect={() => {
                    onEntityChange(entity.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedEntity === entity.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div>
                    <div className="font-medium">{entity.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {entity.type}
                    </div>
                  </div>
                </CommandItem>
              ))}
              {searchValue && !entities.some(e => e.name.toLowerCase().includes(searchValue.toLowerCase())) && (
                <CommandItem onSelect={handleCreateFromSearch}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{searchValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Speaker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="entity-name">Name</Label>
              <Input
                id="entity-name"
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                placeholder="Enter speaker name"
              />
            </div>
            <div>
              <Label>Type</Label>
              <RadioGroup
                value={newEntityType}
                onValueChange={(value) => setNewEntityType(value as typeof newEntityType)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="person" id="person" />
                  <Label htmlFor="person">Person</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company">Company</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="industry" id="industry" />
                  <Label htmlFor="industry">Industry</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEntity}
              disabled={!newEntityName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Speaker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}