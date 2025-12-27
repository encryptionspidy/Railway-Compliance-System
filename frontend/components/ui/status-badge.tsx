import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'ok' | 'dueSoon' | 'overdue';
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const styles = {
    ok: 'bg-green-500/20 text-green-400 border-green-500/30',
    dueSoon: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    overdue: 'bg-destructive/20 text-destructive border-destructive/30',
  };

  const defaultLabels = {
    ok: 'OK',
    dueSoon: 'Due Soon',
    overdue: 'Overdue',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border',
        styles[status],
        className
      )}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full', {
          'bg-green-400': status === 'ok',
          'bg-amber-400': status === 'dueSoon',
          'bg-destructive': status === 'overdue',
        })}
      />
      {label || defaultLabels[status]}
    </span>
  );
}
