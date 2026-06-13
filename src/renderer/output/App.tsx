import { useEffect, useState } from 'react'
import type { ProjectionPayload, ThemeId } from '@shared/types'
import { api } from './lib/api'
import BlackScreen from './components/BlackScreen'
import LogoScreen from './components/LogoScreen'
import SongSlide from './components/SongSlide'
import BibleSlide from './components/BibleSlide'
import AnnouncementSlide from './components/AnnouncementSlide'

const THEME_KEY = 'rp-output-theme'

const THEMES: Record<ThemeId, React.CSSProperties> = {
  'default': {
    '--slide-bg': '#0f172a',
    '--slide-text': '#ffffff',
    '--slide-accent': '#38bdf8'
  } as React.CSSProperties,
  'dark-gold': {
    '--slide-bg': '#000000',
    '--slide-text': '#fbbf24',
    '--slide-accent': '#f59e0b'
  } as React.CSSProperties,
  'minimal': {
    '--slide-bg': '#ffffff',
    '--slide-text': '#0f172a',
    '--slide-accent': '#2563eb'
  } as React.CSSProperties
}

export default function App(): React.JSX.Element {
  const [payload, setPayload] = useState<ProjectionPayload>({ mode: 'black' })
  const [theme, setTheme] = useState<ThemeId>(
    () => (localStorage.getItem(THEME_KEY) as ThemeId | null) ?? 'default'
  )

  useEffect(() => {
    const unsubProjection = api.onProjectionUpdate((next) => setPayload(next))
    const unsubTheme = api.onThemeChange((t) => {
      setTheme(t)
      localStorage.setItem(THEME_KEY, t)
    })
    return () => { unsubProjection(); unsubTheme() }
  }, [])

  const themeVars = THEMES[theme]

  switch (payload.mode) {
    case 'logo':
      return <LogoScreen />
    case 'song':
      return payload.song
        ? <SongSlide song={payload.song} style={themeVars} />
        : <BlackScreen />
    case 'bible':
      return payload.bible
        ? <BibleSlide bible={payload.bible} style={themeVars} />
        : <BlackScreen />
    case 'announcement':
      return payload.announcement
        ? <AnnouncementSlide content={payload.announcement} />
        : <BlackScreen />
    case 'black':
    default:
      return <BlackScreen />
  }
}
