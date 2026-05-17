import { Type } from '@scalar/typebox'
import type { OpenApiDocument } from '@scalar/types/openapi/3.1'
import type { PartialDeep } from 'type-fest'

import { compose } from '@/schemas/compose'
import { type WorkspaceMeta, WorkspaceMetaSchema } from '@/schemas/workspace'
import { type Info, InfoSchema } from '@/schemas/workspace-specification/info'

export const WorkspaceSpecificationSchema = compose(
  Type.Object({
    workspace: Type.Union([Type.Literal('draft')]),
    info: InfoSchema,
    documents: Type.Optional(
      Type.Record(
        Type.String(),
        Type.Object({
          $ref: Type.String(),
        }),
      ),
    ),
    overrides: Type.Optional(Type.Record(Type.String(), Type.Any())),
  }),
  WorkspaceMetaSchema,
)

export type WorkspaceSpecification = {
  workspace: 'draft'
  info: Info
  documents?: Record<string, { $ref: string }>
  overrides?: Record<string, PartialDeep<OpenApiDocument>>
} & WorkspaceMeta
