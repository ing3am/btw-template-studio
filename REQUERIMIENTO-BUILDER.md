# Requerimiento — Builder visual (cliente)

Documento de contrato de producto. Fuente de verdad para implementar el editor DnD.

**Estado:** cerrado (cuestionario de definición)  
**Fecha:** 2026-07-17  
**Usuario objetivo:** cliente de negocio (sin conocimiento de HTML/CSS/JSON)

---

## 1. Idea central

El cliente arma la representación PDF con **bloques visuales**.

Por debajo, el sistema siempre genera:
- **HTML**
- **CSS**
- **data** (JSON de ejemplo / datos del documento)

El cliente **no edita HTML**. La vista “Avanzado” (código) es opcional/interna.

---

## 2. Set de bloques (único permitido en paleta)

| Bloque | Propósito |
|---|---|
| **Contenedor** | Agrupa hijos + layout + estilos |
| **Datos** | Filas etiqueta + valor (texto o campo JSON) + formato |
| **Tabla** | Columnas configurables sobre un array del JSON |
| **Texto** | Párrafo / nota libre |
| **Espacio** | Separación vertical |

**Fuera de paleta (reemplazados):** Encabezado, Logo, Totales, “Datos de parte”, etc.  
Esos casos se resuelven con **Contenedor + Datos + Tabla**.

**Configuración de Página** (tamaño, orientación, márgenes, fondo) **no es bloque**:  
vive arriba en el **panel Documento**. Contrato: **`front/REQUERIMIENTO-PAGINA.md`**.

**Etiquetas DIAN** (catálogo arrastrable + búsqueda + checklist):  
**`front/REQUERIMIENTO-ETIQUETAS-DIAN.md`**. Añade bloque **Imagen** a la paleta.

**Medidas tipográficas estándar** (defaults densos 8/9):  
**`front/REQUERIMIENTO-MEDIDAS.md`**.

---

## 3. Contenedor

### 3.1 Comportamiento
- Agrupa bloques hijos.
- Se puede estilizar.
- **No se anidan** contenedores (máximo 1 nivel).
- Layout interno: **1 / 2 / 3 columnas**.

### 3.2 Estilos configurables (nivel medio)
- Número de columnas: 1 | 2 | 3
- Padding
- Borde sí/no
- Título opcional de sección
- Color de fondo
- Alineación

### 3.3 Colocación de hijos
- Cada hijo tiene propiedad **`columna`**: `1` | `2` | `3`
- Si el contenedor tiene menos columnas que el valor, se clampea a la última columna válida.

### 3.4 Reglas
- Solo pueden ser hijos directos: Datos, Tabla, Texto, Espacio.
- Un Contenedor **no** puede contener otro Contenedor.

---

## 4. Bloque Datos

### 4.1 Estructura
- Título de sección (opcional/editable)
- Lista de campos (filas), agregables/quitables
- **Ancho de etiqueta** (`labelWidth`, px) y **separación etiqueta–valor** (`labelValueGap`, px) a nivel de bloque

### 4.2 Cada campo tiene
| Propiedad | Valores |
|---|---|
| Etiqueta | texto |
| Tipo de valor | `texto` \| `campo` |
| Valor | texto libre **o** ruta JSON (`cliente.nombre`) |
| Formato | `ninguno` \| `moneda` \| `fecha` |
| Tipografía etiqueta | ver `REQUERIMIENTO-TIPOGRAFIA.md` |
| Tipografía valor | ver `REQUERIMIENTO-TIPOGRAFIA.md` |

### 4.3 Origen de rutas JSON
- Se listan desde el **JSON de ejemplo** de la plantilla (`sampleDataJson`).
- Selector de campo = rutas planas detectadas (`emisor.nit`, `totales.total`, etc.).

### 4.4 Notas
- Con formato `moneda` / `fecha`, el render aplica locale **`es-CO`**.
- La **negrita** no va en Formato; va en tipografía (`bold`).
- Detalle completo de tipografía: **`front/REQUERIMIENTO-TIPOGRAFIA.md`**.

---

## 5. Bloque Tabla

### 5.1 Fuente de filas
- El cliente **elige la propiedad array** del JSON (ej. `items`, `detalles`).
- No hardcodear solo `items`.

### 5.2 Columnas
- El cliente **agrega columnas una a una**.
- Cada columna tiene:
  - **Título** (header visible)
  - **Propiedad del ítem** (ej. `descripcion`, `cantidad`, `valor`)
  - Tipografía del título y de las celdas (ver `REQUERIMIENTO-TIPOGRAFIA.md`)
- Se puede reordenar / eliminar columnas.

### 5.3 Render
- Genera `<table>` con `{{#each <arrayPath>}}` y celdas `{{prop}}` por columna.
- Formato por columna (opcional en implementación): reutilizar moneda/fecha si se prioriza; **mínimo MVP = título + propiedad**.

---

## 6. Bloque Texto

- Contenido libre (string).
- Sirve para notas legales, pies, mensajes.

## 7. Bloque Espacio

- Alto en `px` (número).
- Solo separación visual.

---

## 8. Modelo de documento (árbol)

```
Documento
├── Contenedor (2 cols)
│   ├── Datos (columna 1)  // emisor
│   └── Datos (columna 2)  // cliente
├── Tabla (items)
├── Datos                 // totales con formato moneda
├── Texto                 // nota
└── Espacio
```

Serialización:
`árbol de bloques` → `HTML + CSS` determinista → preview / PDF.

---

## 9. UX del editor (contrato)

- Paleta izquierda: solo los 5 bloques.
- Canvas: documento con DnD / reorder.
- Panel propiedades: según bloque seleccionado.
- Preview HTML en vivo (debounce).
- Guardar / publicar versiona `blocksJson` + html/css generados.
- Copy UI: **es-CO**.

---

## 10. Decisiones cerradas (resumen del cuestionario)

1. Contenedor = agrupa + estilos  
2. Set = Contenedor + Datos + Tabla + Texto + Espacio  
3. Tabla elige su array JSON  
4. Columnas manuales (título + propiedad)  
5. Contenedor 1/2/3 columnas  
6. Sin anidación de contenedores  
7. Estilos contenedor nivel medio  
8. Datos con formato (ninguno|moneda|fecha) + tipografía editable (ver tipografía)
9. Reemplazar bloques legacy  
10. Hijos al contenedor por propiedad `columna`  
11. Documentar primero; implementar después  
12. Tipografía en todo texto — contrato en `REQUERIMIENTO-TIPOGRAFIA.md` 

---

## 11. Fuera de alcance (ahora)

- Contenedores anidados
- Editor libre tipo Figma/Canva
- Autodetección de columnas de tabla
- Branding self-service completo (logo/colores globales) — Sprint posterior
- Preview PDF real de backend — Sprint posterior

---

## 12. Criterio de aceptación

- [x] Paleta solo con 5 bloques
- [x] Contenedor 1/2/3 cols + estilos medios + hijos con `columna`
- [x] Datos: texto|campo JSON + formatos
- [x] Tabla: elegir array + columnas título/propiedad
- [x] Texto y Espacio funcionales
- [x] Preview refleja cambios
- [x] Persistencia `blocksJson` en mock/localStorage
- [x] Plantilla demo factura armada solo con el nuevo set

**Estado implementación:** completado (2026-07-17)

---

## 13. Próximo paso

1. ~~Builder base (5 bloques)~~ — hecho  
2. **Implementar tipografía** según `REQUERIMIENTO-TIPOGRAFIA.md`
