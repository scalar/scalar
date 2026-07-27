import type { ExternalDocsObject } from './external-docs.js'
export type FileSchemaObject = {
  format?: string
  title?: string
  description?: string
  default?: unknown
  required?: string[]
  type: 'file'
  readOnly?: boolean
  externalDocs?: ExternalDocsObject
  example?: unknown
}
