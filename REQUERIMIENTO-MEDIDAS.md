# Requerimiento — Datos estándar de medidas (tipografía densa)

Contrato de producto para defaults y presets de tamaño en el documento generado.  
Complementa `REQUERIMIENTO-TIPOGRAFIA.md` y `REQUERIMIENTO-BUILDER.md`.

**Estado:** implementado  
**Fecha:** 2026-07-18  
**Rama:** `feature/standard-measure-defaults`  
**Objetivo:** tipografía densas tipo factura impresa (no UI web)

---

## 1. Alcance

- Defaults y presets de **tamaño tipográfico** del HTML/PDF.
- Unidad: **`px`** (igual que tipografía).
- Fuera de alcance: unidades DIAN/UBL de ítems; migración de plantillas antiguas salvo regeneración del seed mock.

---

## 2. Escala de presets

| Preset | `font-size` |
|---|---|
| Pequeño | `8px` |
| Normal | `9px` |
| Grande | `11px` |
| Título | `12px` |

Los presets son atajos; siempre se persisten como `fontSizePx` numérico.

---

## 3. Defaults

Todo texto **nuevo** nace en **9px**, salvo override explícito del usuario:

| Superficie | Default |
|---|---|
| Etiqueta (Datos) | 9 |
| Valor (Datos) | 9 |
| Título Contenedor / Datos | 9 |
| Bloque Texto | 9 |
| Header / celda de Tabla | 9 |
| CSS base del documento (`body`) | 9 |

### 3.1 Excepciones del seed factura
Jerarquía suave sin romper densidad:
- Tipo de documento → **12px**
- Total → **11px**

### 3.2 Márgenes de página (mm)
Default del documento: **5 mm** en los cuatro lados (`top` / `right` / `bottom` / `left`).  
El cliente puede cambiarlos en el panel Documento; el default solo aplica a plantillas nuevas / seed regenerado.

---

## 4. Reglas

1. Código fuente única tipografía: `textStyle.ts` (`FONT_SIZE_PRESETS` + `default*Style`).
2. El HTML/PDF no depende del nombre del preset; solo de `font-size: Npx`.
3. Márgenes default: `defaultPageSettings()` en `pageSettings.ts` → **5 mm** (editables en UI).

---

## 5. Criterio de aceptación

- [x] Presets 8 / 9 / 11 / 12  
- [x] Defaults de TextStyle en 9  
- [x] Seed con tipo 12 y total 11  
- [x] CSS base del documento en 9px  
- [x] Márgenes default 5 mm (4 lados), editables por el cliente  
- [x] Storage mock regenera seed con nuevos defaults  
