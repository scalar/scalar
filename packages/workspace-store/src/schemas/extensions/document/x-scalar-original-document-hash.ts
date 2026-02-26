import { Type } from '@scalar/typebox'
/**
 * Schema for the "x-scalar-original-document-hash" OpenAPI extension.
 * This extension allows specifying an optional string value,
 * which can be used to track the original document hash.
 *
 * This is used to track the original document hash when loading a document from an external source.
 * Which can be helpful to track if the document has been modified since it was last saved.
 *
 * @example
 * ```yaml
 * x-scalar-original-document-hash: "1234567890"
 * ```
 */
export const XScalarOriginalDocumentHashSchema = Type.Object({
  /** Original input document hash */
  'x-scalar-original-document-hash': Type.String(),
})

export type XScalarOriginalDocumentHash = {
  /** Original input document hash */
  'x-scalar-original-document-hash': string
}
