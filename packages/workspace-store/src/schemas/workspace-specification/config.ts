import { ReferenceConfigSchema } from '@/schemas/reference-config'
import { Type, type Static } from '@sinclair/typebox'

export const ConfigSchema = Type.Partial(
  Type.Object({
    'x-scalar-reference-config': ReferenceConfigSchema,
  }),
)

export type Config = Static<typeof ConfigSchema>
