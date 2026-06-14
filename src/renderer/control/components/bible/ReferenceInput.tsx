import { useEffect, useRef, useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { api } from '../../lib/api'
import Badge from '../ui/Badge'
import type { ParsedReference } from '@shared/types'

interface Props {
  onResolved: (ref: ParsedReference) => void
  fillValue?: string | null
}

export default function ReferenceInput({ onResolved, fillValue }: Props): React.JSX.Element {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<'idle' | 'valid' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  useEffect(() => {
    if (!fillValue) return
    setValue(fillValue)
    setStatus('idle')
    inputRef.current?.focus()
  }, [fillValue])

  useEffect(() => {
    const trimmed = value.trim()
    if (!trimmed) { setStatus('idle'); return }
    const timer = setTimeout(async () => {
      const parsed = await api.bible.parseReference(trimmed)
      if (parsed.success) {
        setStatus('valid')
        onResolvedRef.current(parsed.data)
      } else {
        setStatus('error')
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [value])

  const resolve = async (): Promise<void> => {
    const trimmed = value.trim()
    if (!trimmed) return
    const parsed = await api.bible.parseReference(trimmed)
    if (!parsed.success) { setStatus('error'); return }
    setStatus('valid')
    onResolved(parsed.data)
  }

  const clear = (): void => {
    setValue('')
    setStatus('idle')
    inputRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') resolve()
    if (e.key === 'Escape') clear()
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <BookOpen className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-outline" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); setStatus('idle') }}
          onKeyDown={onKeyDown}
          placeholder="Juan 3:16  ·  Sal 23  ·  Gn 1:1-3"
          className="w-full border border-outline-variant/40 bg-surface-container py-2 pl-9 pr-8 text-base text-on-surface placeholder:text-outline/60 transition-colors font-body focus:border-primary focus:outline-none"
        />
        {value && (
          <button
            onClick={clear}
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-on-surface"
            title="Limpiar"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {status === 'valid' && <Badge variant="approved">Validado</Badge>}
      {status === 'error' && <Badge variant="rejected">No encontrado</Badge>}
    </div>
  )
}
