'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Tag } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  type?: string;
  description?: string;
}

interface EntitiesSectionProps {
  entities: Entity[];
}

export function EntitiesSection({ entities }: EntitiesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEntityColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'person':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'organization':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'location':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'concept':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-[#45caff]/10 text-[#45caff] border-[#45caff]/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 w-full group"
      >
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-[#a7b4c6] group-hover:text-[#d4d4e1] transition-colors" />
        ) : (
          <ChevronRight className="w-5 h-5 text-[#a7b4c6] group-hover:text-[#d4d4e1] transition-colors" />
        )}
        <h3 className="font-nunito font-light text-[#d4d4e1] text-lg">
          Entities ({entities.length})
        </h3>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="space-y-4 pl-8">
          {entities.length === 0 ? (
            <div className="flex items-center gap-3 text-[#a7b4c6] text-sm italic">
              <Tag className="w-4 h-4" />
              <span>No entities found from this source.</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {entities.map((entity) => (
                <div
                  key={entity.id}
                  className={`
                    inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-nunito
                    border transition-colors hover:scale-105 cursor-default
                    ${getEntityColor(entity.type)}
                  `}
                  title={entity.description}
                >
                  <Tag className="w-3 h-3" />
                  <span>{entity.name}</span>
                  {entity.type && (
                    <span className="text-xs opacity-70 capitalize">
                      {entity.type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}