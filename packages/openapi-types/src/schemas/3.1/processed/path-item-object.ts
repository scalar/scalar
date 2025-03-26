import { z } from 'zod'
import type { OperationObjectSchema } from './operation-object'
import { BasePathItemObjectSchema } from './shared-path-schemas'

type PathItemObject = z.infer<typeof BasePathItemObjectSchema> & {
  get?: z.infer<typeof OperationObjectSchema>
  put?: z.infer<typeof OperationObjectSchema>
  post?: z.infer<typeof OperationObjectSchema>
  delete?: z.infer<typeof OperationObjectSchema>
  options?: z.infer<typeof OperationObjectSchema>
  head?: z.infer<typeof OperationObjectSchema>
  patch?: z.infer<typeof OperationObjectSchema>
  trace?: z.infer<typeof OperationObjectSchema>
}

/**
 * Path Item Object
 *
 * Describes the operations available on a single path. A Path Item MAY be empty, due to ACL constraints. The path
 * itself is still exposed to the documentation viewer but they will not know which operations and parameters are
 * available.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#path-item-object
 */
export const PathItemObjectSchema: z.ZodType<PathItemObject> = z.lazy(() => BasePathItemObjectSchema)
