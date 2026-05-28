/** デバッグシートの開閉状態を表示し、クリックで切り替える小さなフローティングボタン。 */
export interface DebugFabProps {
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly className?: string;
}

/** デバッグ機能の ON/OFF を切り替えるフローティングボタン。 */
export const DebugFab = ({ open, onToggle, className }: DebugFabProps): React.JSX.Element => {
  const root = [
    'h-10 px-3 rounded-full shadow-lg shadow-black/30',
    'text-xs font-semibold tracking-wide',
    'inline-flex items-center gap-1.5',
    'transition-colors backdrop-blur-md',
    open
      ? 'bg-amber-500 text-zinc-900 ring-1 ring-amber-300'
      : 'bg-zinc-900/85 text-zinc-100 ring-1 ring-white/10',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" aria-pressed={open} onClick={onToggle} className={root}>
      <svg aria-hidden width="14" height="14" viewBox="0 0 20 20" fill="none">
        <title>debug</title>
        <path
          d="M3 17l4-4 4 4 6-6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Debug</span>
    </button>
  );
};
