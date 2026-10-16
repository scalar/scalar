import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

import { type ConstraintSchema, schemaDialect } from '../constraint-metadata'

/** Only native AsyncAPI and declared Draft-07 views opt into these semantics. */
export const hasSchemaConstraints = (schema: ConstraintSchema | undefined): boolean =>
  schema?.[schemaDialect] === 'draft-07' &&
  (schema.if !== undefined || schema.contains !== undefined || Object.keys(schema.dependencies ?? {}).length > 0)

/** Composition flattening must not combine conditions from different schema boundaries. */
export const hasCompositionConstraints = (input: unknown, seen = new Set<unknown>()): boolean => {
  if (!isObject(input) || seen.has(input)) return false
  const schema = input as ConstraintSchema
  if (schema[schemaDialect] !== 'draft-07') return false
  seen.add(input)
  return (
    hasSchemaConstraints(schema) ||
    ['allOf', 'oneOf', 'anyOf'].some((keyword) => {
      const members = schema[keyword as 'allOf' | 'oneOf' | 'anyOf']
      return members?.some((member) => hasCompositionConstraints(getResolvedRef(member), seen)) ?? false
    })
  )
}
