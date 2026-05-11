import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

/**
 * Schema for workspace-store-managed metadata extensions that apply to every
 * document type in the workspace, regardless of OpenAPI or AsyncAPI shape.
 *
 * Currently this is just `x-scalar-original-source-url`. The original document
 * hash (`x-scalar-original-document-hash`) is intentionally kept in its own
 * `XScalarOriginalDocumentHashSchema` because OpenAPI treats it as
 * post-ingestion-required (so `coerce` defaults missing values to `""`),
 * while AsyncAPI treats it as optional. Once that asymmetry is resolved this
 * file can absorb it.
 *
 * Centralized here so the OpenAPI and AsyncAPI document schemas share one
 * definition for the source-url field and cannot drift apart silently.
 */
export const WorkspaceManagedExtensionsSchema = Type.Partial(
  Type.Object({
    /** Original document source url — when loaded from an external source. */
    'x-scalar-original-source-url': Type.String(),
  }),
)

export type WorkspaceManagedExtensions = Partial<{
  /** Original document source url — when loaded from an external source. */
  'x-scalar-original-source-url': string
}>

export const WorkspaceManagedExtensions = object(
  {
    'x-scalar-original-source-url': optional(
      string({ typeComment: 'Original document source url — when loaded from an external source.' }),
    ),
  },
  {
    typeName: 'WorkspaceManagedExtensions',
    typeComment: 'Workspace-store-managed metadata extensions shared by OpenAPI and AsyncAPI documents.',
  },
)
