'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Badge } from '@/components/ui/badge';

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select items...",
  className
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (selectedValue: string) => {
    if (value.includes(selectedValue)) {
      onChange(value.filter(item => item !== selectedValue));
    } else {
      onChange([...value, selectedValue]);
    }
  };

  const removeItem = (itemToRemove: string) => {
    onChange(value.filter(item => item !== itemToRemove));
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value.length > 0
              ? `${value.length} item${value.length > 1 ? 's' : ''} selected`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(option) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((item) => (
            <Badge key={item} variant="secondary" className="text-xs">
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}