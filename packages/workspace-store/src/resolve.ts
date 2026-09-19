import { Type } from '@scalar/typebox'

import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'
import { compose } from '@/schemas/compose'
import { coerceValue } from '@/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@/schemas/v3.2/strict/openapi-document'
import type { MaybeRefSchemaObject, SchemaObject } from '@/schemas/v3.2/strict/schema'

type ResolvedSchema<T> = T extends undefined ? undefined : SchemaObject & { $ref?: string }

/**
 * The coercion target: a schema object that may still carry the `$ref` it was resolved from.
 *
 * `Type.Composite` merges every property of `SchemaObjectSchema` to build this, so it belongs at module
 * scope. `resolve.schema` runs once per property of every schema a render walks, and rebuilding the
 * composite per call dominated that walk.
 */
const resolvedSchemaSchema = compose(SchemaObjectSchema, Type.Object({ $ref: Type.Optional(Type.String()) }))

export const resolve = {
  schema: <T extends MaybeRefSchemaObject | undefined>(schema: T): ResolvedSchema<T> => {
    if (schema === undefined) {
      return undefined as ResolvedSchema<T>
    }

    const resoled = getResolvedRef(schema, mergeSiblingReferences)
    return coerceValue(resolvedSchemaSchema, resoled) as ResolvedSchema<T>
  },
}
