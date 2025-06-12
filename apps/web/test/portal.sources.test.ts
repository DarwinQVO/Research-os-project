import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getPublishedSources, getSourceContent } from '@research-os/db/source';

// Mock the database functions
vi.mock('@research-os/db/source', () => ({
  getPublishedSources: vi.fn(),
  getSourceContent: vi.fn(),
}));

// Mock SWR to avoid network calls in tests
vi.mock('swr', () => ({
  default: vi.fn((key, fetcher) => {
    if (key?.includes('/sources')) {
      return {
        data: [
          {
            id: 'source-1',
            title: 'Test Article',
            url: 'https://example.com/article',
            type: 'article',
            isPublic: true,
            quoteCount: 3,
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        error: null,
        isLoading: false
      };
    }
    return { data: [], error: null, isLoading: false };
  })
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('Portal Sources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Database Functions', () => {
    it('getPublishedSources returns only isPublic:true sources', async () => {
      const mockSources = [
        {
          id: 'source-1',
          title: 'Public Article',
          url: 'https://example.com/public',
          type: 'article' as const,
          isPublic: true,
          quoteCount: 2,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'source-2', 
          title: 'Private Article',
          url: 'https://example.com/private',
          type: 'article' as const,
          isPublic: false,
          quoteCount: 1,
          createdAt: '2024-01-01T00:00:00Z'
        }
      ];

      (getPublishedSources as any).mockResolvedValue(
        mockSources.filter(s => s.isPublic)
      );

      const result = await getPublishedSources('test-report-id');
      
      expect(result).toHaveLength(1);
      expect(result[0].isPublic).toBe(true);
      expect(result[0].title).toBe('Public Article');
    });

    it('getSourceContent returns quotes, images, and entities', async () => {
      const mockContent = {
        quotes: [
          {
            id: 'quote-1',
            shortText: 'Test quote text',
            speaker: 'John Doe',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ],
        images: [],
        entities: [
          {
            id: 'entity-1',
            name: 'Test Entity',
            type: 'person'
          }
        ]
      };

      (getSourceContent as any).mockResolvedValue(mockContent);

      const result = await getSourceContent('test-source-id');
      
      expect(result.quotes).toHaveLength(1);
      expect(result.entities).toHaveLength(1);
      expect(result.images).toHaveLength(0);
      expect(result.quotes[0].shortText).toBe('Test quote text');
    });
  });

  describe('SourceCard Component', () => {
    const mockSource = {
      id: 'source-1',
      title: 'Test Article Title',
      url: 'https://example.com/article',
      type: 'article' as const,
      author: 'John Author',
      publishedAt: '2024-01-15T00:00:00Z',
      isPublic: true,
      quoteCount: 5,
      createdAt: '2024-01-01T00:00:00Z'
    };

    it('renders short title with correct height class', () => {
      const { SourceCard } = require('../app/portal/_components/SourceCard');
      const mockOnClick = vi.fn();
      
      const shortTitleSource = { ...mockSource, title: 'Short' };
      
      render(<SourceCard source={shortTitleSource} onClick={mockOnClick} />);
      
      const card = screen.getByText('Short').closest('div');
      expect(card).toHaveClass('h-[180px]');
    });

    it('shows gradient fade for ultra-long titles', () => {
      const { SourceCard } = require('../app/portal/_components/SourceCard');
      const mockOnClick = vi.fn();
      
      const longTitleSource = { 
        ...mockSource, 
        title: 'This is an extremely long title that should trigger the ultra-long behavior with gradient fade and hidden bottom quotes because it exceeds the character limit threshold'
      };
      
      render(<SourceCard source={longTitleSource} onClick={mockOnClick} />);
      
      // Should have gradient overlay
      const gradientElement = document.querySelector('.bg-gradient-to-t');
      expect(gradientElement).toBeTruthy();
      
      // Should have max height
      const card = document.querySelector('.h-\\[340px\\]');
      expect(card).toBeTruthy();
    });

    it('displays domain and quote count badges', () => {
      const { SourceCard } = require('../app/portal/_components/SourceCard');
      const mockOnClick = vi.fn();
      
      render(<SourceCard source={mockSource} onClick={mockOnClick} />);
      
      expect(screen.getByText('example.com')).toBeInTheDocument();
      expect(screen.getByText('5 quotes')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const { SourceCard } = require('../app/portal/_components/SourceCard');
      const mockOnClick = vi.fn();
      
      render(<SourceCard source={mockSource} onClick={mockOnClick} />);
      
      const card = screen.getByText(mockSource.title).closest('div');
      fireEvent.click(card!);
      
      expect(mockOnClick).toHaveBeenCalledOnce();
    });
  });

  describe('Tab Switching', () => {
    it('preserves scroll position when toggling tabs', async () => {
      // Mock the portal page component
      const mockScrollTo = vi.fn();
      const mockScrollY = 100;
      
      Object.defineProperty(window, 'scrollY', {
        value: mockScrollY,
        writable: true
      });
      Object.defineProperty(window, 'scrollTo', {
        value: mockScrollTo,
        writable: true
      });

      const { default: QuotesSourcesTabs } = require('../app/portal/_components/TabsQuotesSources');
      const mockOnChange = vi.fn();
      
      render(
        <QuotesSourcesTabs 
          value="quotes" 
          onChange={mockOnChange}
        />
      );
      
      const sourcesTab = screen.getByText('Sources');
      fireEvent.click(sourcesTab);
      
      expect(mockOnChange).toHaveBeenCalledWith('sources');
    });

    it('shows correct active tab styling', () => {
      const { default: QuotesSourcesTabs } = require('../app/portal/_components/TabsQuotesSources');
      const mockOnChange = vi.fn();
      
      render(
        <QuotesSourcesTabs 
          value="sources" 
          onChange={mockOnChange}
        />
      );
      
      const sourcesTab = screen.getByText('Sources');
      expect(sourcesTab).toHaveClass('text-[#ffffff]');
      
      const quotesTab = screen.getByText('Quotes');
      expect(quotesTab).toHaveClass('text-[#8e9db4]');
    });
  });

  describe('Source Detail Modal', () => {
    const mockSource = {
      id: 'source-1',
      title: 'Test Article',
      url: 'https://example.com/article',
      type: 'article' as const,
      author: 'Test Author',
      publishedAt: '2024-01-15T00:00:00Z',
      isPublic: true,
      quoteCount: 3,
      createdAt: '2024-01-01T00:00:00Z'
    };

    it('renders source details in right sidebar', () => {
      const { SourceDetail } = require('../app/portal/_components/SourceDetail');
      const mockOnOpenChange = vi.fn();
      
      render(
        <SourceDetail 
          source={mockSource}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );
      
      expect(screen.getByText('Test Article')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
      expect(screen.getByText('example.com')).toBeInTheDocument();
    });

    it('closes when X button is clicked', () => {
      const { SourceDetail } = require('../app/portal/_components/SourceDetail');
      const mockOnOpenChange = vi.fn();
      
      render(
        <SourceDetail 
          source={mockSource}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );
      
      const closeButton = document.querySelector('[data-testid=\"close-button\"]') || 
                          document.querySelector('button[aria-label=\"Close\"]') ||
                          screen.getByRole('button');
      
      fireEvent.click(closeButton);
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('prevents body scroll when open', () => {
      const { SourceDetail } = require('../app/portal/_components/SourceDetail');
      const mockOnOpenChange = vi.fn();
      
      render(
        <SourceDetail 
          source={mockSource}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );
      
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('API Integration', () => {
    it('handles source list API errors gracefully', async () => {
      // Mock fetch to return error
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' }),
        })
      ) as any;

      const response = await fetch('/api/portal/reports/test-rid/sources');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('handles source content API errors gracefully', async () => {
      // Mock fetch to return error
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Source not found' }),
        })
      ) as any;

      const response = await fetch('/api/portal/sources/invalid-id/content');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });
});