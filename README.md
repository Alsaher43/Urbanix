# Urbanix

**Plataforma Inteligente de Gestión Inmobiliaria.**

Visualiza y administra desarrollos inmobiliarios: planos SVG interactivos, estados de
lotes, datos de Excel, historial de actividad, usuarios y permisos — con la calidad de un
producto SaaS profesional.

> Urbanix es la evolución del flujo de trabajo del script `Colorear_Lotes.jsx`: lo que antes
> coloreaba lotes en Illustrator, ahora vive en una plataforma web colaborativa, en tiempo real
> y con control de acceso.

---

## 🧱 Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS + design system con tokens (CSS variables) |
| Estado servidor | TanStack Query |
| Estado UI | Zustand (persistido) |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Routing | React Router v6 |
| Iconos | lucide-react · Excel: SheetJS (xlsx) |

---

## 🚀 Puesta en marcha

### 1. Requisitos
- **Node.js 18.17+** y npm. (Descárgalo en https://nodejs.org — instala la versión LTS.)
- Una cuenta gratuita en **Supabase** (https://supabase.com).

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase
1. Crea un proyecto en Supabase.
2. Ve a **SQL Editor → New query** y ejecuta **en orden** los archivos de
   [`supabase/migrations/`](supabase/migrations):
   1. [`0001_init.sql`](supabase/migrations/0001_init.sql) — tablas, RLS, triggers y bucket de Storage.
   2. [`0002_lot_overrides.sql`](supabase/migrations/0002_lot_overrides.sql) — edición de estados in-app.
   3. [`0003_multitenant_audit.sql`](supabase/migrations/0003_multitenant_audit.sql) — multi-inmobiliaria
      (organizaciones + RLS por org), permisos trabajador/gerente y auditoría. Es retrocompatible:
      tus datos actuales se agrupan en una organización por defecto.

   Para ver cambios en vivo entre usuarios, añade `lot_overrides` a la publicación
   `supabase_realtime` (Database → Replication).

### 🏢 Multi-inmobiliaria (SaaS)
Tras la migración 0003, cada usuario pertenece a una **inmobiliaria** y sus datos quedan aislados por
RLS. Para dar de alta una **nueva empresa**: crea la organización
(`insert into public.organizations (nombre) values ('…');`) y luego el usuario gerente en
**Authentication → Users** con *User Metadata* `{ "org_id": "<id>", "rol": "gerente", "nombre": "…" }`;
sus trabajadores se crean con `{ "org_id": "<misma-org>" }`. El **trabajador** puede crear proyectos
y subir Excel/planos, pero **no** editar estados/precios/financiamientos (eso es solo del gerente).
3. Ve a **Authentication → Users → Add user** y crea tu usuario gerente
   (el **primer** usuario registrado se convierte en GERENTE automáticamente).
4. En **Project Settings → API** copia la *Project URL* y la *anon public key*.

### 4. Variables de entorno
```bash
cp .env.example .env
```
Rellena `.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_SUPABASE_BUCKET=urbanix-files
```

### 5. Arrancar
```bash
npm run dev      # http://localhost:5173
npm run build    # build de producción
npm run preview  # previsualizar el build
```

Si abres la app sin configurar `.env`, Urbanix muestra una **pantalla de configuración guiada**
en lugar de fallar.

### 🟣 Modo demo (sin Supabase)
¿Quieres verlo funcionando ya? Arranca con `npm run dev` y entra a **`/demo`** (o pulsa
"Ver demo" en el login). Carga un proyecto de ejemplo ("Urbanización Las Palmas") con plano SVG y
18 lotes con estados variados — sin base de datos. Datos de muestra para subir a tu Supabase real
en [`public/samples/lotes-demo.csv`](public/samples/lotes-demo.csv).

---

## 👥 Roles

| | Gerente | Trabajador |
| --- | :---: | :---: |
| Ver planos / lotes / buscar | ✅ | ✅ |
| Subir SVG / Excel | ✅ | ❌ |
| Crear proyectos | ✅ | ❌ |
| Exportar | ✅ | ❌ |
| Configurar leyenda / colores | ✅ | ❌ |
| Gestionar usuarios y roles | ✅ | ❌ |

Los botones y rutas se ocultan automáticamente según el rol (`RoleGate` + `ProtectedRoute`).

---

## 🗂️ Convención de archivos

- **Plano SVG**: cada lote es una forma cuyo `id` coincide con el `lote_id` del Excel
  (p. ej. `id="A-1"`). El matching es tolerante (normaliza mayúsculas/acentos y prueba prefijos
  comunes como `lote`, `mz`…), así que no requiere un prefijo fijo.
- **Excel/CSV**: la primera fila son encabezados; las columnas se autodetectan (tolerante a
  acentos/mayúsculas):

  | Columna | Se detecta por | Descripción |
  | --- | --- | --- |
  | `lote_id` | id, lote, cod, num, manz… | Coincide con el id del SVG |
  | `estado` | estado, status, condicion… | Disponible, Vendido, Reservado… |
  | `precio` | precio, valor, monto… | Valor numérico (opcional) |
  | `financiamiento` | financ, pago, modalidad… | Contado, Directo (opcional) |

  Cualquier otra columna se conserva y se muestra en el detalle del lote.

### Leyendas (dos dimensiones, colores del Valora original)
El plano se puede colorear por **Estado** o por **Financiamiento** (conmutador en el panel):

| Estado | Color | | Financiamiento | Color |
| --- | --- | --- | --- | --- |
| Disponible / Libre | 🟢 verde `#10B981` | | Contado | 🟢 verde `#10B981` |
| Vendido | 🔴 rojo `#EF4444` | | Financiamiento Directo | 🔵 azul `#3B82F6` |
| Reservado / Separado | 🟠 ámbar `#F59E0B` | | | |
| Bloqueado | ⚪ gris `#94A3B8` | | | |

Los valores no reconocidos reciben un color estable de paleta. Todos los colores son editables
en **Configuración → Leyenda del plano**.

---

## 📁 Arquitectura

```
src/
├── components/        # UI primitives + layout + guards
│   ├── ui/            # Button, Input, Card, Badge, Modal, Toaster…
│   ├── layout/        # Sidebar, Topbar, AppLayout, PageHeader
│   └── auth/          # ProtectedRoute, RoleGate
├── config/            # lotStatus (dominio), navigation
├── context/           # AuthContext
├── features/          # páginas por dominio (dashboard, visualizer, data, …)
├── hooks/             # data hooks (React Query) + useActiveProject/Data
├── lib/               # supabase client, activity, format, cn
├── store/             # zustand (ui, toast, legend)
├── types/             # tipos de dominio
└── utils/             # excel, svg, exportCsv
```

Principios: una sola fuente de verdad para el design system; lógica de dominio pura y testeable
(`config/lotStatus.ts`, `utils/`); estado de servidor cacheado con React Query; "memoria" de la
plataforma (último proyecto/SVG/Excel) persistida en `localStorage`.

---

## 🔒 Seguridad

- **RLS activado** en todas las tablas. La clave `anon` es segura en el cliente: las políticas
  restringen lectura/escritura por rol.
- Los SVG subidos se **sanean** (se eliminan `<script>` y handlers `on*`) antes de renderizarse.
- La escritura en Storage y tablas de negocio requiere rol gerente, verificado en la base de datos
  (`is_manager()`), no solo en la UI.
