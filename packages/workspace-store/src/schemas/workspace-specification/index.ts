import { compose } from '@/schemas/v3.1/compose'
import { OpenAPIDocumentSchema } from '@/schemas/v3.1/strict/openapi-document'
import { WorkspaceMetaSchema } from '@/schemas/workspace'
import { ConfigSchema } from '@/schemas/workspace-specification/config'
import { InfoSchema } from '@/schemas/workspace-specification/info'
import { Type, type Static } from '@sinclair/typebox'

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
    overrides: Type.Optional(Type.Record(Type.String(), compose(Type.Partial(OpenAPIDocumentSchema), ConfigSchema))),
  }),
  ConfigSchema,
  WorkspaceMetaSchema,
)

export type WorkspaceSpecification = Static<typeof WorkspaceSpecificationSchema>
