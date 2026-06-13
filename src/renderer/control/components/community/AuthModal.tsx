import { useState } from 'react'
import { X, LogIn, UserPlus } from 'lucide-react'
import { api } from '../../lib/api'

interface Props {
  onSuccess: () => void
  onClose: () => void
}

type Mode = 'login' | 'register'

export default function AuthModal({ onSuccess, onClose }: Props): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [iglesia, setIglesia] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let res
      if (mode === 'login') {
        res = await api.auth.login(email, password)
      } else {
        if (!iglesia.trim()) { setError('El nombre de la iglesia es obligatorio'); setLoading(false); return }
        res = await api.auth.register(email, password, iglesia.trim())
      }
      if (res.success) {
        onSuccess()
      } else {
        setError(res.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-sm rounded-xl bg-slate-900 p-6 shadow-2xl">
        {/* Encabezado */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-100">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-sky-500"
            />
          </div>
          {mode === 'register' && (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Nombre de la iglesia</label>
              <input
                type="text"
                value={iglesia}
                onChange={(e) => setIglesia(e.target.value)}
                className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none ring-1 ring-slate-600 focus:ring-sky-500"
                placeholder="Ej. Iglesia Pentecostal Rincón"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {mode === 'login'
              ? <><LogIn className="size-4" />{loading ? 'Entrando…' : 'Entrar'}</>
              : <><UserPlus className="size-4" />{loading ? 'Registrando…' : 'Registrarse'}</>}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          {' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
            className="text-sky-400 hover:underline"
          >
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}
