import type { ReactNode } from 'react';

/** セグメント切り替えをタブとして扱うか、ラジオグループとして扱うかを指定する。 */
export type SegmentedRole = 'tab' | 'radio';

/** セグメントボタンの密度を指定する。 */
export type SegmentedSize = 'sm' | 'md';

/** Segmented に表示する 1 項目の定義。 */
export interface SegmentedItem<T extends string> {
  readonly id: T;
  readonly label: ReactNode;
  readonly disabled?: boolean;
}

/** 汎用セグメント切り替えコンポーネントの props。 */
export interface SegmentedProps<T extends string> {
  readonly items: readonly SegmentedItem<T>[];
  readonly value: T;
  readonly onChange: (next: T) => void;
  readonly role?: SegmentedRole;
  readonly size?: SegmentedSize;
  readonly ariaLabel: string;
  readonly className?: string;
}

const SIZE_CLS: Record<SegmentedSize, string> = {
  sm: 'min-h-[36px] px-2 text-xs',
  md: 'min-h-[44px] px-3 text-sm',
};

/** タブ / ラジオどちらの意味付けでも使える、選択肢の横並び切り替え UI。 */
export const Segmented = <T extends string>({
  items,
  value,
  onChange,
  role = 'radio',
  size = 'md',
  ariaLabel,
  className,
}: SegmentedProps<T>): React.JSX.Element => {
  const containerRole = role === 'tab' ? 'tablist' : 'radiogroup';
  const itemRole = role;

  const containerCls = ['inline-flex gap-1 p-1 rounded-md bg-[#f3edff]', className]
    .filter(Boolean)
    .join(' ');

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: dynamic role (tablist | radiogroup) both support aria-label
    <div role={containerRole} aria-label={ariaLabel} className={containerCls}>
      {items.map((item) => {
        const active = item.id === value;
        const ariaProps =
          role === 'tab'
            ? { 'aria-selected': active }
            : { 'aria-checked': active, 'aria-disabled': item.disabled };
        const itemCls = [
          SIZE_CLS[size],
          'inline-flex items-center justify-center whitespace-nowrap font-bold rounded-md transition cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd43d]',
          active
            ? 'bg-[#7c3aed] text-white shadow-sm'
            : 'text-[#312e81] hover:text-[#6d28d9] hover:bg-[#ede9fe]',
          item.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={item.id}
            type="button"
            role={itemRole}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) onChange(item.id);
            }}
            className={itemCls}
            {...ariaProps}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
