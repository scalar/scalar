import { ReferenceConfigSchema } from '@/schemas/reference-config'
import { Type, type Static } from '@scalar/typebox'

export const ConfigSchema = Type.Partial(
  Type.Object({
    'x-scalar-reference-config': ReferenceConfigSchema,
  }),
)

export type Config = Static<typeof ConfigSchema>
