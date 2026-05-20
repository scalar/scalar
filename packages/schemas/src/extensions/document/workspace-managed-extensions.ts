import { object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/**
 * Workspace-store-managed metadata extensions that apply to every document type in the workspace,
 * regardless of OpenAPI or AsyncAPI shape.
 *
 * Currently this is `x-scalar-original-source-url`. The original document hash
 * (`x-scalar-original-document-hash`) is kept separate because OpenAPI and AsyncAPI treat it differently
 * during ingestion.
 */
export const WorkspaceManagedExtensions = object(
  {
    'x-scalar-original-source-url': optional(
      string({ typeComment: 'Original document source URL when loaded from an external source' }),
    ),
  },
  {
    typeName: 'WorkspaceManagedExtensions',
    typeComment: typeCommentWithExample('Workspace-managed metadata shared by OpenAPI and AsyncAPI documents.', {
      language: 'yaml',
      body: 'x-scalar-original-source-url: https://example.com/openapi.yaml',
    }),
  },
)
