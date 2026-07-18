# Requerimiento — Etiquetas DIAN (catálogo + búsqueda)

Contrato de producto para el catálogo de campos DIAN/UBL en el builder.  
Complementa `REQUERIMIENTO-BUILDER.md`.

**Estado:** implementado  
**Fecha:** 2026-07-18  
**Rama de trabajo:** `feature/mandatory-labels`  
**Usuario objetivo:** cliente de negocio (arrastrar etiquetas, sin editar XML)

---

## 1. Idea central

Las **etiquetas** son campos del dominio DIAN/factura electrónica (derivados del XML UBL).  
El cliente las arrastra al documento; el **contenido** se resuelve con el **`sampleDataJson`** (y en producción con el JSON armado desde el XML).

- El equipo define un **schema JSON predefinido** alineado al catálogo.
- El `sampleDataJson` de la plantilla debe estar **completo** (todas las claves del catálogo).
- Si falta un path en el JSON → el preview muestra **vacío** (no rompe).

---

## 2. UI — Paleta

- Misma paleta izquierda que los bloques.
- Sección **Etiquetas DIAN** debajo (o junto) a Contenedor / Datos / Tabla / Texto / Espacio / Imagen.
- **Lista plana** (sin grupos).
- Cada ítem muestra solo el **nombre amigable** (ej. “NIT del vendedor”).
- **Buscador** que filtra por:
  - nombre amigable (case/acentos insensitive), y
  - **path JSON** (aunque el path no se muestre en la lista).

---

## 3. Comportamiento al soltar

| Destino | Resultado |
|---|---|
| Sobre un bloque **Datos** existente | Agrega una **fila** a ese bloque |
| En el canvas / root (fuera de un Datos) | Crea un bloque **Datos nuevo** con esa fila |
| Etiqueta **QR** | Crea/usa bloque **Imagen** ligado al path del QR |
| Etiqueta **CUFE** | Fila de **Datos** (texto), no imagen |

### 3.1 Fila Datos creada por etiqueta
- `label`: nombre amigable del catálogo (**renombrable** por el cliente)
- `mode`: `campo`
- `value`: path JSON del catálogo
- `format`: el definido en el catálogo (`ninguno` \| `moneda` \| `fecha`)
- Tipografía: defaults del builder (editables después)

### 3.2 Repetición
- Se puede usar la **misma etiqueta N veces** en la plantilla.
- El checklist de obligatorias se cumple con **al menos una** aparición del `tagId`.

---

## 4. Bloque Imagen (nuevo en paleta)

Props mínimas:
- `srcPath` — path JSON (URL o data de imagen)
- `width` / `height` (o tamaño en px/mm según convención del builder)
- `align` — izquierda \| centro \| derecha

La etiqueta QR del catálogo inserta un Imagen con `srcPath` = path del QR en el schema.

---

## 5. Obligatorias — checklist y bloqueo

### 5.1 Checklist
- Banner **arriba del canvas** del documento.
- Lista las etiquetas DIAN obligatorias **faltantes** (nombre amigable).
- Se actualiza en vivo al agregar/quitar filas o bloques Imagen QR.

### 5.2 Bloqueo
- Si faltan obligatorias → **no se puede Guardar ni Publicar**.
- Feedback: toast + banner sigue visible.

### 5.3 Criterio “presente”
Una obligatoria cuenta como presente si existe en `blocksJson`:
- fila Datos con `value` = path del tag (o `tagId` persistido en la fila), o
- bloque Imagen cuyo `srcPath` / `tagId` corresponda al QR (para la etiqueta QR).

---

## 6. Alcance del catálogo (MVP)

Catálogo **amplio** mapeado al XML UBL de referencia (`fv09006654110242600052044.xml`), no solo el mínimo legal.

Incluye al menos (obligatorias de representación gráfica + campos del XML de muestra):

**Documento / autorización**
- Tipo “Factura electrónica de venta”
- Número / prefijo / consecutivo
- Autorización DIAN, rango (desde–hasta), vigencia
- Fecha/hora generación
- Fecha/hora (periodo / expedición según schema)
- Moneda
- CUFE (texto)
- QR (imagen)

**Emisor**
- Razón social / nombre
- NIT (+ DV si aplica en schema)
- Dirección, ciudad, departamento
- Teléfono, email
- Responsabilidades / calidad (retenedor IVA, etc. según campos del schema)

**Adquirente**
- Nombre / razón social
- NIT o tipo+número documento
- Dirección, ciudad, etc.
- Soporte de “consumidor final” vía datos del JSON

**Detalle / totales / pago / impuestos / software**
- Ítems (vía Tabla + paths de array, no solo etiquetas sueltas)
- Subtotal, IVA, otros impuestos, total
- Forma de pago, medio de pago, plazo
- Fabricante software, nombre software, proveedor tecnológico

El catálogo vive en código (`dianLabels.ts` o similar): `{ id, label, path, kind: 'field' | 'image', format?, required: boolean }`.

---

## 7. Sample / schema

- Seed de plantilla factura: `sampleDataJson` **completo** con todos los paths del catálogo (valores realistas CO).
- `schemaJson` describe el objeto alineado al catálogo.
- Fuente de verdad de paths = catálogo; JSON no inventa claves distintas.

---

## 8. Decisiones cerradas (cuestionario)

1. Etiquetas = campos DIAN → JSON schema (no bloques compuestos genéricos)  
2. Paleta misma columna + sección Etiquetas + search  
3. Drop → fila Datos; también sobre Datos existente  
4. Drop fuera de Datos → nuevo bloque Datos  
5. Lista plana  
6. Solo nombre amigable en UI  
7. Checklist + bloquea guardar y publicar  
8. Label prellenado y renombrable  
9. CUFE = Datos; QR = Imagen  
10. Bloque Imagen genérico en paleta  
11. Catálogo amplio estilo XML completo  
12. Etiquetas repetibles  
13. Preview desde sampleDataJson; sample completo  
14. Search por nombre y por path  
15. Checklist en banner arriba del canvas  

---

## 9. Criterio de aceptación

- [x] Sección Etiquetas DIAN + buscador (nombre + path) en paleta  
- [x] DnD etiqueta → Datos nuevo o fila en Datos existente  
- [x] CUFE como campo; QR como Imagen  
- [x] Bloque Imagen en paleta  
- [x] Banner de faltantes arriba del canvas  
- [x] Guardar/Publicar bloqueados si faltan `required: true`  
- [x] `sampleDataJson` seed completo  
- [x] Catálogo tipado + serialización HTML sin romper preview  

---

## 10. Próximo paso

Listo en `feature/mandatory-labels`: catálogo + DnD etiquetas + bloque Imagen + checklist.