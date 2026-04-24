import { Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'

/**
 * Minimal AsyncAPI Info Object.
 *
 * Intentionally scoped to the fields we surface in the MVP. AsyncAPI's real Info Object
 * is a superset (contact, license, termsOfService, tags, externalDocs, ...) — we can
 * grow this as consumers need the extra fields.
 */
export const AsyncApiInfoObjectSchema = Type.Object({
  /** REQUIRED. The title of the application. */
  title: Type.String(),
  /** REQUIRED. Provides the version of the application API (not the AsyncAPI Specification version). */
  version: Type.String(),
  /** A short description of the application. CommonMark syntax can be used for rich text representation. */
  description: Type.Optional(Type.String()),
})

export type AsyncApiInfoObject = {
  /** REQUIRED. The title of the application. */
  title: string
  /** REQUIRED. Provides the version of the application API (not the AsyncAPI Specification version). */
  version: string
  /** A short description of the application. CommonMark syntax can be used for rich text representation. */
  description?: string
}

/**
 * Store-managed metadata extensions for AsyncAPI documents. Parallels the OpenAPI set:
 * `x-original-aas-version` is the AsyncAPI analog of `x-original-oas-version`. All fields are
 * optional on the schema because validation runs against the raw user input (these get injected
 * by the store during ingestion).
 */
export const AsyncApiExtensionsSchema = Type.Partial(
  Type.Object({
    /** Original AsyncAPI Specification version the document was loaded with. */
    'x-original-aas-version': Type.String(),
    /** Original document source url — when loaded from an external source. */
    'x-scalar-original-source-url': Type.String(),
    /** Content hash of the original document, used for change detection on rebase. */
    'x-scalar-original-document-hash': Type.String(),
  }),
)

export type AsyncApiExtensions = Partial<{
  /** Original AsyncAPI Specification version the document was loaded with. */
  'x-original-aas-version': string
  /** Original document source url — when loaded from an external source. */
  'x-scalar-original-source-url': string
  /** Content hash of the original document, used for change detection on rebase. */
  'x-scalar-original-document-hash': string
}>

/**
 * Minimal AsyncAPI Document.
 *
 * MVP shape: the spec version discriminator, the minimal Info Object, and the shared
 * store-managed metadata extensions. Present on the discriminated {@link WorkspaceDocument}
 * union via the required `asyncapi` field.
 */
export const AsyncApiDocumentSchema = compose(
  Type.Object({
    /** REQUIRED. The AsyncAPI Specification version the document uses (for example "3.0.0"). */
    asyncapi: Type.String(),
    /** REQUIRED. Provides metadata about the application. */
    info: AsyncApiInfoObjectSchema,
  }),
  AsyncApiExtensionsSchema,
)

export type AsyncApiDocument = {
  /** REQUIRED. The AsyncAPI Specification version the document uses (for example "3.0.0"). */
  asyncapi: string
  /** REQUIRED. Provides metadata about the application. */
  info: AsyncApiInfoObject
} & AsyncApiExtensions
