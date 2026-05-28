import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DebugFab } from './DebugFab';

describe('DebugFab', () => {
  it('renders with aria-pressed=false when closed', () => {
    render(<DebugFab open={false} onToggle={() => {}} />);
    const btn = screen.getByRole('button', { name: /debug/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('reflects aria-pressed=true when open', () => {
    render(<DebugFab open onToggle={() => {}} />);
    expect(screen.getByRole('button', { name: /debug/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('invokes onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<DebugFab open={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('button', { name: /debug/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('passes through className', () => {
    render(<DebugFab open={false} onToggle={() => {}} className="my-fab" />);
    expect(screen.getByRole('button', { name: /debug/i })).toHaveClass('my-fab');
  });
});
