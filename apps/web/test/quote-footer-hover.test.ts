import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { QuoteCard } from '../app/portal/clients/[cid]/reports/[rid]/_components/QuoteCard';

const mockQuote = {
  id: '1',
  shortText: 'This is a test quote',
  author: 'Test Author',
  sourceUrl: 'https://example.com',
  tags: ['test'],
  createdAt: new Date().toISOString()
};

describe('QuoteCard Footer Hover', () => {
  it('should have correct hover classes applied', () => {
    const mockOnClick = vi.fn();
    
    render(
      <QuoteCard 
        quote={mockQuote} 
        onClick={mockOnClick} 
      />
    );

    const card = screen.getByText('This is a test quote').closest('div');
    const footer = screen.getByRole('contentinfo');
    
    // Card should have group class for hover effects
    expect(card).toHaveClass('group');
    
    // Footer should have correct hover classes
    expect(footer).toHaveClass('opacity-0', 'group-hover:opacity-100');
  });

  it('should display author and source in footer', () => {
    const mockOnClick = vi.fn();
    
    render(
      <QuoteCard 
        quote={mockQuote} 
        onClick={mockOnClick} 
      />
    );

    expect(screen.getByText(/— Test Author/)).toBeInTheDocument();
    expect(screen.getByText('example.com')).toBeInTheDocument();
  });

  it('should handle quote without author gracefully', () => {
    const quoteWithoutAuthor = { ...mockQuote, author: undefined };
    const mockOnClick = vi.fn();
    
    render(
      <QuoteCard 
        quote={quoteWithoutAuthor} 
        onClick={mockOnClick} 
      />
    );

    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('should call onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();
    
    render(
      <QuoteCard 
        quote={mockQuote} 
        onClick={mockOnClick} 
      />
    );

    const card = screen.getByText('This is a test quote').closest('div');
    await user.click(card!);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});