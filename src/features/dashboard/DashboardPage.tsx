import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, CheckCircle2, Home, TrendingUp, Map, FolderPlus, ArrowRight } from 'lucide-react';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useActiveData, computeLotStats } from '@/hooks/useActiveData';
import { useHistorial } from '@/hooks/useActivity';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { KpiCard } from './KpiCard';
import { StatusDistribution } from './StatusDistribution';
import { ActivityFeed } from '@/features/history/ActivityFeed';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format';

export function DashboardPage() {
  const { isManager } = useAuth();
  const { projectId, project, hasProjects, isLoading: loadingProjects } = useActiveProject();
  const { lots, hasExcel, isLoading, isLoadingLots } = useActiveData(projectId);
  const { data: historial = [], isLoading: loadingHist } = useHistorial(projectId, 6);

  const stats = useMemo(() => computeLotStats(lots), [lots]);
  const tasaVenta = stats.total > 0 ? stats.vendidos / stats.total : 0;

  if (loadingProjects) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!hasProjects) {
    return (
      <EmptyState
        icon={FolderPlus}
        title="Aún no hay proyectos"
        description={
          isManager
            ? 'Crea tu primer desarrollo inmobiliario para empezar a cargar planos y lotes.'
            : 'Pide a tu gerente que cree un proyecto y cargue los planos.'
        }
        action={
          isManager ? (
            <Link to="/proyectos">
              <Button>
                <FolderPlus className="h-4 w-4" /> Crear proyecto
              </Button>
            </Link>
          ) : undefined
        }
        className="mt-10"
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={project ? `Resumen de ${project.nombre}` : 'Resumen general'}
        actions={<ProjectSwitcher />}
      />

      {!hasExcel && !isLoading ? (
        <EmptyState
          icon={Map}
          title="Sin datos cargados"
          description={
            isManager
              ? 'Carga un Excel de lotes para ver las métricas del proyecto.'
              : 'Tu gerente aún no ha cargado datos en este proyecto.'
          }
          action={
            isManager ? (
              <Link to="/proyectos">
                <Button>Ir a archivos</Button>
              </Link>
            ) : undefined
          }
          className="mt-4"
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Lotes totales" value={formatNumber(stats.total)} icon={LayoutGrid} accent="brand" />
            <KpiCard label="Disponibles" value={formatNumber(stats.disponibles)} icon={Home} accent="success" />
            <KpiCard label="Vendidos" value={formatNumber(stats.vendidos)} icon={CheckCircle2} accent="info" />
            <KpiCard label="Tasa de venta" value={formatPercent(tasaVenta, 0)} icon={TrendingUp} accent="warning" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Distribución por estado"
                description="Proporción de lotes según su estado actual"
              />
              <CardBody>
                {isLoadingLots ? (
                  <div className="space-y-3">
                    <div className="skeleton h-3 w-full rounded-full" />
                    <div className="skeleton h-24 w-full" />
                  </div>
                ) : (
                  <StatusDistribution stats={stats} />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Actividad reciente" />
              <CardBody className="pt-1">
                <ActivityFeed entries={historial} loading={loadingHist} />
                {historial.length > 0 && (
                  <Link
                    to="/historial"
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium text-brand hover:bg-surface-2"
                  >
                    Ver todo el historial <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </CardBody>
            </Card>
          </div>

          {stats.valorTotal > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Card className="p-5">
                <p className="text-sm text-content-2">Valor del inventario</p>
                <p className="mt-1 text-2xl font-bold text-content">{formatCurrency(stats.valorTotal)}</p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-content-2">Valor colocado</p>
                <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(stats.valorVendido)}</p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-content-2">Reservados / separados</p>
                <p className="mt-1 text-2xl font-bold text-content">{formatNumber(stats.reservados)}</p>
              </Card>
            </div>
          )}
        </>
      )}
    </>
  );
}
