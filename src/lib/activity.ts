import { supabase, isSupabaseConfigured } from './supabase';
import type { ActivityType } from '@/types';

interface LogContext {
  userId?: string | null;
  projectId?: string | null;
  /** Nombre legible del usuario para el historial humano. */
  usuario?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registra una acción tanto en `activity_logs` (auditoría estructurada) como
 * en `historial` (texto legible para el usuario). Es "fire-and-forget": nunca
 * debe romper el flujo principal si falla el log.
 */
export async function logActivity(
  accion: ActivityType,
  descripcion: string,
  ctx: LogContext = {},
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    let userId = ctx.userId ?? null;
    if (!userId) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    }

    await Promise.allSettled([
      supabase.from('activity_logs').insert({
        user_id: userId,
        project_id: ctx.projectId ?? null,
        accion,
        descripcion,
        metadata: ctx.metadata ?? null,
      }),
      supabase.from('historial').insert({
        project_id: ctx.projectId ?? null,
        usuario: ctx.usuario || 'Usuario',
        accion: descripcion,
      }),
    ]);
  } catch (err) {
    console.warn('[activity] No se pudo registrar la acción:', err);
  }
}
