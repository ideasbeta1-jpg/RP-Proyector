import type { OutputApi } from '@shared/types'

// Accesor tipado al puente expuesto por el preload de output.
export const api = (window as unknown as { api: OutputApi }).api
