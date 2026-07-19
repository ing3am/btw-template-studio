# PDF by CUFE — API contract

Public HTTP contract for generating a graphical PDF from a published
template and a stored electronic invoice (UBL).

Base path: `/api/v1`

---

## `POST /api/v1/pdf/by-cufe`

Orchestrates:

1. Resolve template (override / pin / default published)
2. Load UBL / invoice payload by NIT + CUFE
3. Map UBL → `InvoiceViewModel`
4. Resolve template assets
5. Render PDF
6. Pin or replace binding when applicable
7. Return Base64

### Request

```http
POST /api/v1/pdf/by-cufe
Content-Type: application/json
```

```json
{
  "nit": "900000000",
  "cufe": "e989984fbb5acc3316f4419a143df98c64b865d9a87704375428ed9d6f4650abf1e3c7a989bb044ce03a36c8935eec3d",
  "documentType": "factura",
  "templateId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "replaceBinding": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `nit` | string | yes | Company tax id without DV (digits only preferred) |
| `cufe` | string | yes | CUFE / UUID of the electronic invoice |
| `documentType` | string | no | Default `factura`. Also: `nota_credito`, `nota_debito` |
| `templateId` | string (GUID) | no | Render with that template's **published** version (instead of pin / default) |
| `replaceBinding` | boolean | no | When CUFE already has a pin and `templateId` is set: overwrite the pin (`true`) or leave it (`false`, default) |

Template resolution order:

1. If `templateId` → published version of that template
2. Else if binding exists → pinned `templateId` + `templateVersion` (`reusedPinnedTemplate: true`)
3. Else → published template for NIT + `documentType`

Binding side effects:

- No pin yet → **Save** pin after first successful render
- Pin exists + `templateId` + `replaceBinding: true` → **Replace** pin (`bindingReplaced: true`)
- Pin exists without replace → re-render; pin unchanged

### Success response `200`

```json
{
  "nit": "900000000",
  "cufe": "e98998…",
  "documentType": "factura",
  "templateId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "templateVersion": 3,
  "contentType": "application/pdf",
  "fileName": "FE-900000000-e98998.pdf",
  "pdfBase64": "JVBERi0xLjQKJc…",
  "reusedPinnedTemplate": false,
  "bindingReplaced": true
}
```

| Field | Notes |
|---|---|
| `templateId` / `templateVersion` | Template actually used for this PDF |
| `reusedPinnedTemplate` | `true` when the existing pin was reused (no `templateId` override) |
| `bindingReplaced` | `true` when an existing pin was overwritten via `replaceBinding: true` |

### Error responses

| HTTP | `code` | When |
|---|---|---|
| `400` | `validation_error` | Missing/invalid nit or cufe |
| `404` | `template_not_found` | No published template for nit + documentType (or given `templateId`) |
| `404` | `invoice_not_found` | No UBL for nit + cufe |
| `422` | `mapping_error` | UBL cannot be mapped to view model |
| `500` | `render_error` | PDF engine failure |

```json
{
  "code": "template_not_found",
  "message": "No hay plantilla publicada de factura para el NIT 900000000.",
  "traceId": "00-…"
}
```

---

## `GET /api/v1/pdf/bindings/by-cufe`

Consulta si un CUFE ya fue graficado (`invoice_template_bindings`).

### Query

- `nit` (required)
- `cufe` (required)

### Response 200 — ya generado

```json
{
  "exists": true,
  "nit": "900000000",
  "cufe": "…",
  "documentType": 0,
  "templateId": "11111111-1111-1111-1111-111111111111",
  "templateVersion": 1,
  "boundAt": "2026-07-18T17:29:14.317Z"
}
```

### Response 200 — nunca generado

```json
{
  "exists": false,
  "nit": "900000000",
  "cufe": "…"
}
```

---

## Related domain shapes

### `TemplateDefinition` (stored / published)

See `src/features/templates/templateDefinition.ts` and
`Btw.TemplatePdf.Domain/Templates/TemplateDefinition.cs`.

Contains: `page`, `features`, `blocks`, `assets[]`.  
Does **not** contain invoice sample data.

### `InvoiceViewModel` (runtime, from UBL)

Same path conventions as the studio sample:

- `documento.*`, `emisor.*`, `cliente.*`, `pago.*`
- `items[]`, `totales.*`, `software.*`
- `anexoSalud.*` only when `features.sectorSalud` and data exists

---

## Design notes

- Client never sends `blocksJson` for production PDF.
- XML UBL is immutable; reconsulta is on-demand with pinned `templateVersion`.
- For re-graph “otra plantilla + reemplazar”, the studio must send `templateId` + `replaceBinding: true` and treat `reusedPinnedTemplate: true` (or a mismatched `templateId`) as failure.
