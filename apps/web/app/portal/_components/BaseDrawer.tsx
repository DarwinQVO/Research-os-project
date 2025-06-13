'use client';

import { useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface BaseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title: string;
  description?: string;
  enableKeyboardNavigation?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  size?: 'default' | 'large' | 'full';
}

export function BaseDrawer({
  open,
  onOpenChange,
  children,
  title,
  description,
  enableKeyboardNavigation = false,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  size = 'default',
}: BaseDrawerProps) {
  useEffect(() => {
    if (!enableKeyboardNavigation) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      
      switch (event.key) {
        case 'Escape':
          onOpenChange(false);
          break;
        case 'ArrowLeft':
          if (hasPrevious && onPrevious) onPrevious();
          break;
        case 'ArrowRight':
          if (hasNext && onNext) onNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, onPrevious, onNext, hasPrevious, hasNext, enableKeyboardNavigation]);

  // Calculate insets based on size
  const getInsets = () => {
    switch (size) {
      case 'large':
        return 'inset-4 md:inset-8 lg:inset-16 2xl:inset-24';
      case 'full':
        return 'inset-2 md:inset-4 lg:inset-8 2xl:inset-12';
      default:
        return 'inset-6 md:inset-12 lg:inset-24 2xl:inset-32';
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Animated backdrop with blur */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => onOpenChange(false)}
            >
              {/* Hover close areas - outside the card */}
              <div 
                className="absolute inset-y-0 left-0 w-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                <span className="text-xs text-[color:var(--mymind-muted)] font-medium">close</span>
              </div>
              <div 
                className="absolute inset-y-0 right-0 w-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                <span className="text-xs text-[color:var(--mymind-muted)] font-medium">close</span>
              </div>
              <div 
                className="absolute inset-x-0 top-0 h-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                <span className="text-xs text-[color:var(--mymind-muted)] font-medium">close</span>
              </div>
              <div 
                className="absolute inset-x-0 bottom-0 h-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                <span className="text-xs text-[color:var(--mymind-muted)] font-medium">close</span>
              </div>
            </motion.div>
            
            {/* Animated drawer panel */}
            <motion.div
              key="panel"
              className={`fixed ${getInsets()} bg-[#1e1e25] rounded-2xl overflow-hidden z-50`}
              initial={{ opacity: 0, y: 50, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Hidden Sheet for screen reader accessibility */}
      <Sheet open={false}>
        <SheetContent className="hidden">
          <SheetDescription className="sr-only">
            {description || `${title} details and actions`}
          </SheetDescription>
          
          <SheetHeader className="sr-only">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
}