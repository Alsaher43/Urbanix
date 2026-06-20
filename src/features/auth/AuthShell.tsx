import type { ReactNode } from 'react';

/** Layout dividido para las pantallas de autenticación (estilo SaaS premium). */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden overflow-hidden bg-[#0b0b14] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-grid opacity-[0.15]" />
        <div
          className="absolute -left-20 -top-20 h-96 w-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(124,117,255,0.35), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 right-0 h-96 w-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(88,80,236,0.25), transparent 70%)' }}
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M8 22V11.5C8 10.67 8.67 10 9.5 10h4c.83 0 1.5.67 1.5 1.5V22M17 22v-7.5c0-.83.67-1.5 1.5-1.5h4c.83 0 1.5.67 1.5 1.5V22M6 22.5h20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Urbanix</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-white text-balance">
            Plataforma inteligente de gestión inmobiliaria
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/60">
            Visualiza tus planos, controla el estado de cada lote y administra tus desarrollos con
            la claridad de un producto profesional.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Planos SVG', 'Estados en vivo', 'Historial', 'Roles'].map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Urbanix</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
