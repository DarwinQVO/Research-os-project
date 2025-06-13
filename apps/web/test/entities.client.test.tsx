import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import EntitiesPage from '../app/portal/clients/[cid]/reports/[rid]/entities/page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/portal/clients/test-client/reports/test-report/entities',
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock fetch
global.fetch = vi.fn();

const mockEntities = [
  {
    id: 'entity-1',
    name: 'John Doe',
    type: 'person',
    status: 'published',
    description: 'CEO of Example Corp',
    avatarUrl: 'https://example.com/avatar1.jpg',
    primaryUrl: 'https://linkedin.com/in/johndoe',
    createdAt: '2023-01-01T00:00:00Z',
    quoteCount: 5,
    sourceCount: 3,
  },
  {
    id: 'entity-2',
    name: 'Example Corp',
    type: 'company',
    status: 'published',
    description: 'Leading technology company',
    primaryUrl: 'https://example.com',
    createdAt: '2023-01-02T00:00:00Z',
    quoteCount: 8,
    sourceCount: 5,
  },
];

const renderWithSWR = (component: React.ReactElement) => {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>
      {component}
    </SWRConfig>
  );
};

describe('EntitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockEntities)),
    });
  });

  it('renders published entities count', async () => {
    renderWithSWR(
      <EntitiesPage params={{ cid: 'test-client', rid: 'test-report' }} />
    );

    await waitFor(() => {
      expect(screen.getByText('Entity Library')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Example Corp')).toBeInTheDocument();
    });

    // Check that entities are displayed
    expect(screen.getByText('CEO of Example Corp')).toBeInTheDocument();
    expect(screen.getByText('Leading technology company')).toBeInTheDocument();
  });

  it('opens drawer and shows name + stats', async () => {
    // Mock entity content API
    const mockEntityContent = {
      quotes: [
        { id: 'quote-1', shortText: 'Test quote', sourceTitle: 'Example Source' }
      ],
      relatedEntities: [],
      sources: [
        { id: 'source-1', title: 'Example Source', url: 'https://example.com' }
      ]
    };

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockEntities)),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntityContent),
      });

    renderWithSWR(
      <EntitiesPage params={{ cid: 'test-client', rid: 'test-report' }} />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on entity to open drawer
    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getByText('Entity Details')).toBeInTheDocument();
    });

    // Check that entity name is displayed in drawer with correct styling
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('John Doe');
    
    // Check that stats are displayed
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Quotes count
    });
  });

  it('displays empty state when no entities', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify([])),
    });

    renderWithSWR(
      <EntitiesPage params={{ cid: 'test-client', rid: 'test-report' }} />
    );

    await waitFor(() => {
      expect(screen.getByText('No entities found')).toBeInTheDocument();
      expect(screen.getByText('This report doesn\'t have any published entities yet.')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithSWR(
      <EntitiesPage params={{ cid: 'test-client', rid: 'test-report' }} />
    );

    expect(screen.getByText('Loading entities...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    renderWithSWR(
      <EntitiesPage params={{ cid: 'test-client', rid: 'test-report' }} />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load entities')).toBeInTheDocument();
    });
  });

  it('fetches entities with correct API endpoint', async () => {
    renderWithSWR(
      <EntitiesPage params={{ cid: 'test-client', rid: 'test-report' }} />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/reports/test-report/entities?public=1');
    });
  });
});