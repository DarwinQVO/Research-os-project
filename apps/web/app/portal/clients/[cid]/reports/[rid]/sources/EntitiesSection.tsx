'use client';

import { Badge } from '@/components/ui/badge';

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
  const getEntityColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'person':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20';
      case 'organization':
      case 'company':
        return 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20';
      case 'location':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20';
      case 'concept':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20';
      default:
        return 'bg-[#45caff]/10 text-[#45caff] border-[#45caff]/20 hover:bg-[#45caff]/20';
    }
  };

  if (entities.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[#a7b4c6] text-center">No entities found from this source.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {entities.map((entity) => (
          <div
            key={entity.id}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-nunito
              border transition-all hover:scale-105 cursor-default
              ${getEntityColor(entity.type)}
            `}
            title={entity.description || `${entity.type || 'Entity'}: ${entity.name}`}
          >
            <span>{entity.name}</span>
            {entity.type && (
              <span className="text-xs opacity-70 capitalize bg-black/20 px-2 py-0.5 rounded-full">
                {entity.type}
              </span>
            )}
          </div>
        ))}
      </div>
      
      {entities.some(e => e.description) && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-nunito text-[#d4d4e1] font-medium">Entity Details</h4>
          <div className="space-y-2">
            {entities
              .filter(e => e.description)
              .map((entity) => (
                <div key={`${entity.id}-detail`} className="bg-[#16161c] rounded-lg p-3 border border-[#26262e]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[#d4d4e1] text-sm">{entity.name}</span>
                    {entity.type && (
                      <Badge variant="secondary" className="text-xs">
                        {entity.type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#a7b4c6] leading-relaxed">
                    {entity.description}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}