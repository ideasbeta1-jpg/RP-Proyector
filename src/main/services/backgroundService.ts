import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import type { BackgroundConfig } from '@shared/types'

export const DEFAULT_BG_CONFIG: BackgroundConfig = {
  song:  { type: 'color', color: '#0f172a' },
  bible: { type: 'color', color: '#000000' }
}

function configPath(): string {
  return join(app.getPath('userData'), 'background-config.json')
}

export function getBackgroundConfig(): BackgroundConfig {
  try {
    const raw = readFileSync(configPath(), 'utf-8')
    return JSON.parse(raw) as BackgroundConfig
  } catch {
    return DEFAULT_BG_CONFIG
  }
}

export function setBackgroundConfig(config: BackgroundConfig): void {
  writeFileSync(configPath(), JSON.stringify(config), 'utf-8')
}
