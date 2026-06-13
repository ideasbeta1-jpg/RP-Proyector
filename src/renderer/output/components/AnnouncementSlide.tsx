import type { AnnouncementSlideContent } from '@shared/types'

interface Props {
  content: AnnouncementSlideContent
}

export default function AnnouncementSlide({ content }: Props): React.JSX.Element {
  const { titulo, cuerpo, imagenUrl } = content

  return (
    <div className="relative flex h-screen w-screen items-end overflow-hidden bg-black">
      {/* Imagen de fondo a pantalla completa */}
      {imagenUrl && (
        <img
          src={imagenUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Overlay degradado desde abajo */}
      <div
        className="absolute inset-0"
        style={{
          background: imagenUrl
            ? 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)'
            : 'rgba(0,0,0,0.92)'
        }}
      />

      {/* Texto en la parte inferior */}
      <div className="relative z-10 w-full px-[6vw] pb-[6vw]">
        <h1
          className="font-bold leading-tight text-white drop-shadow-lg"
          style={{ fontSize: 'clamp(2rem, 5vw, 5rem)' }}
        >
          {titulo}
        </h1>
        {cuerpo && (
          <p
            className="mt-[1.5vw] leading-snug text-slate-200 drop-shadow"
            style={{ fontSize: 'clamp(1rem, 2.8vw, 2.8rem)' }}
          >
            {cuerpo}
          </p>
        )}
      </div>
    </div>
  )
}
