'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClientCard } from './clients/_components/ClientCard';
import { ClientStepper } from './clients/_components/ClientStepper';
import { Plus } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [isStepperOpen, setIsStepperOpen] = useState(false);

  const { data: clients, error: fetchError } = useSWR('/api/clients', fetcher);

  return (
    <main className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Research OS</h1>
        <Button onClick={() => setIsStepperOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients?.map((client: any) => (
          <ClientCard key={client.id} id={client.id} name={client.name} />
        ))}
      </div>

      <ClientStepper
        open={isStepperOpen}
        onOpenChange={setIsStepperOpen}
      />
    </main>
  );
}
