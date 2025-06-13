import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportQuotesPage from '../app/reports/[id]/quotes/page';
import { SWRConfig } from 'swr';

// Mock the modules
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('../app/reports/[id]/_components/ResearcherQuoteCard', () => ({
  ResearcherQuoteCard: ({ quote, onStatusChange }: any) => (
    <div data-testid={`quote-${quote.id}`}>
      <p>{quote.shortText}</p>
      <button onClick={() => onStatusChange('Published')}>Publish</button>
      <button onClick={() => onStatusChange('Approved')}>Approve</button>
      <button onClick={() => onStatusChange('Pending')}>Pending</button>
    </div>
  ),
}));

vi.mock('../app/portal/clients/[cid]/reports/[rid]/_components/QuoteDrawer', () => ({
  QuoteDrawer: ({ open }: any) => open ? <div>Quote Drawer</div> : null,
}));

vi.mock('../app/reports/[id]/_components/AddQuoteDialog', () => ({
  AddQuoteDialog: ({ open }: any) => open ? <div>Add Quote Dialog</div> : null,
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Quote Optimistic UI', () => {
  const mockReport = {
    id: 'report-123',
    title: 'Test Report',
    clientId: 'client-123',
  };

  const mockApprovedQuote = {
    id: 'quote-1',
    shortText: 'This is an approved quote',
    isPublic: false,
    isApproved: true,
    createdAt: new Date().toISOString(),
  };

  const mockPendingQuote = {
    id: 'quote-2',
    shortText: 'This is a pending quote',
    isPublic: false,
    isApproved: false,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock report endpoint
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/reports/report-123')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockReport,
        });
      }
      
      // Mock quotes endpoints with status filtering
      if (url.includes('status=published')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      
      if (url.includes('status=approved')) {
        return Promise.resolve({
          ok: true,
          json: async () => [mockApprovedQuote],
        });
      }
      
      if (url.includes('status=pending')) {
        return Promise.resolve({
          ok: true,
          json: async () => [mockPendingQuote],
        });
      }
      
      // Mock PATCH endpoint for status update
      if (url.includes('PATCH')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });
  });

  it('should optimistically update quote status from Approved to Published', async () => {
    const { container } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <ReportQuotesPage params={{ id: 'report-123' }} />
      </SWRConfig>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Quotes')).toBeInTheDocument();
    });

    // Click on Approved tab
    const approvedTab = screen.getByRole('tab', { name: /Approved/i });
    fireEvent.click(approvedTab);

    // Wait for approved quotes to render
    await waitFor(() => {
      expect(screen.getByTestId('quote-1')).toBeInTheDocument();
    });

    // Click Publish button
    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    // Quote should immediately disappear from Approved tab (optimistic update)
    await waitFor(() => {
      expect(screen.queryByTestId('quote-1')).not.toBeInTheDocument();
    });

    // Verify the PATCH request was made
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/clients/client-123/reports/report-123/quotes/quote-1'),
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: true, isApproved: true }),
      })
    );
  });

  it('should stay on current tab when changing quote status', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <ReportQuotesPage params={{ id: 'report-123' }} />
      </SWRConfig>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Quotes')).toBeInTheDocument();
    });

    // Click on Pending tab
    const pendingTab = screen.getByRole('tab', { name: /Pending/i });
    fireEvent.click(pendingTab);

    // Verify we're on Pending tab
    await waitFor(() => {
      expect(pendingTab).toHaveAttribute('aria-selected', 'true');
    });

    // Wait for pending quote to render
    await waitFor(() => {
      expect(screen.getByTestId('quote-2')).toBeInTheDocument();
    });

    // Click Approve button
    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);

    // Should still be on Pending tab
    expect(pendingTab).toHaveAttribute('aria-selected', 'true');
    
    // Quote should disappear from Pending tab
    await waitFor(() => {
      expect(screen.queryByTestId('quote-2')).not.toBeInTheDocument();
    });
  });

  it('should revert optimistic update on API error', async () => {
    // Mock API to fail
    mockFetch.mockImplementationOnce((url: string) => {
      if (url.includes('PATCH')) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [mockApprovedQuote],
      });
    });

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <ReportQuotesPage params={{ id: 'report-123' }} />
      </SWRConfig>
    );

    // Navigate to Approved tab
    const approvedTab = screen.getByRole('tab', { name: /Approved/i });
    fireEvent.click(approvedTab);

    // Wait for quote to appear
    await waitFor(() => {
      expect(screen.getByTestId('quote-1')).toBeInTheDocument();
    });

    // Try to publish (will fail)
    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    // Quote should briefly disappear then reappear after error
    await waitFor(() => {
      expect(screen.queryByTestId('quote-1')).not.toBeInTheDocument();
    });

    // After error, quote should reappear (revert)
    await waitFor(() => {
      expect(screen.getByTestId('quote-1')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});