import { nanoid } from 'nanoid'
import { z } from 'zod'

/** Generates a default value */
export const nanoidSchema = z
  .string()
  .min(7)
  .optional()
  .default(() => nanoid())

/** UID format for objects */
export type Nanoid = z.infer<typeof nanoidSchema>

/** All of our Zod brands for entities, used to brand nanoidSchemas. */
export type ENTITY_BRANDS = {
  COLLECTION: 'collection'
  COOKIE: 'cookie'
  ENVIRONMENT: 'environment'
  EXAMPLE: 'example'
  OPERATION: 'operation'
  SECURITY_SCHEME: 'securityScheme'
  SERVER: 'server'
  TAG: 'tag'
  WORKSPACE: 'workspace'
}
