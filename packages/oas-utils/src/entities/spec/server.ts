import { type ENTITY_BRANDS, nanoidSchema } from '@/entities/shared/utility'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { ServerObjectSchema, ServerVariableObjectSchema } from '@scalar/openapi-types/schemas/3.1'
import { type ZodSchema, z } from 'zod'

/** Extended schema for server variables */
const extendedServerVariableSchema = ServerVariableObjectSchema.extend({
  /** The value of the variable */
  value: z.string().optional(),
}).refine((data) => {
  // Set default to the first enum value if invalid
  if (Array.isArray(data.enum) && !data.enum.includes(data.default ?? '') && data.enum.length > 0) {
    data.default = data.enum[0]
  }

  if (Array.isArray(data.enum) && data.enum.length === 0) {
    delete data.enum
  }

  // Always return true since we’ve modified the data to be valid
  return true
}) as ZodSchema<
  Omit<OpenAPIV3_1.ServerVariableObject, 'enum'> & {
    enum?: [string, ...string[]]
    value?: string
  }
>

export const oasServerSchema = ServerObjectSchema.merge(
  z.object({
    /** A map between a variable name and its value. The value is used for substitution in the server's URL template. */
    variables: z.record(z.string(), extendedServerVariableSchema).optional(),
  }),
)

export const serverSchema = oasServerSchema.extend({
  uid: nanoidSchema.brand<ENTITY_BRANDS['SERVER']>(),
})

export type Server = z.infer<typeof serverSchema>
export type ServerPayload = z.input<typeof serverSchema>
