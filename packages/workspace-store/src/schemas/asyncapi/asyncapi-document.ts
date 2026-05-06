import { intersection, object, optional, string } from '@scalar/validation'

import { WorkspaceManagedExtensions } from '@/schemas/extensions/document/workspace-managed-extensions'
import { XScalarIsDirty } from '@/schemas/extensions/document/x-scalar-is-dirty'
import { XScalarOriginalDocumentHash } from '@/schemas/extensions/document/x-scalar-original-document-hash'
import { XScalarRegistryMeta } from '@/schemas/extensions/document/x-scalar-registry-meta'

/**
 * Minimal AsyncAPI Info Object.
 *
 * Intentionally scoped to the fields we surface in the MVP. AsyncAPI's real Info Object
 * is a superset (contact, license, termsOfService, tags, externalDocs, ...) — we can
 * grow this as consumers need the extra fields.
 */
export const AsyncApiInfoObject = object(
  {
    title: string({ typeComment: 'REQUIRED. The title of the application.' }),
    version: string({
      typeComment: 'REQUIRED. Provides the version of the application API (not the AsyncAPI Specification version).',
    }),
    description: optional(
      string({
        typeComment:
          'A short description of the application. CommonMark syntax can be used for rich text representation.',
      }),
    ),
  },
  { typeName: 'AsyncApiInfoObject' },
)

export type AsyncApiInfoObject = {
  /** REQUIRED. The title of the application. */
  title: string
  /** REQUIRED. Provides the version of the application API (not the AsyncAPI Specification version). */
  version: string
  /** A short description of the application. CommonMark syntax can be used for rich text representation. */
  description?: string
}

/**
 * AsyncAPI-specific extensions. Store-managed metadata (source url, document
 * hash, dirty flag, registry meta) is shared with the OpenAPI side via the
 * dedicated extension modules so the two cannot drift apart.
 *
 * `x-original-aas-version` stays here because it is the AsyncAPI analog of
 * `x-original-oas-version` — different field names per spec, so unified
 * sharing is not a fit.
 */
export const AsyncApiExtensions = object(
  {
    'x-original-aas-version': optional(
      string({ typeComment: 'Original AsyncAPI Specification version the document was loaded with.' }),
    ),
  },
  { typeName: 'AsyncApiExtensions' },
)

export type AsyncApiExtensions = Partial<{
  /** Original AsyncAPI Specification version the document was loaded with. */
  'x-original-aas-version': string
}>

/**
 * Minimal AsyncAPI Document.
 *
 * MVP shape: the spec version discriminator, the minimal Info Object, and the shared
 * store-managed metadata extensions. Present on the discriminated {@link WorkspaceDocument}
 * union via the required `asyncapi` field.
 */
export const AsyncApiDocument = intersection(
  [
    object(
      {
        asyncapi: string({
          typeComment: 'REQUIRED. The AsyncAPI Specification version the document uses (for example "3.0.0").',
        }),
        info: AsyncApiInfoObject,
      },
      { typeName: 'AsyncApiDocumentCore' },
    ),
    AsyncApiExtensions,
    // Shared store-managed metadata. Composed from the same extension modules
    // the OpenAPI side uses so the two document shapes cannot drift apart.
    WorkspaceManagedExtensions,
    XScalarOriginalDocumentHash,
    XScalarIsDirty,
    XScalarRegistryMeta,
  ],
  {
    typeName: 'AsyncApiDocument',
    typeComment: 'Root AsyncAPI document including Scalar workspace extensions.',
  },
)

export type AsyncApiDocument = {
  /** REQUIRED. The AsyncAPI Specification version the document uses (for example "3.0.0"). */
  asyncapi: string
  /** REQUIRED. Provides metadata about the application. */
  info: AsyncApiInfoObject
} & AsyncApiExtensions &
  WorkspaceManagedExtensions &
  XScalarOriginalDocumentHash &
  XScalarIsDirty &
  XScalarRegistryMeta
