import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'

interface DisplayPref {
  displayId: number | null
}

function prefPath(): string {
  return join(app.getPath('userData'), 'display-preference.json')
}

export function getPreferredDisplayId(): number | null {
  try {
    const raw = readFileSync(prefPath(), 'utf-8')
    const pref: DisplayPref = JSON.parse(raw)
    return typeof pref.displayId === 'number' ? pref.displayId : null
  } catch {
    return null
  }
}

export function setPreferredDisplayId(id: number): void {
  writeFileSync(prefPath(), JSON.stringify({ displayId: id }), 'utf-8')
}
