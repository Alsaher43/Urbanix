/* ─────────────── Roles ─────────────── */
export type UserRole = 'gerente' | 'trabajador';

export const ROLE_LABELS: Record<UserRole, string> = {
  gerente: 'Gerente',
  trabajador: 'Trabajador',
};

/* ─────────────── Entidades de dominio ─────────────── */
export interface Profile {
  id: string;
  email: string;
  nombre: string | null;
  rol: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  nombre: string;
  descripcion: string | null;
  ubicacion: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SvgFile {
  id: string;
  project_id: string;
  nombre: string;
  storage_path: string;
  version: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface ExcelFile {
  id: string;
  project_id: string;
  nombre: string;
  storage_path: string;
  version: number;
  /** Snapshot de los lotes parseados al momento de la carga. */
  rows_count: number;
  uploaded_by: string | null;
  created_at: string;
}

/** Acción de negocio registrada (historial legible para el usuario). */
export interface HistorialEntry {
  id: string;
  project_id: string | null;
  usuario: string; // nombre o email mostrado
  accion: string; // texto humano: "Juan cambió A12 de Disponible a Vendido"
  created_at: string;
}

/** Log técnico de auditoría (más estructurado). */
export type ActivityType =
  | 'login'
  | 'logout'
  | 'upload_svg'
  | 'upload_excel'
  | 'change_status'
  | 'export'
  | 'create_user'
  | 'update_settings'
  | 'open_project';

export interface ActivityLog {
  id: string;
  user_id: string | null;
  project_id: string | null;
  accion: ActivityType;
  descripcion: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/* ─────────────── Lote (parseado del Excel) ─────────────── */
export interface Lot {
  /** Identificador del lote; coincide con el id de la forma en el SVG. */
  id: string;
  /** Estado (Disponible, Vendido, Reservado…). Valor tal cual del Excel. */
  estado: string;
  /** Financiamiento (Contado, Directo / Financiamiento Directo) o null. */
  financiamiento: string | null;
  /** Precio numérico o null. */
  precio: number | null;
  /** Campos opcionales detectados del Excel (todos retrocompatibles). */
  subcategoria?: string | null;
  descuento?: number | null;
  area?: number | null;
  manzana?: string | null;
  etapa?: string | null;
  /** Todas las demás columnas del Excel, para no perder información. */
  extra: Record<string, string | number | null>;
}

/* ─────────────── Helpers de UI ─────────────── */
export interface KpiDatum {
  label: string;
  value: string;
  delta?: number;
  icon?: string;
}
