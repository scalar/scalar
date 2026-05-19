import { openapiSchemas } from '@scalar/schemas/openapi/3.1'
import type { SchemaObject, SchemaReferenceType } from '@scalar/types/openapi/3.1'
import { type IntersectionMember, coerce, intersection, object, optional, string, validate } from '@scalar/validation'

import { getResolvedRef, mergeSiblingReferences } from '@/helpers/get-resolved-ref'

export type MaybeRefSchemaObject = SchemaObject | SchemaReferenceType

type ResolvedSchema<T> = T extends undefined ? undefined : SchemaObject & { $ref?: string }

const resolvedSchemaShape = intersection([
  openapiSchemas.schema as IntersectionMember,
  object({ $ref: optional(string()) }),
])

export const resolve = {
  schema: <T extends MaybeRefSchemaObject | undefined>(schema: T): ResolvedSchema<T> => {
    if (schema === undefined) {
      return undefined as ResolvedSchema<T>
    }

    const resolved = getResolvedRef(schema, mergeSiblingReferences)

    if (validate(resolvedSchemaShape, resolved)) {
      return resolved as ResolvedSchema<T>
    }

    const result = coerce(resolvedSchemaShape, resolved) as ResolvedSchema<T>

    // We need to assign it to the original schema object
    // To ensure we don't create new objects everytime
    return Object.assign(schema, result)
  },
}
