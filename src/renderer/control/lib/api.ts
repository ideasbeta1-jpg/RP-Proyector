import type { ControlWindowApi } from '@shared/types'

// Accesor tipado al puente expuesto por el preload de control.
// Evita aumentar el Window global (que entraría en conflicto con el de la
// ventana output al compilarse ambos renderers juntos).
export const api = (window as unknown as { api: ControlWindowApi }).api
