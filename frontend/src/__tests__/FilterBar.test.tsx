import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '../components/common/FilterBar';

describe('FilterBar Component', () => {
  it('handles input text changes', () => {
    const handleSearchChange = vi.fn();
    render(
      <FilterBar
        searchQuery=""
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search corridors..."
      />
    );

    const input = screen.getByPlaceholderText('Search corridors...');
    fireEvent.change(input, { target: { value: 'Hinjewadi' } });
    expect(handleSearchChange).toHaveBeenCalledWith('Hinjewadi');
  });

  it('triggers time window selection button click', () => {
    const handleTimeChange = vi.fn();
    render(
      <FilterBar
        searchQuery=""
        onSearchChange={() => {}}
        timeWindow="24h"
        onTimeWindowChange={handleTimeChange}
      />
    );

    const btn7d = screen.getByText('7d');
    fireEvent.click(btn7d);
    expect(handleTimeChange).toHaveBeenCalledWith('7d');
  });

  it('invokes onReset handler when reset button is clicked', () => {
    const handleReset = vi.fn();
    render(
      <FilterBar
        searchQuery="Ashland"
        onSearchChange={() => {}}
        onReset={handleReset}
      />
    );

    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
