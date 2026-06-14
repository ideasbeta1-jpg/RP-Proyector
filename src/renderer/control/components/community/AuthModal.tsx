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
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-full max-w-sm border border-outline-variant/30 bg-surface-container-low shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-on-surface">
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h2>
            <p className="font-label mt-0.5 text-[9px] uppercase tracking-widest text-outline">
              Comunidad RP Proyector
            </p>
          </div>
          <button onClick={onClose} className="text-outline transition-colors hover:text-on-surface">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-2 block font-label text-[9px] uppercase tracking-widest text-on-surface-variant">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-underline w-full py-2 text-base"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="mb-2 block font-label text-[9px] uppercase tracking-widest text-on-surface-variant">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-underline w-full py-2 text-base"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {mode === 'register' && (
            <div>
              <label className="mb-2 block font-label text-[9px] uppercase tracking-widest text-on-surface-variant">
                Nombre de la iglesia
              </label>
              <input
                type="text"
                value={iglesia}
                onChange={(e) => setIglesia(e.target.value)}
                className="input-underline w-full py-2 text-base"
                placeholder="Ej. Iglesia Pentecostal Rincón"
              />
            </div>
          )}

          {error && (
            <p className="font-label text-[10px] uppercase tracking-wider text-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-primary py-3 font-label text-xs uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-fixed-dim disabled:opacity-50"
          >
            {mode === 'login'
              ? <><LogIn className="size-4" />{loading ? 'Entrando…' : 'Entrar'}</>
              : <><UserPlus className="size-4" />{loading ? 'Registrando…' : 'Registrarse'}</>}
          </button>
        </form>

        <div className="border-t border-outline-variant/20 px-5 py-3 text-center">
          <p className="font-body text-sm text-outline">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            {' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
              className="text-primary transition-colors hover:text-primary-container hover:underline"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
