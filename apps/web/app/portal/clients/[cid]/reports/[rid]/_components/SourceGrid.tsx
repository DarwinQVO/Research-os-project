'use client';

import { motion } from 'framer-motion';
import { SourceCard } from '../../../../../_components/SourceCard';
import { SourceMeta } from '@research-os/db/source';

interface SourceGridProps {
  sources: SourceMeta[];
  onSourceClick: (source: SourceMeta) => void;
  selectedSource?: SourceMeta | null;
}

export function SourceGrid({ sources, onSourceClick, selectedSource }: SourceGridProps) {
  return (
    <div className="w-full">
      <div className="grid gap-5 auto-rows-max grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {sources.map((source) => (
          <motion.div
            key={source.id}
            layoutId={source.id}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <SourceCard 
              source={source} 
              onClick={() => onSourceClick(source)}
              isSelected={selectedSource?.id === source.id}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}