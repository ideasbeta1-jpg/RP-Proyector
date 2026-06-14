import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-fixed-dim active:scale-[0.98] font-semibold',
  secondary:
    'bg-transparent border border-primary text-primary hover:bg-primary/10 active:scale-[0.98] font-medium',
  ghost:
    'bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface active:scale-[0.98] font-medium',
  danger:
    'bg-error-container text-on-error-container hover:bg-error/20 active:scale-[0.98] font-medium'
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs tracking-wide',
  md: 'px-4 py-2 text-xs tracking-wider',
  lg: 'px-6 py-3 text-sm tracking-widest'
}

export default function Button({
  variant = 'ghost',
  size = 'md',
  children,
  fullWidth,
  className = '',
  disabled,
  ...props
}: Props): React.JSX.Element {
  return (
    <button
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 transition-all',
        'font-label uppercase tracking-wider',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
