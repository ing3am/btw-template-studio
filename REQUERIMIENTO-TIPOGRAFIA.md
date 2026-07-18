# Requerimiento — Tipografía editable (todo texto)

Contrato de producto para estilos de texto en el builder.  
Complementa `REQUERIMIENTO-BUILDER.md`.

**Estado:** cerrado (pendiente de implementar)  
**Fecha:** 2026-07-17  
**Objetivo:** fidelidad HTML → PDF (estilos explícitos en el HTML guardado)

---

## 1. Alcance: qué es “texto”

Tipografía editable en **todo lo visible del documento**:

| Superficie | Estilo editable |
|---|---|
| Título del **Contenedor** | Sí |
| Título del bloque **Datos** | Sí |
| **Etiqueta** de cada fila Datos | Sí (independiente) |
| **Valor** de cada fila Datos | Sí (independiente) |
| Título de cada **columna** de Tabla | Sí (por columna) |
| **Celdas** de cada columna de Tabla | Sí (por columna) |
| Contenido del bloque **Texto** | Sí |
| Bloque **Espacio** | No aplica (no es texto) |

---

## 2. Propiedades tipográficas (set cerrado)

Por cada unidad de texto:

| Propiedad | UI | Persistencia en HTML |
|---|---|---|
| **Color** | color picker | `color: #RRGGBB` |
| **Tamaño** | presets + px personalizado | `font-size: Npx` (siempre px reales) |
| **Negrita** | toggle | `font-weight: 700` / `400` |
| **Cursiva** | toggle | `font-style: italic` / `normal` |
| **Subrayado** | toggle | `text-decoration: underline` / `none` |
| **Alineación** | izq / centro / der | `text-align: left\|center\|right` |

### 2.1 Tamaño (fidelidad PDF)
- Presets solo como atajos; **siempre** se guardan como px.
- Escala densa (factura impresa): ver **`REQUERIMIENTO-MEDIDAS.md`**
  - Pequeño → `8px`
  - Normal → `9px`
  - Grande → `11px`
  - Título → `12px`
- Opción **Personalizado**: input numérico en px.
- El HTML/PDF nunca depende de nombres de preset; solo de `font-size` en px.

### 2.2 Modelo de estilo (sugerido en blocksJson)

```ts
type TextStyle = {
  color: string       // "#14201a"
  fontSizePx: number  // 9
  bold: boolean
  italic: boolean
  underline: boolean
  align: 'izquierda' | 'centro' | 'derecha'
}
```

Defaults: todo texto nuevo en **9px** (contrato `REQUERIMIENTO-MEDIDAS.md`).  
Colores de marca del producto (muted / ink / accent) se definen en tokens del builder.

---

## 3. Nivel de configuración

### 3.1 Datos
Por **cada fila**:
- `labelStyle: TextStyle`
- `valueStyle: TextStyle`

Independientes (ej. etiqueta chica gris + valor grande negro).

### 3.2 Tabla
Por **cada columna**:
- `headerStyle: TextStyle` (título de columna)
- `cellStyle: TextStyle` (celdas de esa columna)

### 3.3 Texto
- `contentStyle: TextStyle` sobre el contenido del bloque.

### 3.4 Títulos de bloque
- Contenedor: `titleStyle: TextStyle` (si hay título)
- Datos: `titleStyle: TextStyle` (si hay título)

---

## 4. Relación con “Formato” de dato

**Formato de valor** (semántica del dato), separado de tipografía:

| Formato | Valores |
|---|---|
| `ninguno` | sin transformación |
| `moneda` | locale `es-CO`, COP |
| `fecha` | locale `es-CO` |

**Eliminado de Formato:** `negrita`  
La negrita vive **solo** en tipografía (`bold`), para no duplicar ni conflictuar.

Orden de aplicación al render:
1. Resolver valor (texto libre o binding JSON)
2. Aplicar formato dato (moneda/fecha) si aplica
3. Envolver/estilar con tipografía (color, size, bold, italic, underline, align)

---

## 5. UX del panel

- Sección **“Tipografía” colapsable** en propiedades, junto a cada texto configurable.
- Por defecto **colapsada** para no saturar el panel.
- Controles: color, tamaño (preset + px), toggles N / I / S, alineación.
- Copy UI en **es-CO** (Negrita, Cursiva, Subrayado, Izquierda, Centro, Derecha).

---

## 6. Serialización (fidelidad HTML → PDF)

- Los estilos deben quedar en el HTML generado como **inline styles** (o clases generadas 1:1 con reglas explícitas en el CSS del documento).
- Preferencia MVP: **inline `style="..."`** en el nodo de texto para máxima fidelidad y menos acoplamiento.
- Ejemplo:

```html
<span class="datos-label" style="color:#5d6f65;font-size:12px;font-weight:400;font-style:normal;text-decoration:none;text-align:left">
  NIT
</span>
<span class="datos-value" style="color:#14201a;font-size:14px;font-weight:700;font-style:normal;text-decoration:none;text-align:left">
  {{emisor.nit}}
</span>
```

- Preview HTML y PDF deben usar el **mismo HTML** tipado.

---

## 7. Decisiones cerradas (cuestionario tipografía)

1. Todo texto visible del documento  
2. Props: color, tamaño, negrita, cursiva, subrayado, alineación  
3. Datos: estilo etiqueta ≠ estilo valor por fila  
4. Tabla: estilo título ≠ estilo celdas por columna  
5. Formato dato sin negrita; negrita solo en tipografía  
6. Tamaño: presets → px + px custom (HTML siempre en px)  
7. UI: Tipografía colapsable  
8. Incluye títulos Contenedor/Datos y bloque Texto  
9. Documentar primero; implementar después  

---

## 8. Criterio de aceptación

- [x] TextStyle en etiquetas y valores de Datos
- [x] TextStyle en header/celdas por columna de Tabla
- [x] TextStyle en bloque Texto
- [x] TextStyle en títulos de Contenedor y Datos
- [x] Formato dato solo ninguno|moneda|fecha
- [x] HTML generado con estilos explícitos en px/color/weight/style/decoration/align
- [x] Preview refleja tipografía al instante (debounce)
- [x] Persistencia en `blocksJson` y al republicar

---

## 9. Próximo paso

Implementación lista en el builder visual.