import { object, optional, string } from '@scalar/validation'

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
