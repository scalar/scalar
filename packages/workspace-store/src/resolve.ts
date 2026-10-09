import { Type } from '@scalar/typebox'

import { getBooleanSchema } from '@/helpers/get-boolean-schema'
import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'
import { compose } from '@/schemas/compose'
import { coerceValue } from '@/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@/schemas/v3.2/strict/openapi-document'
import type { MaybeRefSchemaObject, SchemaObject } from '@/schemas/v3.2/strict/schema'

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
// Rendering also consumes AsyncAPI schemas. Keep boolean children intact until their own rows
// resolve them, without widening the object-based OpenAPI document validation types.
const displaySchemaObject = {
  ...SchemaObjectSchema,
  $defs: {
    ...SchemaObjectSchema.$defs,
    SchemaObject: Type.Union([SchemaObjectSchema.$defs.SchemaObject, Type.Boolean()]),
  },
}
const resolvedSchemaSchema = compose(displaySchemaObject, Type.Object({ $ref: Type.Optional(Type.String()) }))

export const resolve = {
  schema: <T extends MaybeRefSchemaObject | boolean | undefined>(schema: T): ResolvedSchema<T> => {
    if (schema === undefined) {
      return undefined as ResolvedSchema<T>
    }

    // Resolve boolean targets before merging siblings, which assumes an object target.
    const target = getResolvedRef(schema)
    if (typeof target === 'boolean') {
      return getBooleanSchema(target) as ResolvedSchema<T>
    }

    const resoled = getResolvedRef(schema, mergeSiblingReferences)
    return coerceValue(resolvedSchemaSchema, resoled) as ResolvedSchema<T>
  },
}
