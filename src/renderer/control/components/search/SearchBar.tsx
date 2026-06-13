import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useSongsStore } from '../../store/songsStore'

export default function SearchBar(): React.JSX.Element {
  const search = useSongsStore((s) => s.search)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce de 150 ms para no consultar en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      search(value)
    }, 150)
    return () => clearTimeout(t)
  }, [value, search])

  // Ctrl+F enfoca el buscador.
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

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar canción por título o cualquier frase de la letra…"
        className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pr-3 pl-10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
      />
    </div>
  )
}
