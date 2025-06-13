'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { ArrowLeft, Search, ExternalLink, Share2, Check, Settings } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { ConfirmEntityDialog } from './_components/ConfirmEntityDialog';
import { ModerationView } from './_components/ModerationView';
import { EntitiesSection } from './_components/EntitiesSection';
import { Toaster } from '@/components/ui/toaster';
import type { SourceMeta } from '@research-os/db/source';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ReportDetailPageProps {
  params: { id: string };
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isModerationOpen, setIsModerationOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Meta/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
      
      // M to open moderation view
      if (e.key === 'm' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsModerationOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        <Button
          onClick={() => setIsModerationOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Moderate
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
          <EntitiesSection 
            reportId={params.id} 
            clientId={reportData.clientId}
          />
        </div>
      </div>

      {/* Dialogs and Sheets */}
      <ConfirmEntityDialog
        open={isEntityDialogOpen}
        onOpenChange={setIsEntityDialogOpen}
        reportId={params.id}
        reportTitle={reportData.title}
      />

      <ModerationView
        reportId={params.id}
        clientId={reportData.clientId}
        open={isModerationOpen}
        onOpenChange={setIsModerationOpen}
      />


      {/* Command Palette */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command..." />
        <CommandList>
          <CommandEmpty>No commands found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => {
              setIsModerationOpen(true);
              setIsCommandOpen(false);
            }}>
              <Settings className="h-4 w-4 mr-2" />
              Open Moderation Panel
            </CommandItem>
            <CommandItem onSelect={() => {
              window.location.href = `/reports/${params.id}/quotes`;
              setIsCommandOpen(false);
            }}>
              View All Quotes
            </CommandItem>
            <CommandItem onSelect={() => {
              handleCopyPortalLink();
              setIsCommandOpen(false);
            }}>
              <Share2 className="h-4 w-4 mr-2" />
              Copy Portal Link
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Toaster />
    </main>
  );
}