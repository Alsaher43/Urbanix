import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Locate, RotateCcw, RotateCw, Maximize, Minimize } from 'lucide-react';
import type { Lot } from '@/types';
import type { Dimension } from '@/config/lotStatus';
import { applyLotColors } from '@/utils/svg';
import { cn } from '@/lib/cn';

interface Transform {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 12;

export function SvgCanvas({
  svgText,
  lots,
  dimension,
  colorFor,
  selected,
  activeValues,
  onSelect,
  onHover,
  fullscreenTargetRef,
}: {
  svgText: string;
  lots: Lot[];
  dimension: Dimension;
  colorFor: (value: string) => string;
  selected: string | null;
  activeValues?: Set<string> | null;
  onSelect: (id: string | null) => void;
  onHover: (payload: { id: string; x: number; y: number } | null) => void;
  /** Elemento a poner en pantalla completa (p. ej. lienzo + leyenda). Por defecto el propio lienzo. */
  fullscreenTargetRef?: React.RefObject<HTMLElement>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgHostRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [panning, setPanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const panState = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  // Inyecta el SVG una vez por contenido.
  useEffect(() => {
    const host = svgHostRef.current;
    if (!host) return;
    host.innerHTML = svgText;
    const svg = host.querySelector('svg');
    if (svg) {
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.maxHeight = '100%';
      svg.style.display = 'block';

      // Oculta rectángulos de fondo blancos que cubren casi todo el plano,
      // para que se vea el grid del lienzo (comportamiento del Valora real).
      const vb = (svg.getAttribute('viewBox') || '0 0 800 600').split(/[\s,]+/).map(Number);
      const vw = vb[2] || 800;
      const vh = vb[3] || 600;
      const WHITE = new Set(['white', '#fff', '#ffffff']);
      svg.querySelectorAll('rect').forEach((r) => {
        const fill = (r.getAttribute('fill') || r.style.fill || '').toLowerCase().replace(/\s/g, '');
        if (!WHITE.has(fill)) return;
        if (parseFloat(r.getAttribute('width') || '0') >= vw * 0.8 && parseFloat(r.getAttribute('height') || '0') >= vh * 0.8) {
          (r as SVGElement).style.display = 'none';
        }
      });
    }
  }, [svgText]);

  // (Re)aplica colores cuando cambian datos, dimensión, colores, selección o filtros.
  useEffect(() => {
    const svg = svgHostRef.current?.querySelector('svg');
    if (svg) {
      applyLotColors(svg as unknown as SVGElement, lots, dimension, colorFor, {
        selected,
        activeValues: activeValues ?? null,
      });
    }
  }, [svgText, lots, dimension, colorFor, selected, activeValues]);

  const fsTarget = () => fullscreenTargetRef?.current ?? rootRef.current;

  // Sincroniza el estado de pantalla completa con el navegador.
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === fsTarget());
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreenTargetRef]);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setTransform((t) => {
      const newScale = clampScale(t.scale * factor);
      const k = newScale / t.scale;
      return { scale: newScale, x: cx - (cx - t.x) * k, y: cy - (cy - t.y) * k };
    });
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
  };

  const reset = () => {
    setTransform({ scale: 1, x: 0, y: 0 });
    setRotation(0);
  };

  const rotate = (deg: number) => setRotation((r) => r + deg);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void fsTarget()?.requestFullscreen?.();
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    panState.current = { active: true, sx: e.clientX, sy: e.clientY, ox: transform.x, oy: transform.y };
    setPanning(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (panState.current.active) {
      setTransform((t) => ({
        ...t,
        x: panState.current.ox + (e.clientX - panState.current.sx),
        y: panState.current.oy + (e.clientY - panState.current.sy),
      }));
      onHover(null);
      return;
    }
    const target = (e.target as Element).closest('[data-lid]') as SVGElement | null;
    if (target && rect) {
      onHover({ id: target.dataset.lid!, x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      onHover(null);
    }
  };
  const endPan = () => {
    panState.current.active = false;
    setPanning(false);
  };

  const onClick = (e: React.MouseEvent) => {
    const target = (e.target as Element).closest('[data-lid]') as SVGElement | null;
    onSelect(target?.dataset.lid ?? null);
  };

  return (
    <div ref={rootRef} className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-canvas bg-grid">
      <div
        ref={containerRef}
        className={cn('h-full w-full touch-none', panning ? 'cursor-grabbing' : 'cursor-grab')}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerLeave={() => { endPan(); onHover(null); }}
        onClick={onClick}
      >
        <div
          className="h-full w-full origin-top-left"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transition: panning ? 'none' : 'transform 0.08s linear',
          }}
        >
          {/* Capa de rotación independiente: no interfiere con el zoom/pan. */}
          <div
            ref={svgHostRef}
            className="flex h-full w-full items-center justify-center p-6"
            style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </div>
      </div>

      {/* Controles */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 rounded-lg border border-border bg-surface/90 p-1 shadow-md backdrop-blur">
        <ControlBtn onClick={() => zoomAt(1.25, (containerRef.current?.clientWidth ?? 0) / 2, (containerRef.current?.clientHeight ?? 0) / 2)} label="Acercar">
          <ZoomIn className="h-4 w-4" />
        </ControlBtn>
        <ControlBtn onClick={() => zoomAt(1 / 1.25, (containerRef.current?.clientWidth ?? 0) / 2, (containerRef.current?.clientHeight ?? 0) / 2)} label="Alejar">
          <ZoomOut className="h-4 w-4" />
        </ControlBtn>
        <div className="my-0.5 h-px bg-border" />
        <ControlBtn onClick={() => rotate(-90)} label="Rotar a la izquierda">
          <RotateCcw className="h-4 w-4" />
        </ControlBtn>
        <ControlBtn onClick={() => rotate(90)} label="Rotar a la derecha">
          <RotateCw className="h-4 w-4" />
        </ControlBtn>
        <ControlBtn onClick={reset} label="Restablecer vista">
          <Maximize2 className="h-4 w-4" />
        </ControlBtn>
        <div className="my-0.5 h-px bg-border" />
        <ControlBtn onClick={toggleFullscreen} label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </ControlBtn>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-1.5 rounded-md bg-surface/90 px-2.5 py-1.5 text-2xs font-medium text-content-3 shadow-sm backdrop-blur">
        <Locate className="h-3.5 w-3.5" />
        {Math.round(transform.scale * 100)}%
        {rotation % 360 !== 0 && <span className="ml-1 text-content-2">· {((rotation % 360) + 360) % 360}°</span>}
      </div>
    </div>
  );
}

function ControlBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-content-2 transition-colors hover:bg-surface-2 hover:text-content"
    >
      {children}
    </button>
  );
}
