type BadgeVariant = 'approved' | 'pending' | 'rejected' | 'live' | 'neutral'

interface Props {
  variant?: BadgeVariant
  children: React.ReactNode
  pulse?: boolean
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  approved: 'bg-primary/20 text-primary border border-primary/30',
  pending:  'bg-surface-container-high text-on-surface-variant border border-outline-variant',
  rejected: 'bg-error-container/30 text-error border border-error/20',
  live:     'bg-primary text-on-primary',
  neutral:  'bg-surface-container text-on-surface-variant border border-outline-variant'
}

export default function Badge({ variant = 'neutral', children, pulse, className = '' }: Props): React.JSX.Element {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5',
        'font-label text-[10px] uppercase tracking-widest',
        variants[variant],
        className
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {pulse && (
        <span className="live-pulse inline-block size-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  )
}
