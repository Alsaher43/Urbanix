import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePref = 'light' | 'dark' | 'system';

interface UiState {
  theme: ThemePref;
  sidebarCollapsed: boolean;

  /* ── "Memoria" de la plataforma ── */
  lastProjectId: string | null;
  lastSvgId: string | null;
  lastExcelId: string | null;

  setTheme: (t: ThemePref) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  rememberProject: (projectId: string | null) => void;
  rememberSvg: (svgId: string | null) => void;
  rememberExcel: (excelId: string | null) => void;
}

/**
 * Estado de UI persistido en localStorage. Aquí vive la "memoria" de la web:
 * el último proyecto, SVG y Excel abiertos se recuerdan entre sesiones para
 * que el usuario no tenga que volver a subir/elegir archivos cada vez.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      lastProjectId: null,
      lastSvgId: null,
      lastExcelId: null,

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      rememberProject: (lastProjectId) => set({ lastProjectId, lastSvgId: null, lastExcelId: null }),
      rememberSvg: (lastSvgId) => set({ lastSvgId }),
      rememberExcel: (lastExcelId) => set({ lastExcelId }),
    }),
    {
      name: 'urbanix.ui',
      version: 1,
    },
  ),
);
