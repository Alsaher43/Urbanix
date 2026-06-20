import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/store/toastStore';
import { cn } from '@/lib/cn';

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const ACCENT: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
  warning: 'text-warning',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2.5"
      role="region"
      aria-label="Notificaciones"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex animate-slide-in-right items-start gap-3 rounded-lg border border-border bg-surface p-3.5 shadow-lg"
          >
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', ACCENT[t.variant])} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-content">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-sm text-content-2">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded-md p-1 text-content-3 transition-colors hover:bg-surface-2 hover:text-content"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
