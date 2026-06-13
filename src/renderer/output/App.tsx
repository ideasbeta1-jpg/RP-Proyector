import { useEffect, useState } from 'react'
import type { ProjectionPayload } from '@shared/types'
import { api } from './lib/api'
import BlackScreen from './components/BlackScreen'
import LogoScreen from './components/LogoScreen'
import SongSlide from './components/SongSlide'
import BibleSlide from './components/BibleSlide'
import AnnouncementSlide from './components/AnnouncementSlide'

export default function App(): React.JSX.Element {
  const [payload, setPayload] = useState<ProjectionPayload>({ mode: 'black' })

  useEffect(() => {
    // Suscripción al canal de proyección; devuelve la función de limpieza.
    const unsubscribe = api.onProjectionUpdate((next) => {
      setPayload(next)
    })
    return unsubscribe
  }, [])

  switch (payload.mode) {
    case 'logo':
      return <LogoScreen />
    case 'song':
      return payload.song ? <SongSlide song={payload.song} /> : <BlackScreen />
    case 'bible':
      return payload.bible ? <BibleSlide bible={payload.bible} /> : <BlackScreen />
    case 'announcement':
      return payload.announcement ? <AnnouncementSlide content={payload.announcement} /> : <BlackScreen />
    case 'black':
    default:
      return <BlackScreen />
  }
}
