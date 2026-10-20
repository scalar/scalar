import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyShallow } from '@scalar/workspace-store/helpers/unpack-proxy'

import { type ConstraintSchema, schemaDialect } from '../constraint-metadata'

/** Unknown dialects must not acquire JSON Schema validation semantics. */
export const hasSchemaConstraints = (schema: ConstraintSchema | undefined): boolean =>
  schema?.[schemaDialect] !== undefined &&
  schema[schemaDialect] !== 'unsupported' &&
  (schema.if !== undefined ||
    schema.contains !== undefined ||
    (schema[schemaDialect] === 'draft-07'
      ? Object.keys(schema.dependencies ?? {}).length > 0
      : Object.keys(schema.dependentRequired ?? {}).length > 0 ||
        Object.keys(schema.dependentSchemas ?? {}).length > 0))

/** Composition flattening must not combine conditions from different schema boundaries. */
export const hasCompositionConstraints = (input: unknown, seen = new Set<unknown>()): boolean => {
  if (!isObject(input)) return false
  const identity = unpackProxyShallow(input)
  if (seen.has(identity)) return false
  const schema = input as ConstraintSchema
  seen.add(identity)
  return (
    hasSchemaConstraints(schema) ||
    ['allOf', 'oneOf', 'anyOf'].some((keyword) => {
      const members = schema[keyword as 'allOf' | 'oneOf' | 'anyOf']
      return Array.isArray(members) && members.some((member) => hasCompositionConstraints(getResolvedRef(member), seen))
    })
  )
}
