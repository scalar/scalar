import { Type } from '@scalar/typebox'

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
 * Minimal AsyncAPI Document.
 *
 * MVP shape: just the spec version discriminator + the minimal Info Object.
 * Present on the discriminated {@link WorkspaceDocument} union via the required `asyncapi` field.
 */
export const AsyncApiDocumentSchema = Type.Object({
  /** REQUIRED. The AsyncAPI Specification version the document uses (for example "3.0.0"). */
  asyncapi: Type.String(),
  /** REQUIRED. Provides metadata about the application. */
  info: AsyncApiInfoObjectSchema,
})

export type AsyncApiDocument = {
  /** REQUIRED. The AsyncAPI Specification version the document uses (for example "3.0.0"). */
  asyncapi: string
  /** REQUIRED. Provides metadata about the application. */
  info: AsyncApiInfoObject
}
