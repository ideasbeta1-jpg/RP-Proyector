import { useEffect, useRef, useState } from 'react'
import { Search, AlertCircle } from 'lucide-react'
import { api } from '../../lib/api'
import type { ParsedReference } from '@shared/types'

interface Props {
  onResolved: (ref: ParsedReference) => void
}

export default function ReferenceInput({ onResolved }: Props): React.JSX.Element {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  // Búsqueda automática con debounce al escribir
  useEffect(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    const timer = setTimeout(async () => {
      const parsed = await api.bible.parseReference(trimmed)
      if (parsed.success) {
        setError(null)
        onResolvedRef.current(parsed.data)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [value])

  const resolve = async (): Promise<void> => {
    const trimmed = value.trim()
    if (!trimmed) return
    setError(null)
    const parsed = await api.bible.parseReference(trimmed)
    if (!parsed.success) {
      setError(parsed.error)
      return
    }
    onResolved(parsed.data)
  }

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') resolve()
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null) }}
          onKeyDown={onKeyDown}
          placeholder="Juan 3:16  ·  Sal 23  ·  Gn 1:1-3"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pr-3 pl-8 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
