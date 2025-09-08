import { type Static, Type } from '@scalar/typebox'

import { compose } from '@/schemas/compose'
import { WorkspaceMetaSchema } from '@/schemas/workspace'
import { ConfigSchema } from '@/schemas/workspace-specification/config'
import { InfoSchema } from '@/schemas/workspace-specification/info'

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

export type WorkspaceSpecification = Static<typeof WorkspaceSpecificationSchema>
