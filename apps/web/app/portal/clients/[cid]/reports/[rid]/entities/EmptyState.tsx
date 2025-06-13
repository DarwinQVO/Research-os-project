'use client';

import { User } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-[#26262e]/50 rounded-2xl p-8 mb-6">
        <User className="w-12 h-12 text-[#a7b4c6] mx-auto" />
      </div>
      
      <h2 className="font-lora font-light text-2xl text-[#d4d4e1] mb-4">
        No entities found
      </h2>
      
      <p className="text-[#a7b4c6] font-nunito max-w-md">
        This report doesn't have any published entities yet. 
        Check back later for entity profiles and information.
      </p>
    </div>
  );
}