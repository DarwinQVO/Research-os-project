import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QuoteDrawer } from '../app/portal/clients/[cid]/reports/[rid]/_components/QuoteDrawer';

const mockQuote = {
  id: '1',
  shortText: 'This is a test quote',
  text: 'This is the full text of the test quote',
  author: 'Test Author',
  sourceUrl: 'https://example.com',
  tags: ['test', 'animation'],
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

describe('QuoteDrawer Animation', () => {
  it('should render drawer when open', () => {
    const mockProps = {
      open: true,
      onOpenChange: vi.fn(),
      quote: mockQuote,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    expect(screen.getByText('This is the full text of the test quote')).toBeInTheDocument();
    expect(screen.getByText('Quote Details')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('should not render drawer when closed', () => {
    const mockProps = {
      open: false,
      onOpenChange: vi.fn(),
      quote: mockQuote,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    expect(screen.queryByText('This is the full text of the test quote')).not.toBeInTheDocument();
    expect(screen.queryByText('Quote Details')).not.toBeInTheDocument();
  });

  it('should call onOpenChange when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();
    
    const mockProps = {
      open: true,
      onOpenChange: mockOnOpenChange,
      quote: mockQuote,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    const backdrop = screen.getAllByTestId('motion-div')[0]; // First motion div is the backdrop
    await user.click(backdrop);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should call onOpenChange when close button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();
    
    const mockProps = {
      open: true,
      onOpenChange: mockOnOpenChange,
      quote: mockQuote,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    const mockOnNext = vi.fn();
    const mockOnPrevious = vi.fn();
    const mockOnOpenChange = vi.fn();
    
    const mockProps = {
      open: true,
      onOpenChange: mockOnOpenChange,
      quote: mockQuote,
      onPrevious: mockOnPrevious,
      onNext: mockOnNext,
      hasPrevious: true,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    // Test Escape key
    await user.keyboard('{Escape}');
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);

    // Test Arrow keys (need to focus the document first)
    document.body.focus();
    await user.keyboard('{ArrowLeft}');
    expect(mockOnPrevious).toHaveBeenCalled();

    await user.keyboard('{ArrowRight}');
    expect(mockOnNext).toHaveBeenCalled();
  });

  it('should display quote tags when present', () => {
    const mockProps = {
      open: true,
      onOpenChange: vi.fn(),
      quote: mockQuote,
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      hasPrevious: false,
      hasNext: true
    };

    render(<QuoteDrawer {...mockProps} />);

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('animation')).toBeInTheDocument();
  });
});