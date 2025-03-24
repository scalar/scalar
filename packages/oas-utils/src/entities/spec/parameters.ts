import type { ParameterObjectSchema } from '@scalar/openapi-types/schemas/3.1'
import type { z } from 'zod'

export type RequestParameter = z.infer<typeof ParameterObjectSchema>
export type RequestParameterPayload = z.input<typeof ParameterObjectSchema>
