import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QuoteDrawer } from '../app/portal/clients/[cid]/reports/[rid]/_components/QuoteDrawer';

const mockQuoteWithAuthorAndDate = {
  id: '1',
  shortText: 'This is a test quote with author and date',
  text: 'This is the full text of the test quote with author and date information',
  author: 'Test Author Name',
  date: 'May 2025',
  sourceUrl: 'https://example.com',
  createdAt: new Date().toISOString(),
  status: 'Published' as const
};

const mockQuoteWithoutDate = {
  id: '2',
  shortText: 'This is a test quote without date',
  text: 'This is the full text of the test quote without date',
  author: 'Another Author',
  sourceUrl: 'https://example.org',
  createdAt: new Date().toISOString(),
  status: 'Published' as const
};

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => {
      const { children, className, ...otherProps } = props;
      return (
        <div className={className} data-testid="motion-div" {...otherProps}>
          {children}
        </div>
      );
    }
  },
  AnimatePresence: (props: any) => <>{props.children}</>
}));

describe('QuoteDrawer Author and Date Display', () => {
  it('should display author in h1 with correct styling', () => {
    const mockProps = {
      open: true,
      onOpenChange: vi.fn(),
      quote: mockQuoteWithAuthorAndDate,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    const authorHeading = screen.getByRole('heading', { level: 1 });
    expect(authorHeading).toBeInTheDocument();
    expect(authorHeading).toHaveTextContent('Test Author Name');
    expect(authorHeading).toHaveClass('font-serif', 'text-[20px]', 'md:text-[24px]', 'text-gray-100');
  });

  it('should display date with correct styling', () => {
    const mockProps = {
      open: true,
      onOpenChange: vi.fn(),
      quote: mockQuoteWithAuthorAndDate,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    const dateElement = screen.getByText('May 2025');
    expect(dateElement).toBeInTheDocument();
    expect(dateElement).toHaveClass('text-[13px]', 'text-[color:var(--mymind-muted)]');
  });

  it('should display source URL using LinkPreviewMini', () => {
    const mockProps = {
      open: true,
      onOpenChange: vi.fn(),
      quote: mockQuoteWithAuthorAndDate,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('should handle quote without date gracefully', () => {
    const mockProps = {
      open: true,
      onOpenChange: vi.fn(),
      quote: mockQuoteWithoutDate,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    const authorHeading = screen.getByRole('heading', { level: 1 });
    expect(authorHeading).toBeInTheDocument();
    expect(authorHeading).toHaveTextContent('Another Author');
    
    // Date should not be present
    expect(screen.queryByText('May 2025')).not.toBeInTheDocument();
  });

  it('should handle quote without author gracefully', () => {
    const quoteWithoutAuthor = {
      ...mockQuoteWithAuthorAndDate,
      author: undefined
    };
    
    const mockProps = {
      open: true,
      onOpenChange: vi.fn(),
      quote: quoteWithoutAuthor,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    // Author heading should not be present
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    
    // Date should still be displayed if present
    expect(screen.getByText('May 2025')).toBeInTheDocument();
  });

  it('should reserve correct height for title block', () => {
    const mockProps = {
      open: true,
      onOpenChange: vi.fn(),
      quote: mockQuoteWithAuthorAndDate,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    const { container } = render(<QuoteDrawer {...mockProps} />);

    const titleBlock = container.querySelector('.h-20');
    expect(titleBlock).toBeInTheDocument();
    expect(titleBlock).toHaveClass('mb-6', 'flex', 'flex-col', 'justify-center');
  });

  it('should not display tags section', () => {
    const mockProps = {
      open: true,
      onOpenChange: vi.fn(),
      quote: mockQuoteWithAuthorAndDate,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    // Tags section should not exist
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });
});