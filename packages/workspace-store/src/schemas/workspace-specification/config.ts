import { ApiReferenceConfigSchema } from '@/schemas/reference-config'
import { Type, type Static } from '@sinclair/typebox'

export const ConfigSchema = Type.Partial(
  Type.Object({
    'x-scalar-api-reference-config': ApiReferenceConfigSchema,
  }),
)

export type Config = Static<typeof ConfigSchema>
