import { useEffect, useState, type ReactNode } from 'react';

/** Contador que anima de 0 al valor objetivo (estadística "viva"). */
function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function FloatingCards() {
  const colocados = useCountUp(1248);
  const segments = [
    { c: '#10B981', w: '46%', label: 'Disponible' },
    { c: '#EF4444', w: '28%', label: 'Vendido' },
    { c: '#F59E0B', w: '16%', label: 'Reservado' },
    { c: '#3B82F6', w: '10%', label: 'Crédito' },
  ];
  // La rotación va en el contenedor exterior; la flotación (translateY) en el
  // hijo, para que la animación no anule la inclinación.
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Tarjeta de estadística */}
      <div className="absolute right-10 top-24" style={{ transform: 'rotate(3deg)' }}>
        <div className="w-52 animate-float rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl backdrop-blur-md">
          <p className="text-xs font-medium text-white/50">Lotes colocados</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-white">{colocados.toLocaleString('es-PE')}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-400">▲ 12% este mes</p>
        </div>
      </div>

      {/* Tarjeta de distribución */}
      <div className="absolute bottom-28 right-24" style={{ transform: 'rotate(-3deg)' }}>
        <div className="w-60 animate-float-slow rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl backdrop-blur-md">
          <p className="text-xs font-medium text-white/50">Distribución por estado</p>
          <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-white/10">
            {segments.map((s) => (
              <div key={s.c} style={{ width: s.w, backgroundColor: s.c }} />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-white/60">
            {segments.map((s) => (
              <span key={s.c} className="flex items-center gap-1">
                <i className="h-2 w-2 rounded-sm" style={{ background: s.c }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chip de lote */}
      <div className="absolute right-12 top-56" style={{ transform: 'rotate(-2deg)' }}>
        <div
          className="flex animate-float items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 shadow-lg backdrop-blur-md"
          style={{ animationDelay: '1.2s' }}
        >
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: '#EF4444' }} />
          <span className="text-sm font-semibold text-white">A-12</span>
          <span className="text-2xs text-white/50">Vendido · Contado</span>
        </div>
      </div>
    </div>
  );
}

/** Layout dividido para las pantallas de autenticación (estilo SaaS premium). */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0a0e1a] via-[#0b0f1e] to-[#10172e] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-grid opacity-[0.12]" />
        <div
          className="absolute -left-20 -top-20 h-96 w-96 animate-float-slow rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(124,117,255,0.40), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 right-0 h-96 w-96 animate-float rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.30), transparent 70%)' }}
        />

        <FloatingCards />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/40">
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
            {['Planos SVG', 'Estados en vivo', 'Historial', 'Multi-inmobiliaria'].map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur"
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
