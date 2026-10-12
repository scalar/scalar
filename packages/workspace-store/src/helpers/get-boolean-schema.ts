import type { SchemaObject } from '@/schemas/v3.2/strict/openapi-document'

/**
 * Explain boolean schemas to object-based renderers without changing the source document.
 * The strict schema union requires a type, but these equivalent JSON Schemas intentionally have none.
 */
export const getBooleanSchema = (value: boolean): SchemaObject =>
  (value ? { description: 'Accepts any value.' } : { not: {}, description: 'Accepts no value.' }) as SchemaObject
