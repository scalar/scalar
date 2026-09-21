import { Type } from '@scalar/typebox'

import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'
import { compose } from '@/schemas/compose'
import { coerceValue } from '@/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@/schemas/v3.2/strict/openapi-document'
import type { MaybeRefSchemaObject, SchemaObject } from '@/schemas/v3.2/strict/schema'

// Consumers resolve schema references through the store, including virtual dynamic bindings.
export { DYNAMIC_REF_VALUE } from '@scalar/json-magic/magic-proxy'

/**
 * A resolved schema is a read-only view.
 *
 * What comes back is either the document's own node or a shallow merge over it, so the nested values
 * are the document's either way and a write reaches the document without going through the store. The
 * `Readonly` says so to the compiler at the one level where a write is cheap to make by accident; a
 * caller with a change to make copies what it needs, or goes through a store mutation.
 */
type ResolvedSchema<T> = T extends undefined ? undefined : Readonly<SchemaObject & { $ref?: string }>

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
