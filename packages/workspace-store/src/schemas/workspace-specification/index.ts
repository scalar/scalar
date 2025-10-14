import { Type } from '@scalar/typebox'
import type { PartialDeep } from 'type-fest'

import { compose } from '@/schemas/compose'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'
import { type WorkspaceMeta, WorkspaceMetaSchema } from '@/schemas/workspace'
import { type Config, ConfigSchema } from '@/schemas/workspace-specification/config'
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
  ConfigSchema,
  WorkspaceMetaSchema,
)

export type WorkspaceSpecification = {
  workspace: 'draft'
  info: Info
  documents?: Record<string, { $ref: string }>
  overrides?: Record<string, PartialDeep<OpenApiDocument>>
} & Config &
  WorkspaceMeta
