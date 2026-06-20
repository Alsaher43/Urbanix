import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, getErrorMessage, SUPABASE_BUCKET } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/store/toastStore';
import { parseSpreadsheet } from '@/utils/excel';
import { sanitizeSvg } from '@/utils/svg';
import type { SvgFile, ExcelFile, Lot } from '@/types';

/* ─────────────── Listado ─────────────── */
export function useSvgFiles(projectId: string | null) {
  return useQuery({
    queryKey: ['svg_files', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<SvgFile[]> => {
      const { data, error } = await supabase
        .from('svg_files')
        .select('*')
        .eq('project_id', projectId!)
        .order('version', { ascending: false });
      if (error) throw new Error(getErrorMessage(error));
      return data as SvgFile[];
    },
  });
}

export function useExcelFiles(projectId: string | null) {
  return useQuery({
    queryKey: ['excel_files', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ExcelFile[]> => {
      const { data, error } = await supabase
        .from('excel_files')
        .select('*')
        .eq('project_id', projectId!)
        .order('version', { ascending: false });
      if (error) throw new Error(getErrorMessage(error));
      return data as ExcelFile[];
    },
  });
}

/* ─────────────── Descarga de contenido ─────────────── */
async function downloadBlob(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download(path);
  if (error) throw new Error(getErrorMessage(error));
  return data;
}

/** Texto del SVG (memoria de la web: se descarga del Storage, no se re-sube). */
export function useSvgContent(svg: SvgFile | null) {
  return useQuery({
    queryKey: ['svg_content', svg?.id],
    enabled: !!svg,
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<string> => {
      const blob = await downloadBlob(svg!.storage_path);
      return sanitizeSvg(await blob.text());
    },
  });
}

/** Lotes parseados del Excel guardado en Storage. */
export function useExcelLots(excel: ExcelFile | null) {
  return useQuery({
    queryKey: ['excel_lots', excel?.id],
    enabled: !!excel,
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<Lot[]> => {
      const blob = await downloadBlob(excel!.storage_path);
      const { lots } = await parseSpreadsheet(await blob.arrayBuffer(), excel!.nombre);
      return lots;
    },
  });
}

/* ─────────────── Subida (solo gerente, vía RLS) ─────────────── */
function nextVersion<T extends { version: number }>(rows: T[] | undefined): number {
  if (!rows || rows.length === 0) return 1;
  return Math.max(...rows.map((r) => r.version)) + 1;
}

export function useUploadSvg(projectId: string | null) {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (file: File): Promise<SvgFile> => {
      if (!projectId) throw new Error('Selecciona un proyecto primero.');
      const existing = qc.getQueryData<SvgFile[]>(['svg_files', projectId]);
      const version = nextVersion(existing);
      const path = `${projectId}/svg/v${version}-${Date.now()}-${sanitizeName(file.name)}`;

      const { error: upErr } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(path, file, { upsert: false, contentType: 'image/svg+xml' });
      if (upErr) throw new Error(getErrorMessage(upErr));

      const { data, error } = await supabase
        .from('svg_files')
        .insert({ project_id: projectId, nombre: file.name, storage_path: path, version, uploaded_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw new Error(getErrorMessage(error));
      return data as SvgFile;
    },
    onSuccess: (svg) => {
      qc.invalidateQueries({ queryKey: ['svg_files', projectId] });
      void logActivity('upload_svg', `Cargó un nuevo plano SVG (v${svg.version})`, {
        projectId: projectId!,
        usuario: profile?.nombre || profile?.email || 'Usuario',
        metadata: { svgId: svg.id, nombre: svg.nombre },
      });
      toast.success('Plano cargado', `${svg.nombre} (v${svg.version})`);
    },
    onError: (e) => toast.error('Error al subir el plano', getErrorMessage(e)),
  });
}

export function useUploadExcel(projectId: string | null) {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (file: File): Promise<ExcelFile> => {
      if (!projectId) throw new Error('Selecciona un proyecto primero.');
      const buffer = await file.arrayBuffer();
      const { lots, warnings } = await parseSpreadsheet(buffer, file.name);
      if (lots.length === 0) {
        throw new Error(warnings[0] || 'El archivo no contiene lotes válidos.');
      }

      const existing = qc.getQueryData<ExcelFile[]>(['excel_files', projectId]);
      const version = nextVersion(existing);
      const path = `${projectId}/excel/v${version}-${Date.now()}-${sanitizeName(file.name)}`;

      const { error: upErr } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(path, file, { upsert: false });
      if (upErr) throw new Error(getErrorMessage(upErr));

      const { data, error } = await supabase
        .from('excel_files')
        .insert({
          project_id: projectId,
          nombre: file.name,
          storage_path: path,
          version,
          rows_count: lots.length,
          uploaded_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw new Error(getErrorMessage(error));
      return data as ExcelFile;
    },
    onSuccess: (excel) => {
      qc.invalidateQueries({ queryKey: ['excel_files', projectId] });
      void logActivity('upload_excel', `Cargó un nuevo Excel con ${excel.rows_count} lotes (v${excel.version})`, {
        projectId: projectId!,
        usuario: profile?.nombre || profile?.email || 'Usuario',
        metadata: { excelId: excel.id, nombre: excel.nombre },
      });
      toast.success('Excel cargado', `${excel.rows_count} lotes importados (v${excel.version})`);
    },
    onError: (e) => toast.error('Error al subir el Excel', getErrorMessage(e)),
  });
}

function sanitizeName(name: string): string {
  return name.normalize('NFD').replace(/[^\w.\-]/g, '_');
}
