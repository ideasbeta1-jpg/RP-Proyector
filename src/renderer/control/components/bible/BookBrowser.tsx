import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { api } from '../../lib/api'
import { useProjectionStore } from '../../store/projectionStore'
import { CHAPTER_COUNTS } from './bibleConstants'
import type { BibleBook, BibleVerse } from '@shared/types'

const MIN_COLS = 3
const MAX_COLS = 6
const DEFAULT_COLS = 4
const GRID_COLS_KEY = 'bible-grid-cols'

function loadGridCols(): number {
  try {
    const n = parseInt(localStorage.getItem(GRID_COLS_KEY) ?? '', 10)
    if (n >= MIN_COLS && n <= MAX_COLS) return n
  } catch { /* ignore */ }
  return DEFAULT_COLS
}

interface Props {
  books: BibleBook[]
  versionId: string
  style: 'drilldown' | 'columns'
  versionAbreviatura: string
  onChapterSelect: (refString: string) => void
}

export default function BookBrowser({
  books,
  versionId,
  style,
  versionAbreviatura,
  onChapterSelect
}: Props): React.JSX.Element {
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [chapterVerses, setChapterVerses] = useState<BibleVerse[]>([])
  const [versesLoading, setVersesLoading] = useState(false)
  const [drillPhase, setDrillPhase] = useState<'books' | 'chapters'>('books')
  const [gridCols, setGridCols] = useState<number>(loadGridCols)

  const changeGridCols = (delta: number): void => {
    setGridCols((prev) => {
      const next = Math.min(MAX_COLS, Math.max(MIN_COLS, prev + delta))
      try { localStorage.setItem(GRID_COLS_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }

  const sendBible = useProjectionStore((s) => s.sendBible)

  const atBooks = books.filter((b) => b.testamento === 'AT')
  const ntBooks = books.filter((b) => b.testamento === 'NT')

  // Reset browser when version changes
  useEffect(() => {
    setSelectedBook(null)
    setSelectedChapter(null)
    setChapterVerses([])
    setDrillPhase('books')
  }, [versionId])

  // Load verses in columns mode when chapter is selected
  useEffect(() => {
    if (style !== 'columns' || !selectedBook || !selectedChapter || !versionId) return
    setVersesLoading(true)
    setChapterVerses([])
    api.bible.getChapter(versionId, selectedBook.numero, selectedChapter).then((res) => {
      if (res.success) setChapterVerses(res.data)
      setVersesLoading(false)
    })
  }, [style, selectedBook?.numero, selectedChapter, versionId])

  const selectBook = (book: BibleBook): void => {
    setSelectedBook(book)
    setSelectedChapter(null)
    setChapterVerses([])
    if (style === 'drilldown') setDrillPhase('chapters')
  }

  const selectChapter = (chapter: number): void => {
    setSelectedChapter(chapter)
    if (style === 'drilldown' && selectedBook) {
      onChapterSelect(`${selectedBook.nombre} ${chapter}`)
    }
  }

  const backToBooks = (): void => {
    setDrillPhase('books')
    setSelectedBook(null)
    setSelectedChapter(null)
    setChapterVerses([])
  }

  const projectVerse = (verse: BibleVerse): void => {
    if (!selectedBook) return
    const ref = `${selectedBook.nombre} ${verse.capitulo}:${verse.versiculo} (${versionAbreviatura})`
    sendBible({
      referencia: ref,
      versos: [{ numero: verse.versiculo, texto: verse.texto }],
      versionAbreviatura
    })
  }

  if (style === 'drilldown') {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {drillPhase === 'books' ? (
          <BooksGrid
            atBooks={atBooks}
            ntBooks={ntBooks}
            onSelect={selectBook}
            gridCols={gridCols}
            onGridColsChange={changeGridCols}
          />
        ) : (
          <ChaptersView book={selectedBook!} onBack={backToBooks} onSelect={selectChapter} />
        )}
      </div>
    )
  }

  // ── Columns mode ─────────────────────────────────────────────
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Books column */}
      <div className="w-32 shrink-0 overflow-y-auto border-r border-outline-variant/20">
        {books.map((book, i) => {
          const prev = books[i - 1]
          const divider = i > 0 && book.testamento !== prev?.testamento
          return (
            <div key={book.numero}>
              {divider && <div className="my-0.5 border-t border-outline-variant/30" />}
              <button
                onClick={() => selectBook(book)}
                title={book.nombre}
                className={[
                  'w-full border-l-2 px-2 py-2 text-left text-sm font-label tracking-wide transition-colors truncate',
                  selectedBook?.numero === book.numero
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'border-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                ].join(' ')}
              >
                {book.nombre}
              </button>
            </div>
          )
        })}
      </div>

      {/* Chapters column */}
      <div className="w-12 shrink-0 overflow-y-auto border-r border-outline-variant/20">
        {selectedBook ? (
          Array.from({ length: CHAPTER_COUNTS[selectedBook.numero] ?? 1 }, (_, i) => i + 1).map(
            (cap) => (
              <button
                key={cap}
                onClick={() => selectChapter(cap)}
                className={[
                  'w-full py-2 text-center text-xs font-label transition-colors',
                  selectedChapter === cap
                    ? 'bg-primary/8 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                ].join(' ')}
              >
                {cap}
              </button>
            )
          )
        ) : null}
      </div>

      {/* Verses column */}
      <div className="flex-1 overflow-y-auto">
        {versesLoading ? (
          <div className="flex h-16 items-center justify-center">
            <span className="font-label text-xs uppercase tracking-widest text-outline">
              Cargando…
            </span>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/10">
            {chapterVerses.map((verse) => (
              <li
                key={verse.versiculo}
                onClick={() => projectVerse(verse)}
                className="group flex cursor-pointer items-start gap-2.5 px-3 py-3 transition-colors hover:bg-surface-container-high"
              >
                <span className="mt-0.5 w-5 shrink-0 text-right text-xs font-label text-primary/50">
                  {verse.versiculo}
                </span>
                <span className="flex-1 text-base leading-relaxed text-on-surface-variant transition-colors group-hover:text-on-surface">
                  {verse.texto}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

const GRID_COLS_CLASS: Record<number, string> = {
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6'
}

function BooksGrid({
  atBooks,
  ntBooks,
  onSelect,
  gridCols,
  onGridColsChange
}: {
  atBooks: BibleBook[]
  ntBooks: BibleBook[]
  onSelect: (book: BibleBook) => void
  gridCols: number
  onGridColsChange: (delta: number) => void
}): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Column controls */}
      <div className="flex shrink-0 items-center justify-end gap-1 px-1 pb-1.5 pt-0.5">
        <span className="font-label text-[9px] uppercase tracking-widest text-outline">Columnas</span>
        <button
          onClick={() => onGridColsChange(-1)}
          disabled={gridCols <= MIN_COLS}
          className="flex size-5 items-center justify-center border border-outline-variant/40 bg-surface-container font-label text-xs text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          −
        </button>
        <span className="w-4 text-center font-label text-[10px] text-on-surface-variant">{gridCols}</span>
        <button
          onClick={() => onGridColsChange(1)}
          disabled={gridCols >= MAX_COLS}
          className="flex size-5 items-center justify-center border border-outline-variant/40 bg-surface-container font-label text-xs text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-2">
        <BookGroup label="Antiguo Testamento" books={atBooks} onSelect={onSelect} gridCols={gridCols} />
        <BookGroup label="Nuevo Testamento" books={ntBooks} onSelect={onSelect} gridCols={gridCols} />
      </div>
    </div>
  )
}

function BookGroup({
  label,
  books,
  onSelect,
  gridCols
}: {
  label: string
  books: BibleBook[]
  onSelect: (book: BibleBook) => void
  gridCols: number
}): React.JSX.Element {
  return (
    <div>
      <p className="mb-1.5 px-1 font-label text-[10px] uppercase tracking-widest text-outline">
        {label}
      </p>
      <div className={`grid gap-0.5 ${GRID_COLS_CLASS[gridCols] ?? 'grid-cols-4'}`}>
        {books.map((book) => (
          <button
            key={book.numero}
            onClick={() => onSelect(book)}
            title={book.nombre}
            className="border border-outline-variant/20 bg-surface-container px-2 py-2.5 text-left font-label text-base leading-tight tracking-wide text-on-surface-variant transition-colors hover:border-primary hover:text-primary truncate"
          >
            {book.nombre}
          </button>
        ))}
      </div>
    </div>
  )
}

function ChaptersView({
  book,
  onBack,
  onSelect
}: {
  book: BibleBook
  onBack: () => void
  onSelect: (chapter: number) => void
}): React.JSX.Element {
  const total = CHAPTER_COUNTS[book.numero] ?? 1

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <button
        onClick={onBack}
        className="flex shrink-0 items-center gap-1.5 border-b border-outline-variant/20 px-3 py-2.5 text-left font-label text-xs uppercase tracking-wider text-on-surface-variant transition-colors hover:text-primary"
      >
        <ChevronLeft className="size-3.5" />
        {book.nombre}
      </button>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: total }, (_, i) => i + 1).map((cap) => (
            <button
              key={cap}
              onClick={() => onSelect(cap)}
              className="border border-outline-variant/20 bg-surface-container py-2.5 text-center font-label text-xs text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
            >
              {cap}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
