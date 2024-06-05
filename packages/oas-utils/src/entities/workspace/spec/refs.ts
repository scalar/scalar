import { type ZodSchema, z } from 'zod'

/**
 * Internal type used to describe an OpenAPI spec $ref
 *
 * Where this type is used we can set the UI to readonly and redirect to the
 * definition object to allow modification
 *
 */
export type $REF = {
  /** $ref string from the OpenAPI spec */
  path: string
  /** If the reference is internal to a collection we include a dot separate path */
  collectionRef?: string
  /** If the reference is external we can handle differently */
  isExternal: boolean
}

export const $refSchema = z.object({
  path: z.string(),
  collectionRef: z.string().optional(),
  isExternal: z.boolean(),
}) satisfies ZodSchema<$REF>
