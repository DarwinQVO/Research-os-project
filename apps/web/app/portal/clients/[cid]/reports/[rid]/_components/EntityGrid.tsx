'use client';

import { motion } from 'framer-motion';
import { EntityCard } from '../../../../../_components/EntityCard';
import { Entity } from '@research-os/db/entity';

interface EntityGridProps {
  entities: Entity[];
  onEntityClick: (entity: Entity) => void;
  selectedEntity?: Entity | null;
}

export function EntityGrid({ entities, onEntityClick, selectedEntity }: EntityGridProps) {
  return (
    <div className="w-full">
      <div className="grid gap-5 auto-rows-max grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {entities.map((entity) => (
          <motion.div
            key={entity.id}
            layoutId={entity.id}
            whileHover={{ y: -2, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <EntityCard 
              entity={entity} 
              onClick={() => onEntityClick(entity)}
              isSelected={selectedEntity?.id === entity.id}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}