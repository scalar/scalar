import { openapiSchemas } from '@scalar/schemas/openapi/3.1'
import type { SchemaObject, SchemaReferenceType } from '@scalar/types/openapi/3.1'
import { type IntersectionMember, coerce, intersection, object, optional, string } from '@scalar/validation'

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
    return coerce(resolvedSchemaShape, resolved) as ResolvedSchema<T>
  },
}
