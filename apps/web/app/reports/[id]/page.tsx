'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, ExternalLink, Share2, Copy, Check, Plus } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { ConfirmEntityDialog } from './_components/ConfirmEntityDialog';
import { AddQuoteDialog } from './_components/AddQuoteDialog';
import { SourcesSection } from './_components/SourcesSection';
import { EntitiesSection } from './_components/EntitiesSection';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ReportDetailPageProps {
  params: { id: string };
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Fetch the actual report data
  const { data: report, error: reportError, isLoading: isReportLoading } = useSWR(
    `/api/reports/${params.id}`,
    fetcher
  );

  // Fallback data if API not ready
  const reportData = report || {
    id: params.id,
    title: "Sample Report Title",
    content: "This is a sample report content...",
    clientId: "sample-client-id",
    clientName: "Sample Client"
  };

  // Fetch entity associated with this report
  const { data: entity, error: entityError } = useSWR(
    `/api/reports/${params.id}/entity`, 
    fetcher
  );

  // Generate portal URL
  const portalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/portal/clients/${reportData.clientId}/reports/${params.id}`;

  const handleCopyPortalLink = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSharePortalLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${reportData.title} - Quote Library`,
          text: `View quotes from the report: ${reportData.title}`,
          url: portalUrl,
        });
      } catch (err) {
        console.error('Error sharing: ', err);
      }
    } else {
      handleCopyPortalLink();
    }
  };

  return (
    <main className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={reportData.clientId && reportData.clientId !== "sample-client-id" ? `/clients/${reportData.clientId}` : "/"}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back{reportData.clientId && reportData.clientId !== "sample-client-id" ? ` to ${reportData.clientName}` : " to Dashboard"}
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">{reportData.title}</h1>
            <p className="text-gray-600 mt-1">Report ID: {reportData.id}</p>
          </div>
          
          {/* Compact Share Button */}
          <Button
            onClick={handleCopyPortalLink}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            title="Copy client portal link"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Share'}
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          {entity ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-2">
                <span>
                  {entity.type === 'person' && '👤'}
                  {entity.type === 'company' && '🏢'}
                  {entity.type === 'industry' && '🏭'}
                  {entity.type === 'other' && '📋'}
                </span>
                {entity.name}
                {entity.primaryUrl && (
                  <a 
                    href={entity.primaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </Badge>
            </div>
          ) : (
            <Button 
              onClick={() => setIsEntityDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              🔍 Identify Entity
            </Button>
          )}
        </div>
      </div>


      {/* Actions Section */}
      <div className="flex justify-end gap-2 mb-6">
        <Link href={`/reports/${params.id}/quotes`}>
          <Button variant="outline" className="flex items-center gap-2">
            📚 View Quotes
          </Button>
        </Link>
        <Button 
          onClick={() => setIsAddQuoteOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Quote
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 prose max-w-none">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Report Content</h2>
            <p>{reportData.content}</p>
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <SourcesSection 
            reportId={params.id} 
            clientId={reportData.clientId}
          />
          <EntitiesSection 
            reportId={params.id} 
            clientId={reportData.clientId}
          />
        </div>
      </div>

      <ConfirmEntityDialog
        open={isEntityDialogOpen}
        onOpenChange={setIsEntityDialogOpen}
        reportId={params.id}
        reportTitle={reportData.title}
      />

      <AddQuoteDialog
        reportId={params.id}
        clientId={reportData.clientId}
        open={isAddQuoteOpen}
        onOpenChange={setIsAddQuoteOpen}
      />
    </main>
  );
}