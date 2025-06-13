import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import ReportDetailPage from '../app/reports/[id]/page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/reports/test-id',
}));

// Mock fetch
global.fetch = vi.fn();

const mockSources = [
  {
    id: 'source-1',
    title: 'Test Source 1',
    url: 'https://example.com/source1',
    type: 'article',
    status: 'pending',
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'source-2',
    title: 'Test Source 2',
    url: 'https://example.com/source2',
    type: 'video',
    status: 'published',
    createdAt: '2023-01-02T00:00:00Z',
  },
];

const mockReport = {
  id: 'test-id',
  title: 'Test Report',
  content: 'Test content',
  clientId: 'client-1',
  clientName: 'Test Client',
};

const renderWithSWR = (component: React.ReactElement) => {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      {component}
    </SWRConfig>
  );
};

describe('Report Sources UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default fetch responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/reports/test-id/sources')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSources),
        });
      }
      if (url.includes('/api/reports/test-id')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReport),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      });
    });
  });

  it('renders report page with sources count', async () => {
    renderWithSWR(<ReportDetailPage params={{ id: 'test-id' }} />);

    expect(screen.getByText('Test Report')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Sources')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Sources count badge
    });
  });

  it('displays sources with correct count', async () => {
    renderWithSWR(<ReportDetailPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('Test Source 1')).toBeInTheDocument();
      expect(screen.getByText('Test Source 2')).toBeInTheDocument();
    });
  });

  it('shows status chips for sources', async () => {
    renderWithSWR(<ReportDetailPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('published')).toBeInTheDocument();
    });
  });

  it('opens source drawer when source is clicked', async () => {
    renderWithSWR(<ReportDetailPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      const sourceCard = screen.getByText('Test Source 1').closest('div');
      fireEvent.click(sourceCard!);
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens moderation sheet when moderate button is clicked', async () => {
    renderWithSWR(<ReportDetailPage params={{ id: 'test-id' }} />);

    const moderateButton = screen.getByText('Moderate');
    fireEvent.click(moderateButton);

    await waitFor(() => {
      expect(screen.getByText('Moderation Panel')).toBeInTheDocument();
    });
  });

  it('opens command palette with Meta+K shortcut', async () => {
    renderWithSWR(<ReportDetailPage params={{ id: 'test-id' }} />);

    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search sources...')).toBeInTheDocument();
    });
  });

  it('handles source selection with checkboxes', async () => {
    renderWithSWR(<ReportDetailPage params={{ id: 'test-id' }} />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
    });

    // Verify checkbox is checked
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
    });
  });

  it('updates source status without page reload', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      
      if (url.includes('/api/reports/test-id/sources')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSources),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReport),
      });
    });

    renderWithSWR(<ReportDetailPage params={{ id: 'test-id' }} />);

    // Open moderation sheet
    const moderateButton = screen.getByText('Moderate');
    fireEvent.click(moderateButton);

    await waitFor(() => {
      expect(screen.getByText('Moderation Panel')).toBeInTheDocument();
    });

    // Select a source and approve it
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
    });

    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);

    // Verify the PATCH request was made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sources/source-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' }),
        })
      );
    });
  });
});