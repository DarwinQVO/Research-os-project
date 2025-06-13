'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { Entity } from '@research-os/db/entity';
import { EntityGrid } from '../_components/EntityGrid';
import { EntityDrawer } from './EntityDrawer';
import { EmptyState } from './EmptyState';
import { ThemeToggle } from '../_components/ThemeToggle';
import { ToastProvider } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toaster';

interface EntitiesPageProps {
  params: Promise<{ cid: string; rid: string }> | { cid: string; rid: string };
}

const fetcher = async (url: string) => {
  try {
    console.log('Fetching from URL:', url);
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Fetch error:', res.status, errorText);
      const error = new Error('An error occurred while fetching the data.') as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    
    const text = await res.text();
    console.log('Response text:', text);
    
    if (!text) {
      console.warn('Empty response received');
      return [];
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Invalid JSON:', text);
      throw new Error(`Invalid JSON response: ${text}`);
    }
  } catch (error) {
    console.error('Fetcher error:', error);
    throw error;
  }
};

export default function EntitiesPage({ params }: EntitiesPageProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{ cid: string; rid: string } | null>(null);

  // Handle async params
  useEffect(() => {
    Promise.resolve(params).then(setResolvedParams);
  }, [params]);

  const { data: entities, error: entitiesError, isLoading: entitiesLoading } = useSWR(
    resolvedParams ? `/api/reports/${resolvedParams.rid}/entities?public=1` : null,
    fetcher
  );

  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(entity);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedEntity(null);
  };

  // Show loading while params are being resolved
  if (!resolvedParams) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (entitiesError) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Entity Library</h1>
          <p className="text-gray-400">
            {(entitiesError as any)?.status === 404 
              ? 'Client or Report not found' 
              : 'Failed to load entities'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
        {/* Navigation Header */}
        <header className="flex justify-start items-center gap-10 px-6 h-[56px] border-b border-[#26262e] sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-sm">
          <h1 className="font-lora font-light text-[28px] text-[#d4d4e1]">
            Entity Library
          </h1>
          
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {entitiesLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center py-20"
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-100 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading entities...</p>
                </div>
              </motion.div>
            ) : entities && entities.length > 0 ? (
              <motion.div
                key="entities"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
                className="max-w-[1440px] mx-auto"
              >
                <EntityGrid 
                  entities={entities} 
                  onEntityClick={handleEntityClick}
                  selectedEntity={selectedEntity}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
              >
                <EmptyState />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Entity Detail Drawer */}
        <EntityDrawer
          entity={selectedEntity}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
        />

        <Toaster />
      </div>
    </ToastProvider>
  );
}