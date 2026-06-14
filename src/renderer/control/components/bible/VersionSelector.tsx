import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { api } from '../../lib/api'
import type { BibleVersion } from '@shared/types'

interface Props {
  value: string
  onChange: (id: string) => void
  refreshToken?: number
}

export default function VersionSelector({ value, onChange, refreshToken = 0 }: Props): React.JSX.Element {
  const [versions, setVersions] = useState<BibleVersion[]>([])

  useEffect(() => {
    api.bible.listVersions().then((res) => {
      if (res.success && res.data.length > 0) {
        setVersions(res.data)
        const ids = res.data.map((v) => v.id)
        if (!value || !ids.includes(value)) onChange(res.data[0].id)
      }
    })
  }, [refreshToken])

  if (versions.length === 0) {
    return (
      <span className="font-label text-[10px] uppercase tracking-widest text-outline italic">
        Sin versiones
      </span>
    )
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-surface-container border border-outline-variant/40 pl-3 pr-7 py-1.5 font-label text-[10px] uppercase tracking-wider text-on-surface-variant focus:border-primary focus:outline-none transition-colors cursor-pointer"
      >
        {versions.map((v) => (
          <option key={v.id} value={v.id}>
            {v.abreviatura}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 size-3 text-outline" />
    </div>
  )
}
