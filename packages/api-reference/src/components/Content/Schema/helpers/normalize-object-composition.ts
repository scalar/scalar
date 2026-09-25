import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { isTypeObject } from './is-type-object'
import { partitionAllOfCompositions } from './partition-all-of-compositions'

/** Display schemas may carry the nullable annotation produced by composition optimization. */
type DisplaySchema = SchemaObject & { nullable?: boolean }

/** Preserve a named property's object boundary when all of its composition members form one object. */
export const normalizeObjectComposition = (
  value: DisplaySchema | undefined,
  name: string | undefined,
): DisplaySchema | undefined => {
  // Choice groups and unnamed composition containers keep their existing rendering.
  if (!name || !value?.allOf || value.oneOf || value.anyOf || value.not) {
    return value
  }

  const { segments } = partitionAllOfCompositions(value)
  const segment = segments[0]
  if (segments.length !== 1 || segment?.kind !== 'object' || !isTypeObject(segment.schema)) {
    return value
  }

  // A member reference identifies only part of this object, not the combined property.
  // Keep the property's own reference, if it has one.
  const objectSchema = { ...segment.schema }
  if ('$ref' in objectSchema) {
    delete objectSchema.$ref
  }
  // Member annotations describe only one part of the combined property. Keep the
  // property's annotations authoritative without changing merged validation rules.
  const annotations = {
    title: value.title,
    description: value.description,
    deprecated: value.deprecated,
    readOnly: value.readOnly,
    writeOnly: value.writeOnly,
    example: value.example,
    examples: value.examples,
    nullable: value.nullable,
  }
  return {
    ...objectSchema,
    ...annotations,
    ...('$ref' in value && typeof value.$ref === 'string' ? { $ref: value.$ref } : {}),
  }
}
