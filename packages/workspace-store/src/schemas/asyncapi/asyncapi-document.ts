import { boolean, intersection, object, optional, string } from '@scalar/validation'

import {
  WorkspaceManagedExtensions,
  type WorkspaceManagedExtensions as WorkspaceManagedExtensionsType,
} from '@/schemas/extensions/document/workspace-managed-extensions'
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
 * AsyncAPI-specific extensions. The shared
 * {@link WorkspaceManagedExtensions} covers `x-scalar-original-source-url`.
 *
 * `x-original-aas-version` is the AsyncAPI analog of `x-original-oas-version`.
 * `x-scalar-original-document-hash` is intentionally optional here (the
 * OpenAPI side keeps its own `XScalarOriginalDocumentHash` extension where
 * the field is required-after-ingestion). Once we settle on one optionality
 * for both, the two declarations can collapse onto the shared module.
 * `x-scalar-is-dirty` is OpenAPI-only at runtime today, but lives on the type
 * so accesses through the {@link WorkspaceDocument} union are sound.
 */
export const AsyncApiExtensions = object(
  {
    'x-original-aas-version': optional(
      string({ typeComment: 'Original AsyncAPI Specification version the document was loaded with.' }),
    ),
    'x-scalar-original-document-hash': optional(
      string({ typeComment: 'Content hash of the original document, used for change detection on rebase.' }),
    ),
    'x-scalar-is-dirty': optional(
      boolean({
        typeComment:
          'Workspace-store dirty flag — only set on OpenAPI documents today, but typed here so union accesses are safe.',
      }),
    ),
  },
  { typeName: 'AsyncApiExtensions' },
)

export type AsyncApiExtensions = Partial<{
  /** Original AsyncAPI Specification version the document was loaded with. */
  'x-original-aas-version': string
  /** Content hash of the original document, used for change detection on rebase. */
  'x-scalar-original-document-hash': string
  /** Workspace-store dirty flag — only set on OpenAPI documents today, but typed here so union accesses are safe. */
  'x-scalar-is-dirty': boolean
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
    // Shared store-managed metadata (source url, document hash). Defined once
    // in `workspace-managed-extensions.ts` and composed into the OpenAPI
    // document too, so the two cannot drift apart.
    WorkspaceManagedExtensions,
    // Registry meta is workspace-store managed and preserved across document
    // type boundaries. Optional — only registry-backed documents populate it.
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
  WorkspaceManagedExtensionsType &
  XScalarRegistryMeta
