import { supabase, isSupabaseConfigured } from './supabase';

interface AuditInput {
  entity: string; // p.ej. 'lote'
  entityId?: string | null; // p.ej. 'A-12'
  field: string; // 'estado' | 'financiamiento' | ...
  oldValue?: string | null;
  newValue?: string | null;
  projectId?: string | null;
  usuario: string;
  userId?: string | null;
}

/**
 * Registra un cambio en `audit_log` (quién, qué campo, valor anterior → nuevo).
 * Es "fire-and-forget": nunca rompe el flujo si la tabla no existe todavía
 * (p.ej. antes de aplicar la migración 0003).
 */
export async function logAudit(input: AuditInput): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    let userId = input.userId ?? null;
    if (!userId) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    }
    await supabase.from('audit_log').insert({
      user_id: userId,
      usuario: input.usuario,
      project_id: input.projectId ?? null,
      entity: input.entity,
      entity_id: input.entityId ?? null,
      field: input.field,
      old_value: input.oldValue ?? null,
      new_value: input.newValue ?? null,
    });
  } catch (err) {
    console.warn('[audit] No se pudo registrar el cambio:', err);
  }
}
