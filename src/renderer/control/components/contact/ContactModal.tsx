import { Mail, MessageCircle, X, User } from 'lucide-react'
import { api } from '../../lib/api'

interface Props {
  onClose: () => void
}

export default function ContactModal({ onClose }: Props): React.JSX.Element {
  const openWhatsApp = (): void => {
    api.shell.openExternal('https://wa.me/573152932781')
  }

  const openEmail = (): void => {
    api.shell.openExternal('mailto:rzapata@ideasbeta.com')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
      <div className="w-80 border border-outline-variant/30 bg-surface-container-low shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
          <h2 className="font-display text-lg font-semibold text-on-surface">Contactar al autor</h2>
          <button onClick={onClose} className="text-outline transition-colors hover:text-on-surface">
            <X className="size-4" />
          </button>
        </div>

        {/* Author info */}
        <div className="p-5">
          <div className="mb-5 flex flex-col items-center gap-2 text-center">
            <div className="flex size-14 items-center justify-center border border-primary/20 bg-primary/10">
              <User className="size-7 text-primary" />
            </div>
            <div>
              <p className="font-display font-semibold text-on-surface">Robinson Zapata</p>
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                Desarrollador de RP Proyector
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={openWhatsApp}
              className="flex items-center gap-3 border border-[#25D366]/30 bg-[#25D366]/8 px-4 py-3 text-left transition-colors hover:bg-[#25D366]/15"
            >
              <MessageCircle className="size-5 shrink-0 text-[#25D366]" />
              <div>
                <p className="font-label text-base font-medium text-on-surface">WhatsApp</p>
                <p className="font-body text-sm text-on-surface-variant">+57 315 293 2781</p>
              </div>
            </button>

            <button
              onClick={openEmail}
              className="flex items-center gap-3 border border-primary/20 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
            >
              <Mail className="size-5 shrink-0 text-primary/80" />
              <div>
                <p className="font-label text-base font-medium text-on-surface">Correo electrónico</p>
                <p className="font-body text-sm text-on-surface-variant">rzapata@ideasbeta.com</p>
              </div>
            </button>
          </div>
        </div>

        <div className="border-t border-outline-variant/20 px-4 py-3 text-center">
          <p className="font-label text-[9px] leading-relaxed text-outline">
            Hecho con dedicación para la Iglesia Pentecostal
          </p>
        </div>
      </div>
    </div>
  )
}
