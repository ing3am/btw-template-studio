# PDF by CUFE — API contract

Public HTTP contract for generating a graphical PDF from a published
template and a stored electronic invoice (UBL).

Base path: `/api/v1`

---

## `POST /api/v1/pdf/by-cufe`

Orchestrates:

1. Load published `TemplateDefinition` by company NIT (+ document type)
2. Load UBL / invoice payload by NIT + CUFE
3. Map UBL → `InvoiceViewModel`
4. Resolve template assets
5. Render PDF
6. Return Base64

### Request

```http
POST /api/v1/pdf/by-cufe
Content-Type: application/json
```

```json
{
  "nit": "900000000",
  "cufe": "e989984fbb5acc3316f4419a143df98c64b865d9a87704375428ed9d6f4650abf1e3c7a989bb044ce03a36c8935eec3d",
  "documentType": "factura"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `nit` | string | yes | Company tax id without DV (digits only preferred) |
| `cufe` | string | yes | CUFE / UUID of the electronic invoice |
| `documentType` | string | no | Default `factura`. Also: `nota_credito`, `nota_debito` |

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
  "pdfBase64": "JVBERi0xLjQKJc…"
}
```

### Error responses

| HTTP | `code` | When |
|---|---|---|
| `400` | `validation_error` | Missing/invalid nit or cufe |
| `404` | `template_not_found` | No published template for nit + documentType |
| `404` | `invoice_not_found` | No UBL for nit + cufe |
| `422` | `mapping_error` | UBL cannot be mapped to view model |
| `500` | `render_error` | PDF engine failure |

```json
{
  "code": "template_not_found",
  "message": "No published factura template for NIT 900000000.",
  "traceId": "00-…"
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
- Template config should be cacheable by `nit + documentType`.
- Template and UBL loads may run in parallel (in-proc today; gRPC later).
