# Plan Frontend — BTW Template Studio

Documento vivo. Léelo antes de cada sprint. Si algo cambia de alcance, actualízalo aquí.

---

## 1. Objetivo del front

Permitir que un **usuario funcional** (y luego el cliente en modo branding) gestione representaciones PDF **sin depender de un desarrollador** para cambios visuales rutinarios.

El front NO genera el PDF final en producción: orquesta plantillas, preview y llamadas al backend. El render fiel lo hace el API (.NET + Playwright).

---

## 2. Principio de producto (importante)

**Contrato del builder:** ver `front/REQUERIMIENTO-BUILDER.md` (fuente de verdad).

El cliente arma PDFs con bloques visuales. HTML/CSS/data van por debajo.

### Set cerrado de bloques
Contenedor · Datos · Tabla · Texto · Espacio

### Estrategia
| Capa | Qué es |
|---|---|
| **Principal** | Builder DnD según requerimiento |
| **Avanzado** | Monaco (opcional) |
| **Luego** | Branding + PDF Lab + preview PDF API |

---

## 3. Stack

| Pieza | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router |
| Data fetching | TanStack Query |
| Editor código | Monaco (`@monaco-editor/react`) |
| Estilos | CSS Modules o CSS variables propias (sin theme púrpura genérico) |
| DnD (fase C) | `@dnd-kit/core` + modelo de bloques propio **o** GrapesJS embebido (decidir en spike) |
| Preview PDF | iframe / object + blob URL desde API |
| Auth (luego) | JWT en header; mock de roles al inicio |

### Decisión pendiente (spike 1–2 días, fase C)
- **Opción 1:** GrapesJS → más rápido de “verse builder”, menos control, más deuda.
- **Opción 2:** Canvas propio con bloques (`Header`, `Table`, `Text`, `Logo`) + `@dnd-kit` → más trabajo, más control, mejor narrativa técnica.

**Recomendación para olimpiadas:** Opción 2 acotada (4–6 bloques), no un Figma clon.

---

## 4. Estructura de carpetas (target)

```
front/
  PLAN.md                 ← este archivo
  package.json
  vite.config.ts
  index.html
  src/
    main.tsx
    App.tsx
    styles/
      tokens.css          # colores, tipografía, spacing
      global.css
    app/
      router.tsx
      providers.tsx
    pages/
      TemplateListPage.tsx
      TemplateEditorPage.tsx
      BrandingPage.tsx
      PdfLabPage.tsx        # consola demo: JSON → PDF
    features/
      templates/
        api.ts
        types.ts
        hooks.ts
        components/
      editor/
        CodeEditor.tsx      # Monaco
        SchemaEditor.tsx
        PreviewHtml.tsx
        PreviewPdf.tsx
        PublishBar.tsx
      branding/
        BrandingForm.tsx
      visual-builder/       # FASE C
        BlockPalette.tsx
        Canvas.tsx
        BlockRenderer.tsx
        serializeToHtml.ts
        types.ts
    shared/
      ui/                   # botones, layout, etc.
      lib/api-client.ts
      mocks/                # datos fake hasta que exista backend
```

---

## 5. Pantallas y criterios de aceptación

### P0 — Lista de plantillas
- Ver nombre, tipo documental, estado (`draft` / `published`), versión
- Crear / clonar / abrir editor
- **Done when:** lista mock + navegación al editor

### P0 — Editor (capa A)
- Tabs o paneles: HTML | CSS | Schema JSON | Datos de ejemplo
- Preview HTML en vivo (debounce 300–500ms)
- Botón Preview PDF → llama API (o mock blob)
- Guardar draft / Publicar versión (UI lista; API mockeable)
- **Done when:** editas HTML, ves preview, “publicas” y queda versión en mock store

### P1 — Branding
- Logo URL/upload, color primario, fuente
- Preview aplicando CSS variables sobre plantilla
- **Done when:** cambio de color/logo se refleja sin tocar HTML estructural

### P1 — PDF Lab (demo jurado)
- Textarea JSON + templateId
- Generar / descargar PDF
- **Done when:** flujo demo en < 30s

### P2 — Visual builder (capa C / DnD)
- Paleta de bloques
- Drag al canvas
- Selección + props (texto, ancho, visible)
- Serializar canvas → HTML/CSS de plantilla
- Sync opcional: “abrir en código” / “regenerar desde bloques”
- **Done when:** armar una factura simple solo con bloques y generar preview PDF

---

## 6. Plan de sprints (orden fijo)

### Sprint 0 — Setup (hoy)
- [x] Carpeta `front/`
- [x] Vite + React + TS (scaffold manual; Node local no soporta create-vite latest)
- [x] Tokens CSS + layout shell (sidebar + main)
- [x] Router con rutas placeholder
- [x] `PLAN.md` (este archivo)
- [x] Verificar `npm run build`

### Sprint 1 — Editor estructural + builder visual
- [x] Tipos `Template`, `TemplateVersion` (+ `blocksJson`)
- [x] Mock store en localStorage
- [x] Monaco como vista Avanzado
- [x] Preview HTML con debounce + sample es-CO
- [x] Lista + crear plantilla
- [x] Dirty state, toasts, atajos ⌘/Ctrl+S, publicar versión
- [x] **Builder DnD principal** (bloques → HTML/CSS)

### Sprint 2 — Preview PDF + branding + lab
- [ ] Cliente API (`VITE_API_URL`)
- [ ] Preview PDF (real o stub)
- [ ] Branding page
- [ ] PdfLabPage para demo

### Sprint 3 — Visual builder (DnD)
- [ ] Spike GrapesJS vs canvas propio (decidir en 1 día)
- [ ] Modelo de bloques + palette
- [ ] Canvas DnD
- [ ] `serializeToHtml`
- [ ] Integrar con publish del editor

### Sprint 4 — Pulido demo
- [ ] Roles mock (Funcional vs Cliente)
- [ ] Estados de carga / error
- [ ] Flujo guiado para presentación (script de demo)

---

## 7. Contratos con el backend (front asume esto)

```ts
// Preview / generate
POST /api/pdf/preview
POST /api/pdf/generate
POST /api/pdf/regenerate

// Templates
GET/POST /api/templates
GET/PUT  /api/templates/:id
POST     /api/templates/:id/versions
POST     /api/templates/:id/publish
```

Hasta que el API exista: **mocks en `src/shared/mocks`**. No bloquear UI por backend.

Variables:
```
VITE_API_URL=http://localhost:8080
VITE_USE_MOCKS=true
```

---

## 8. Reglas de implementación (para no divertirnos de más)

1. **Una pantalla, un propósito.** Nada de dashboard con 12 widgets.
2. **Preview PDF es sagrado.** Si el builder no puede preview, no está listo.
3. **Versionado visible en UI.** Nunca editar “la publicada” en silencio.
4. **DnD solo con bloques de negocio** (encabezado, datos emisor, tabla ítems, totales, pie, logo). No free-draw infinito.
5. **Serialización determinista.** Mismo canvas → mismo HTML (clave para consistencia histórica).
6. **Docker/amd64 es del backend.** El front se sirve como estáticos (nginx) en compose más adelante.
7. No inventar micro-frontends.

---

## 9. Riesgos del drag & drop (léelo antes de Sprint 3)

| Riesgo | Mitigación |
|---|---|
| Canvas ≠ PDF final | Siempre validar con Preview PDF del API |
| Scope creep visual | Máx. 6 tipos de bloque en MVP builder |
| Undo/redo complejo | Empezar con historial simple (stack de snapshots) |
| GrapesJS difícil de domesticar | Spike timeboxed 1 día; si duele, canvas propio |
| HTML sucio | `serializeToHtml` centralizado + sanitización en backend |

---

## 10. Definición de “listo para presentar”

Checklist mínimo del front en la olimpiada:
- [ ] Listar y abrir plantilla
- [ ] Editar HTML/CSS y ver preview
- [ ] Publicar versión (aunque sea mock)
- [ ] Cambiar branding y ver efecto
- [ ] Generar/descargar PDF de demo
- [ ] (Bonus) Armar layout básico con DnD

Arquitectura + costos + demo de estos puntos > builder perfecto incompleto.

---

## 11. Comandos

```bash
cd front
npm install
npm run dev
```

Build:
```bash
npm run build
```

---

## 12. Próximo paso inmediato

1. Dejar `npm run dev` funcionando.
2. Shell de app + rutas.
3. `TemplateEditorPage` con Monaco + preview HTML mock.

Cuando eso esté, recién hablamos de DnD en serio.
