# Requerimiento — Configuración de Página (documento)

Contrato de producto para tamaño de hoja, orientación, márgenes y fondo.  
Complementa `REQUERIMIENTO-BUILDER.md`.

**Estado:** cerrado (implementado)  
**Fecha:** 2026-07-17  
**Usuario objetivo:** cliente de negocio (panel Documento, sin HTML)

---

## 1. Qué es (y qué no es)

| Es | No es |
|---|---|
| Ajuste de **plantilla / documento** | Bloque de la paleta DnD |
| Define el **lienzo** donde viven Contenedor, Datos, Tabla, Texto, Espacio | Un bloque arrastrable o duplicable |

La paleta sigue siendo solo: Contenedor, Datos, Tabla, Texto, Espacio.

---

## 2. UI

- Vive **siempre arriba** en el **panel Documento** (fijo, no modal, no solo Avanzado).
- Controles claros en español (es-CO): tamaño, orientación, márgenes, fondo.
- Al cambiar valores → preview se actualiza con debounce (misma regla del editor).

---

## 3. Tamaños de página (presets)

| Id | Etiqueta UI | Dimensiones (vertical) |
|---|---|---|
| `a4` | A4 | 210 × 297 mm |
| `carta` | Carta | 216 × 279 mm (8.5 × 11 in) |
| `oficio-co` | Oficio CO | 216 × 330 mm |
| `legal` | Legal | 216 × 356 mm (8.5 × 14 in) |
| `custom` | Personalizado | ancho × alto en mm (inputs) |

### 3.1 Orientación
- `vertical` | `horizontal`
- En horizontal se **intercambian** ancho y alto del preset (o del personalizado).

---

## 4. Márgenes

- **4 lados independientes** en mm: superior, inferior, izquierdo, derecho.
- **Sin padding de página** (solo márgenes).
- Default: **5 mm** en los cuatro lados.
- El cliente puede modificar cada lado en el panel Documento.

---

## 5. Fondo

- Color de fondo editable (color picker).
- Default: `#ffffff`.
- Sin imagen de fondo / marca de agua en este req (fuera de alcance MVP).

---

## 6. Defaults (plantilla nueva)

| Propiedad | Valor |
|---|---|
| Tamaño | **Carta** |
| Orientación | **Vertical** |
| Márgenes | **5 mm** (4 lados, editables) |
| Fondo | `#ffffff` |

---

## 7. Preview y fidelidad

### 7.1 Preview en editor
- Muestra un **lienzo a tamaño real** de la página (proporción mm → CSS).
- **Guías de margen** visibles (línea / área sombreada).
- Las guías son **solo UI de preview**: **no** van al HTML/PDF final ni al HTML descargado.

### 7.2 HTML / CSS generado
- Se emite `@page` con tamaño y márgenes en **mm**.
- El `body`/página refleja tamaño, márgenes y `background-color`.
- Al **Descargar HTML**, el CSS (incl. `@page`) va **embebido dentro del HTML** (`<style>`) para que no se pierda al abrir en el navegador.

### 7.3 Persistencia
- La fuente de verdad persistida es el **CSS generado** (campo `css` de la versión + embebido en HTML exportado).
- **No** hay `pageJson` obligatorio en el store.
- Al **reabrir** un borrador, el panel Documento **parsea** el CSS guardado (`@page`, tamaño, márgenes, fondo) para rehidratar la UI.
- Si el parse falla → aplicar defaults (sección 6).

---

## 8. Modelo en memoria (editor)

Contrato tipado para UI y serialización (no necesariamente persistido aparte):

```ts
type PageSizeId = 'a4' | 'carta' | 'oficio-co' | 'legal' | 'custom'

type PageOrientation = 'vertical' | 'horizontal'

type PageMarginsMm = {
  top: number
  right: number
  bottom: number
  left: number
}

type PageSettings = {
  sizeId: PageSizeId
  widthMm: number
  heightMm: number
  orientation: PageOrientation
  margins: PageMarginsMm
  background: string // #RRGGBB
}
```

- Con presets, `widthMm`/`heightMm` se derivan del preset + orientación.
- Con `custom`, el usuario edita `widthMm`/`heightMm` directamente.

---

## 9. CSS de salida (contrato)

Ejemplo orientativo (valores dinámicos):

```css
@page {
  size: 216mm 279mm; /* Carta vertical */
  margin: 5mm 5mm 5mm 5mm; /* top right bottom left */
}

html, body {
  margin: 0;
  padding: 0;
  background: #ffffff;
}

/* Lienzo de contenido en preview/HTML pantalla:
   width/height según página; padding = márgenes */
.page {
  width: 216mm;
  min-height: 279mm;
  box-sizing: border-box;
  padding: 5mm 5mm 5mm 5mm;
  background: #ffffff;
}
```

- Impresión/PDF: `@page` manda.
- Pantalla/preview/descarga: caja `.page` (o equivalente) replica tamaño + márgenes + fondo.
- Guías de margen: markup/CSS **solo** inyectado en el iframe de preview del editor, nunca en el HTML descargado.

---

## 10. Decisiones cerradas (cuestionario)

1. Ajuste de plantilla, no bloque de paleta  
2. Presets A4 / Carta / Oficio CO / Legal + personalizado mm  
3. Orientación vertical y horizontal  
4. Márgenes independientes 4 lados  
5. Sin padding de página  
6. UI fija arriba en panel Documento  
7. Fondo color editable  
8. Preview tamaño real + `@page` en HTML  
9. Default: Carta vertical, márgenes 5 mm, blanco  
10. Persistencia en CSS; CSS embebido en HTML  
11. Reabrir = parsear CSS  
12. Oficio CO y Legal ambos en selector  
13. Guías de margen solo en preview  

---

## 11. Criterio de aceptación

- [x] Panel Documento arriba con tamaño, orientación, márgenes (4), fondo  
- [x] Presets A4, Carta, Oficio CO, Legal + personalizado  
- [x] Vertical / horizontal intercambian dimensiones  
- [x] Preview muestra hoja a escala real  
- [x] Guías de margen visibles solo en preview del editor  
- [x] CSS generado incluye `@page` + estilos de página en mm  
- [x] Descargar HTML incluye CSS embebido (no depende de archivo .css externo)  
- [x] Reabrir borrador rehidrata panel desde CSS (o defaults si falla)  
- [x] Defaults: Carta vertical, 5 mm, `#ffffff`  
- [x] No aparece “Página” en la paleta DnD  

---

## 12. Próximo paso

Implementación lista en el builder (panel Documento + CSS `@page` + guías en preview).
