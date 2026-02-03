import { Type } from '@scalar/typebox'

import { type RefNode, getResolvedRef } from '@/helpers/get-resolved-ref'
import { compose } from '@/schemas/compose'
import { coerceValue } from '@/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@/schemas/v3.1/strict/openapi-document'
import type { MaybeRefSchemaObject, SchemaObject } from '@/schemas/v3.1/strict/schema'

const mergeSiblingReferences = <Node>(node: RefNode<Node>) => {
  const { '$ref-value': value, ...rest } = node
  return {
    ...value,
    ...rest,
  }
}

type ResolvedSchema<T> = T extends undefined ? undefined : SchemaObject & { $ref?: string }

export const resolve = {
  schema: <T extends MaybeRefSchemaObject | undefined>(schema: T): ResolvedSchema<T> => {
    if (schema === undefined) {
      return undefined as ResolvedSchema<T>
    }

    const resoled = getResolvedRef(schema, mergeSiblingReferences)
    return coerceValue(
      compose(SchemaObjectSchema, Type.Object({ $ref: Type.Optional(Type.String()) })),
      resoled,
    ) as ResolvedSchema<T>
  },
}
