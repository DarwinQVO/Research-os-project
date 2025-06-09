'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { ReportCard } from './_components/ReportCard';
import { NewReportDialog } from './_components/NewReportDialog';
import { ClientStepper } from '../_components/ClientStepper';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ClientDetailPageProps {
  params: { id: string };
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { data, error, isLoading } = useSWR(`/api/clients/${params.id}`, fetcher);

  if (isLoading) {
    return (
      <main className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Error loading client data
        </div>
      </main>
    );
  }

  const { client, reports } = data;

  // Additional safety check for client data
  if (!client) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-center text-red-600">
          Client not found
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">{client.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Client
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports?.map((report: any) => (
          <ReportCard key={report.id} report={report} clientId={params.id} />
        ))}
        {reports?.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            No reports yet. Create your first report!
          </div>
        )}
      </div>

      <NewReportDialog
        clientId={params.id}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <ClientStepper
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        editClient={client}
      />
    </main>
  );
}