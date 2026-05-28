import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Segmented } from './Segmented';

const ITEMS = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
  { id: 'three', label: 'Three' },
] as const;

describe('Segmented', () => {
  it('renders one option per item with the given labels', () => {
    render(<Segmented items={ITEMS} value="one" onChange={() => {}} ariaLabel="picker" />);
    expect(screen.getByRole('radio', { name: 'One' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Two' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Three' })).toBeInTheDocument();
  });

  it('marks the active option as checked (radio role)', () => {
    render(<Segmented items={ITEMS} value="two" onChange={() => {}} ariaLabel="picker" />);
    expect(screen.getByRole('radio', { name: 'Two' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'One' })).not.toBeChecked();
  });

  it('clicking a non-active option fires onChange with its id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented items={ITEMS} value="one" onChange={onChange} ariaLabel="picker" />);
    await user.click(screen.getByRole('radio', { name: 'Three' }));
    expect(onChange).toHaveBeenCalledWith('three');
  });

  it('exposes role="tab" / aria-selected when role="tab" is set', () => {
    render(<Segmented items={ITEMS} value="two" onChange={() => {}} role="tab" ariaLabel="tabs" />);
    expect(screen.getByRole('tablist', { name: 'tabs' })).toBeInTheDocument();
    const active = screen.getByRole('tab', { name: 'Two' });
    expect(active).toHaveAttribute('aria-selected', 'true');
    const other = screen.getByRole('tab', { name: 'One' });
    expect(other).toHaveAttribute('aria-selected', 'false');
  });

  it('exposes role="radiogroup" when role="radio" (default)', () => {
    render(<Segmented items={ITEMS} value="one" onChange={() => {}} ariaLabel="picker" />);
    expect(screen.getByRole('radiogroup', { name: 'picker' })).toBeInTheDocument();
  });

  it('disabled items do not invoke onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const items = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', disabled: true },
    ] as const;
    render(<Segmented items={items} value="a" onChange={onChange} ariaLabel="x" />);
    await user.click(screen.getByRole('radio', { name: 'B' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts a className override on the container', () => {
    const { container } = render(
      <Segmented items={ITEMS} value="one" onChange={() => {}} ariaLabel="x" className="my-x" />,
    );
    expect(container.firstChild).toHaveClass('my-x');
  });

  it('size="sm" applies a smaller layout token (visible via class)', () => {
    render(<Segmented items={ITEMS} value="one" onChange={() => {}} size="sm" ariaLabel="x" />);
    const btn = screen.getByRole('radio', { name: 'One' });
    expect(btn.className).toContain('min-h-[36px]');
  });

  it('size="md" (default) uses the larger layout token', () => {
    render(<Segmented items={ITEMS} value="one" onChange={() => {}} ariaLabel="x" />);
    const btn = screen.getByRole('radio', { name: 'One' });
    expect(btn.className).toContain('min-h-[44px]');
  });
});
