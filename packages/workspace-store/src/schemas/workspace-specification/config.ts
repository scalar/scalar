import { type Static, Type } from '@scalar/typebox'

import { ReferenceConfigSchema } from '@/schemas/reference-config'

export const ConfigSchema = Type.Partial(
  Type.Object({
    'x-scalar-reference-config': ReferenceConfigSchema,
  }),
)

export type Config = Static<typeof ConfigSchema>
