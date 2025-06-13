'use client';

import { FileText } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-16 h-16 bg-[#26262e] rounded-full flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-[#a7b4c6]" />
      </div>
      <h3 className="text-lg font-nunito font-light text-[#d4d4e1] mb-2">
        No sources found
      </h3>
      <p className="text-[#a7b4c6] text-sm text-center max-w-md">
        Sources will appear here once published
      </p>
    </div>
  );
}