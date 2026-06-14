import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useSongsStore } from '../../store/songsStore'

export default function SearchBar(): React.JSX.Element {
  const search = useSongsStore((s) => s.search)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => { search(value) }, 150)
    return () => clearTimeout(t)
  }, [value, search])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const clear = (): void => {
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-outline" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar canción…"
        className="w-full border border-outline-variant/40 bg-surface-container py-2 pl-9 pr-8 text-base text-on-surface placeholder:text-outline transition-colors font-body focus:border-primary focus:outline-none"
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
  )
}
