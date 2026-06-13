import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { BibleVersion } from '@shared/types'

interface Props {
  value: string
  onChange: (id: string) => void
}

export default function VersionSelector({ value, onChange }: Props): React.JSX.Element {
  const [versions, setVersions] = useState<BibleVersion[]>([])

  useEffect(() => {
    api.bible.listVersions().then((res) => {
      if (res.success && res.data.length > 0) {
        setVersions(res.data)
        if (!value) onChange(res.data[0].id)
      }
    })
  }, [])

  if (versions.length === 0) {
    return (
      <span className="text-xs text-slate-500 italic">Sin versiones instaladas</span>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
    >
      {versions.map((v) => (
        <option key={v.id} value={v.id}>
          {v.abreviatura}
        </option>
      ))}
    </select>
  )
}
