import { z } from 'zod'
import { securitySchemeSchema } from '@scalar/types/entities'
import { cleanSchema } from '@/utils/clean-schema.ts'

const _authenticationConfigurationSchema = cleanSchema(securitySchemeSchema)

/**
 * Authentication Configuration
 * This takes our securitySchemeSchema and makes each field optional
 * We will then override the schema with these values
 */
export const authenticationConfigurationSchema = z.record(z.string(), _authenticationConfigurationSchema)
export type AuthenticationConfiguration = z.infer<typeof authenticationConfigurationSchema>
