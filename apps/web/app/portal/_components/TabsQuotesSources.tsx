'use client';

import { cn } from '@/lib/utils';

export default function QuotesSourcesTabs({
  value,
  onChange,
}: {
  value: 'quotes' | 'sources';
  onChange: (v: 'quotes' | 'sources') => void;
}) {
  return (
    <nav className="flex gap-8">
      {(['quotes', 'sources'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            'relative pb-1 font-nunito text-[16px] transition',
            value === tab
              ? 'text-[#ffffff]'
              : 'text-[#8e9db4] hover:text-[#d4d4e1]'
          )}
        >
          {tab === 'quotes' ? 'Quotes' : 'Sources'}
          {/* underline */}
          {value === tab && (
            <span className="absolute -bottom-0.5 left-0 h-[2px] w-full bg-[#45caff] rounded-full" />
          )}
        </button>
      ))}
    </nav>
  );
}