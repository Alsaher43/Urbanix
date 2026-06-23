/**
 * Tipos de la base de datos Supabase (alineados con supabase/migrations/0001_init.sql).
 *
 * IMPORTANTE: se usan `type` (no `interface`). Un `interface` no es asignable a
 * `Record<string, unknown>`, por lo que el esquema no satisfaría el `GenericSchema`
 * de @supabase/supabase-js y los métodos insert/update se tiparían como `never`.
 */
import type { UserRole, ActivityType } from '@/types';

/* ── Filas ── */
type ProfileRow = {
  id: string;
  email: string;
  nombre: string | null;
  rol: UserRole;
  avatar_url: string | null;
  org_id: string | null;
  created_at: string;
};
type OrganizationRow = { id: string; nombre: string; created_at: string };
type OrganizationInsert = { id?: string; nombre: string; created_at?: string };
type AuditLogRow = {
  id: string;
  org_id: string | null;
  user_id: string | null;
  usuario: string;
  project_id: string | null;
  entity: string;
  entity_id: string | null;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};
type AuditLogInsert = {
  id?: string;
  org_id?: string | null;
  user_id?: string | null;
  usuario: string;
  project_id?: string | null;
  entity: string;
  entity_id?: string | null;
  field: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at?: string;
};
type ProjectRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  ubicacion: string | null;
  owner_id: string | null;
  org_id: string | null;
  created_at: string;
  updated_at: string;
};
type SvgFileRow = {
  id: string;
  project_id: string;
  nombre: string;
  storage_path: string;
  version: number;
  uploaded_by: string | null;
  created_at: string;
};
type ExcelFileRow = {
  id: string;
  project_id: string;
  nombre: string;
  storage_path: string;
  version: number;
  rows_count: number;
  uploaded_by: string | null;
  created_at: string;
};
type HistorialRow = {
  id: string;
  project_id: string | null;
  org_id: string | null;
  usuario: string;
  accion: string;
  created_at: string;
};
type ActivityLogRow = {
  id: string;
  user_id: string | null;
  project_id: string | null;
  org_id: string | null;
  accion: ActivityType;
  descripcion: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/* ── Inserts (claves opcionales = generadas por la BD) ── */
type ProfileInsert = {
  id: string;
  email: string;
  nombre?: string | null;
  rol?: UserRole;
  avatar_url?: string | null;
  org_id?: string | null;
  created_at?: string;
};
type ProjectInsert = {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  owner_id?: string | null;
  org_id?: string | null;
  created_at?: string;
  updated_at?: string;
};
type SvgFileInsert = {
  id?: string;
  project_id: string;
  nombre: string;
  storage_path: string;
  version?: number;
  uploaded_by?: string | null;
  created_at?: string;
};
type ExcelFileInsert = {
  id?: string;
  project_id: string;
  nombre: string;
  storage_path: string;
  version?: number;
  rows_count?: number;
  uploaded_by?: string | null;
  created_at?: string;
};
type HistorialInsert = {
  id?: string;
  project_id?: string | null;
  org_id?: string | null;
  usuario: string;
  accion: string;
  created_at?: string;
};
type ActivityLogInsert = {
  id?: string;
  user_id?: string | null;
  project_id?: string | null;
  org_id?: string | null;
  accion: ActivityType;
  descripcion: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
};
type LotOverrideRow = {
  id: string;
  project_id: string;
  lote_id: string;
  estado: string | null;
  financiamiento: string | null;
  updated_by: string | null;
  updated_at: string;
};
type LotOverrideInsert = {
  id?: string;
  project_id: string;
  lote_id: string;
  estado?: string | null;
  financiamiento?: string | null;
  updated_by?: string | null;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: ProfileInsert; Update: Partial<ProfileInsert>; Relationships: [] };
      projects: { Row: ProjectRow; Insert: ProjectInsert; Update: Partial<ProjectInsert>; Relationships: [] };
      svg_files: { Row: SvgFileRow; Insert: SvgFileInsert; Update: Partial<SvgFileInsert>; Relationships: [] };
      excel_files: { Row: ExcelFileRow; Insert: ExcelFileInsert; Update: Partial<ExcelFileInsert>; Relationships: [] };
      historial: { Row: HistorialRow; Insert: HistorialInsert; Update: Partial<HistorialInsert>; Relationships: [] };
      activity_logs: { Row: ActivityLogRow; Insert: ActivityLogInsert; Update: Partial<ActivityLogInsert>; Relationships: [] };
      lot_overrides: { Row: LotOverrideRow; Insert: LotOverrideInsert; Update: Partial<LotOverrideInsert>; Relationships: [] };
      organizations: { Row: OrganizationRow; Insert: OrganizationInsert; Update: Partial<OrganizationInsert>; Relationships: [] };
      audit_log: { Row: AuditLogRow; Insert: AuditLogInsert; Update: Partial<AuditLogInsert>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
