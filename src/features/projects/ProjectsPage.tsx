import { useRef, useState, type FormEvent } from 'react';
import {
  FolderKanban, FolderPlus, Map, FileSpreadsheet, UploadCloud, Check, Clock, MapPin,
} from 'lucide-react';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useCreateProject } from '@/hooks/useProjects';
import { useSvgFiles, useExcelFiles, useUploadSvg, useUploadExcel } from '@/hooks/useFiles';
import { useUiStore } from '@/store/uiStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { formatRelative, formatDateTime } from '@/lib/format';
import { toast } from '@/store/toastStore';
import type { SvgFile, ExcelFile } from '@/types';
import { cn } from '@/lib/cn';

export function ProjectsPage() {
  const { projects, project, projectId, setProject, hasProjects } = useActiveProject();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Proyectos"
        description="Tus desarrollos inmobiliarios y sus archivos"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <FolderPlus className="h-4 w-4" /> Nuevo proyecto
          </Button>
        }
      />

      {!hasProjects ? (
        <EmptyState
          icon={FolderKanban}
          title="Aún no hay proyectos"
          description="Crea tu primer proyecto para empezar a cargar planos y lotes."
          action={<Button onClick={() => setCreateOpen(true)}><FolderPlus className="h-4 w-4" /> Crear proyecto</Button>}
          className="mt-6"
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setProject(p.id)}
                className={cn(
                  'card group p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                  p.id === projectId && 'ring-2 ring-brand',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  {p.id === projectId && <Badge tone="brand" dot>Activo</Badge>}
                </div>
                <h3 className="mt-3 font-semibold text-content">{p.nombre}</h3>
                {p.ubicacion && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-content-3">
                    <MapPin className="h-3 w-3" /> {p.ubicacion}
                  </p>
                )}
                {p.descripcion && <p className="mt-2 line-clamp-2 text-sm text-content-2">{p.descripcion}</p>}
                <p className="mt-3 text-2xs text-content-3">Actualizado {formatRelative(p.updated_at)}</p>
              </button>
            ))}
          </div>

          {project && (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <FilesCard kind="svg" projectId={projectId!} title="Planos SVG" />
              <FilesCard kind="excel" projectId={projectId!} title="Archivos Excel" />
            </div>
          )}
        </>
      )}

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

/* ─────────────── Tarjeta de archivos (SVG o Excel) ─────────────── */
function FilesCard({ kind, projectId, title }: { kind: 'svg' | 'excel'; projectId: string; title: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const svgQ = useSvgFiles(kind === 'svg' ? projectId : null);
  const excelQ = useExcelFiles(kind === 'excel' ? projectId : null);
  const uploadSvg = useUploadSvg(projectId);
  const uploadExcel = useUploadExcel(projectId);

  const rememberSvg = useUiStore((s) => s.rememberSvg);
  const rememberExcel = useUiStore((s) => s.rememberExcel);
  const lastSvgId = useUiStore((s) => s.lastSvgId);
  const lastExcelId = useUiStore((s) => s.lastExcelId);

  const files = kind === 'svg' ? svgQ.data ?? [] : excelQ.data ?? [];
  const loading = kind === 'svg' ? svgQ.isLoading : excelQ.isLoading;
  const uploading = kind === 'svg' ? uploadSvg.isPending : uploadExcel.isPending;
  const activeId = kind === 'svg' ? (lastSvgId ?? files[0]?.id) : (lastExcelId ?? files[0]?.id);
  const Icon = kind === 'svg' ? Map : FileSpreadsheet;
  const accept = kind === 'svg' ? '.svg,image/svg+xml' : '.xlsx,.xls,.csv';

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (kind === 'svg') uploadSvg.mutate(file);
    else uploadExcel.mutate(file);
    e.target.value = '';
  };

  const setActive = (id: string) => {
    if (kind === 'svg') rememberSvg(id);
    else rememberExcel(id);
    toast.info('Versión activada', 'El plano usará esta versión.');
  };

  return (
    <Card>
      <CardHeader
        title={title}
        description={kind === 'svg' ? 'Lotes con id = lote_id (ej. A-1 o FILL_A-1)' : 'Columnas: lote_id, estado, precio, financiamiento'}
        action={
          <>
            <Button variant="secondary" size="sm" loading={uploading} onClick={() => inputRef.current?.click()}>
              <UploadCloud className="h-4 w-4" /> Subir
            </Button>
            <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onPick} />
          </>
        }
      />
      <CardBody className="pt-0">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : files.length === 0 ? (
          <EmptyState icon={Icon} title="Sin archivos" description="Aún no se ha subido ningún archivo." className="border-0 py-8" />
        ) : (
          <ul className="divide-y divide-border">
            {files.map((f: SvgFile | ExcelFile) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-content-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-content">{f.nombre}</p>
                    <p className="flex items-center gap-1.5 text-2xs text-content-3" title={formatDateTime(f.created_at)}>
                      <Clock className="h-3 w-3" /> v{f.version} · {formatRelative(f.created_at)}
                      {'rows_count' in f && ` · ${f.rows_count} lotes`}
                    </p>
                  </div>
                </div>
                {activeId === f.id ? (
                  <Badge tone="success" dot>En uso</Badge>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setActive(f.id)}>
                    <Check className="h-3.5 w-3.5" /> Usar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

/* ─────────────── Modal de creación ─────────────── */
function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateProject();
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const setProject = useUiStore((s) => s.rememberProject);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (nombre.trim().length < 2) return;
    const project = await create.mutateAsync({ nombre: nombre.trim(), ubicacion: ubicacion.trim() || undefined, descripcion: descripcion.trim() || undefined });
    setProject(project.id);
    setNombre(''); setUbicacion(''); setDescripcion('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo proyecto"
      description="Crea un desarrollo inmobiliario."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button form="create-project" type="submit" loading={create.isPending} disabled={nombre.trim().length < 2}>
            Crear proyecto
          </Button>
        </>
      }
    >
      <form id="create-project" onSubmit={submit} className="space-y-4">
        <Input label="Nombre del proyecto" placeholder="Ej. Urbanización Las Palmas" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
        <Input label="Ubicación (opcional)" placeholder="Ej. Lima, Perú" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
        <Input label="Descripción (opcional)" placeholder="Breve descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </form>
    </Modal>
  );
}
