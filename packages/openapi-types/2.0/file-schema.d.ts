import type { ExternalDocsObject } from './external-docs'
export type FileSchemaObject = {
  format?: string
  title?: unknown
  description?: unknown
  default?: unknown
  required?: unknown
  type: 'file'
  readOnly?: boolean
  externalDocs?: ExternalDocsObject
  example?: unknown
}
