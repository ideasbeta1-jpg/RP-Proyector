import { useEffect, useRef, useState } from 'react'
import { BookOpen, Columns3, LayoutGrid, Search, Upload, X } from 'lucide-react'
import { api } from '../../lib/api'
import { useHistoryStore } from '../../store/historyStore'
import VersionSelector from './VersionSelector'
import VerseList from './VerseList'
import BookBrowser from './BookBrowser'
import VerseSearch from './VerseSearch'
import type { BibleBook, BibleVerse, ParsedReference } from '@shared/types'

type Mode = 'browser' | 'reference' | 'search'
type BrowserStyle = 'drilldown' | 'columns'

function loadBrowserStyle(): BrowserStyle {
  try {
    const stored = localStorage.getItem('bible-browser-style')
    if (stored === 'columns') return 'columns'
  } catch { /* ignore */ }
  return 'drilldown'
}

export default function BiblePanel(): React.JSX.Element {
  const [versionId, setVersionId] = useState<string>(
    () => { try { return localStorage.getItem('bible-default-version') ?? '' } catch { return '' } }
  )
  const [versionAbreviatura, setVersionAbreviatura] = useState('RVR1960')
  const [books, setBooks] = useState<BibleBook[]>([])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('browser')
  const [verses, setVerses] = useState<BibleVerse[]>([])
  const [currentRef, setCurrentRef] = useState<ParsedReference | null>(null)
  const [versesStatus, setVersesStatus] = useState<'idle' | 'loading' | 'empty'>('idle')
  const [browserStyle, setBrowserStyle] = useState<BrowserStyle>(loadBrowserStyle)
  const [importing, setImporting] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const { recentBible, clearBible } = useHistoryStore()

  const handleVersionChange = (id: string): void => {
    setVersionId(id)
    try { localStorage.setItem('bible-default-version', id) } catch { /* ignore */ }
  }

  useEffect(() => {
    api.bible.listBooks().then((res) => {
      if (res.success) setBooks(res.data)
    })
  }, [])

  useEffect(() => {
    if (!versionId) return
    api.bible.listVersions().then((res) => {
      if (res.success) {
        const v = res.data.find((x) => x.id === versionId)
        if (v) setVersionAbreviatura(v.abreviatura)
      }
    })
  }, [versionId])

  // Auto-detect mode from input content
  useEffect(() => {
    const trimmed = input.trim()
    if (!trimmed) {
      setMode('browser')
      setVerses([])
      setCurrentRef(null)
      return
    }
    if (!versionId) return

    const timer = setTimeout(async () => {
      const parsed = await api.bible.parseReference(trimmed)
      if (parsed.success) {
        setMode('reference')
        setVersesStatus('loading')
        const res = await api.bible.getReference(versionId, parsed.data)
        if (res.success) {
          setVerses(res.data)
          setCurrentRef(parsed.data)
          setVersesStatus(res.data.length === 0 ? 'empty' : 'idle')
        } else {
          setVerses([])
          setCurrentRef(null)
          setVersesStatus('empty')
        }
        return
      }
      // Not a valid reference — switch to full-text search
      if (trimmed.length >= 3) {
        setMode('search')
        setVerses([])
        setCurrentRef(null)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [input, versionId])

  const saveBrowserStyle = (style: BrowserStyle): void => {
    setBrowserStyle(style)
    try { localStorage.setItem('bible-browser-style', style) } catch { /* ignore */ }
  }

  const handleImport = async (): Promise<void> => {
    setImporting(true)
    try {
      const res = await api.bible.importLocalFile()
      if (res.success && res.data) {
        handleVersionChange(res.data.versionId)
        setRefreshToken((t) => t + 1)
      }
    } finally {
      setImporting(false)
    }
  }

  const fillInput = (value: string): void => {
    setInput(value)
    inputRef.current?.focus()
  }

  const stripVersion = (label: string): string => label.replace(/\s*\([^)]+\)\s*$/, '').trim()

  const nombreLibro = books.find((b) => b.numero === currentRef?.libro)?.nombre ?? ''

  const renderContent = (): React.ReactNode => {
    if (!versionId) {
      return (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <Upload className="mx-auto mb-3 size-8 text-outline/30" />
            <p className="mb-1 font-label text-[10px] uppercase tracking-widest text-outline">
              No hay versiones instaladas
            </p>
            <button
              onClick={handleImport}
              disabled={importing}
              className="mt-2 border border-outline-variant/40 bg-surface-container px-4 py-2 font-label text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
            >
              {importing ? 'Importando…' : 'Importar versión (JSON)'}
            </button>
          </div>
        </div>
      )
    }

    if (mode === 'browser') {
      return (
        <BookBrowser
          books={books}
          versionId={versionId}
          style={browserStyle}
          versionAbreviatura={versionAbreviatura}
          onChapterSelect={fillInput}
        />
      )
    }

    if (mode === 'search') {
      return (
        <VerseSearch
          query={input}
          versionId={versionId}
          versionAbreviatura={versionAbreviatura}
          onNavigate={fillInput}
        />
      )
    }

    // mode === 'reference'
    if (versesStatus === 'loading') {
      return (
        <div className="flex flex-1 items-center justify-center">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">
            Cargando…
          </span>
        </div>
      )
    }
    if (versesStatus === 'empty' || verses.length === 0) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">
            No se encontraron versículos
          </span>
        </div>
      )
    }
    return (
      <VerseList
        verses={verses}
        ref_={currentRef}
        versionAbreviatura={versionAbreviatura}
        nombreLibro={nombreLibro}
      />
    )
  }

  return (
    <div className="flex h-full flex-col gap-0 overflow-hidden">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-outline-variant/20 pb-3">
        <div>
          <p className="font-display font-semibold text-lg text-on-surface tracking-tight">Biblia</p>
          <p className="font-label text-[9px] uppercase tracking-widest text-outline mt-0.5">
            Versículos y referencias
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Browser style toggle */}
          {versionId && (
            <div className="flex border border-outline-variant/40">
              <button
                onClick={() => saveBrowserStyle('drilldown')}
                title="Explorar paso a paso"
                className={[
                  'p-1.5 transition-colors',
                  browserStyle === 'drilldown'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-container text-outline hover:text-on-surface'
                ].join(' ')}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => saveBrowserStyle('columns')}
                title="Explorar en columnas"
                className={[
                  'p-1.5 transition-colors',
                  browserStyle === 'columns'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-container text-outline hover:text-on-surface'
                ].join(' ')}
              >
                <Columns3 className="size-3.5" />
              </button>
            </div>
          )}
          <VersionSelector value={versionId} onChange={handleVersionChange} refreshToken={refreshToken} />
          <button
            onClick={handleImport}
            disabled={importing}
            title="Importar versión de la Biblia (JSON)"
            className="border border-outline-variant/40 bg-surface-container p-1.5 text-outline transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <Upload className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Unified smart input */}
      <div className="mb-2">
        <div className="relative flex items-center">
          {mode === 'search' ? (
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-primary/60" />
          ) : (
            <BookOpen className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-outline" />
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Juan 3:16  ·  Sal 23  ·  o escribe para buscar..."
            className={[
              'w-full bg-surface-container border py-2 pl-9 pr-8 text-base text-on-surface placeholder:text-outline/60 focus:outline-none transition-colors font-body',
              mode === 'search'
                ? 'border-primary/40 focus:border-primary'
                : 'border-outline-variant/40 focus:border-primary'
            ].join(' ')}
          />
          {input && (
            <button
              onClick={() => setInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline/60 transition-colors hover:text-outline"
              title="Limpiar"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* History chips — visible when browsing or viewing a reference */}
      {recentBible.length > 0 && mode !== 'search' && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {recentBible.map((item) => (
            <button
              key={item.label}
              onClick={() => fillInput(stripVersion(item.label))}
              title={item.label}
              className="font-label rounded-none border border-outline-variant/40 bg-surface-container px-2 py-1 text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
            >
              {stripVersion(item.label)}
            </button>
          ))}
          <button
            onClick={clearBible}
            title="Limpiar historial"
            className="ml-auto text-outline/50 transition-colors hover:text-outline"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  )
}
