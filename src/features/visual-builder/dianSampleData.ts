/**
 * @deprecated Prefer `@/features/templates/genericSample` — kept as a thin
 * re-export so existing imports keep working with the UBL-aligned DEMO.
 */
import {
  SAMPLE_CUFE,
  buildGenericEditorSample,
  buildGenericEditorSampleJson,
  GENERIC_EDITOR_SCHEMA,
} from '@/features/templates/genericSample'

export const DIAN_SAMPLE_DATA = buildGenericEditorSample()

export const DIAN_SAMPLE_DATA_JSON = buildGenericEditorSampleJson()

export const DIAN_SCHEMA_JSON = GENERIC_EDITOR_SCHEMA

export { SAMPLE_CUFE }
