import { getSupabase } from './supabaseClient'
import type { AuthUser, SyncStatus } from '@shared/types'
import type Database from 'better-sqlite3'

async function buildUser(supabase: ReturnType<typeof getSupabase>): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre_iglesia')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email ?? '',
    nombreIglesia: profile?.nombre_iglesia ?? ''
  }
}

export async function getAuthStatus(db: Database.Database): Promise<SyncStatus> {
  const supabase = getSupabase()
  const user = await buildUser(supabase)
  const pendingOutbox = db
    .prepare('SELECT COUNT(*) as n FROM outbox WHERE enviado = 0')
    .get() as { n: number }

  return {
    authenticated: !!user,
    user,
    pendingOutbox: pendingOutbox.n
  }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)

  const user = await buildUser(supabase)
  if (!user) throw new Error('No se pudo recuperar el perfil')
  return user
}

export async function register(
  email: string,
  password: string,
  nombreIglesia: string
): Promise<AuthUser> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre_iglesia: nombreIglesia } }
  })
  if (error) throw new Error(error.message)

  // Iniciar sesión inmediatamente (Supabase puede requerir confirmación; en dev está desactivado)
  const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password })
  if (loginErr) throw new Error('Registro exitoso. Verifica tu email para activar la cuenta.')

  const user = await buildUser(supabase)
  if (!user) throw new Error('No se pudo recuperar el perfil')
  return user
}

export async function logout(): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}
