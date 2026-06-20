import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { SetupPage } from '@/features/auth/SetupPage';
import { DemoPage } from '@/features/demo/DemoPage';

import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { VisualizerPage } from '@/features/visualizer/VisualizerPage';
import { DataTablePage } from '@/features/data/DataTablePage';
import { HistoryPage } from '@/features/history/HistoryPage';
import { UsersPage } from '@/features/users/UsersPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { NotFoundPage } from '@/features/misc/NotFoundPage';

export function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Privadas (cualquier rol autenticado) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="proyectos" element={<ProjectsPage />} />
          <Route path="plano" element={<VisualizerPage />} />
          <Route path="lotes" element={<DataTablePage />} />
          <Route path="historial" element={<HistoryPage />} />
        </Route>
      </Route>

      {/* Privadas solo gerente */}
      <Route element={<ProtectedRoute allow={['gerente']} />}>
        <Route element={<AppLayout />}>
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
