import { type RefNode, getResolvedRef } from '@/helpers/get-resolved-ref'
import { coerceValue } from '@/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@/schemas/v3.1/strict/openapi-document'
import type { MaybeRefSchemaObject, SchemaObject } from '@/schemas/v3.1/strict/schema'

const mergeSiblingReferences = <Node>(node: RefNode<Node>) => {
  const { '$ref-value': value, $ref: _, ...rest } = node
  return {
    ...rest,
    ...value,
  }
}

type ResolvedSchema<T> = T extends undefined ? undefined : SchemaObject

export const resolve = {
  schema: <T extends MaybeRefSchemaObject | undefined>(schema: T): ResolvedSchema<T> => {
    if (schema === undefined) {
      return undefined as ResolvedSchema<T>
    }

    const resoled = getResolvedRef(schema, mergeSiblingReferences)
    return coerceValue(SchemaObjectSchema, resoled) as ResolvedSchema<T>
  },
}
