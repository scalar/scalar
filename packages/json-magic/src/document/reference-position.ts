import { isObject } from '@scalar/helpers/object/is-object'

import {
  type ReferenceContext,
  childReferenceContext,
  getSchemaVocabulary,
  isReferenceContext,
  isSchemaContext,
  isSchemaMapContext,
} from './reference-context'

const schemaTypes = new Set(['null', 'boolean', 'object', 'array', 'number', 'integer', 'string'])

/** Explicit schema declarations distinguish schema maps from arbitrary custom objects. */
export const declaresSchema = (value: unknown): boolean =>
  isObject(value) &&
  (typeof value.$id === 'string' ||
    typeof value.$schema === 'string' ||
    typeof value.$anchor === 'string' ||
    (typeof value.type === 'string' && schemaTypes.has(value.type)) ||
    (Array.isArray(value.type) && value.type.every((type) => typeof type === 'string' && schemaTypes.has(type))))

/** The vocabulary of a reference position and the dialect inherited by its children. */
export type ReferencePosition = {
  context: ReferenceContext
  schemaSiblings: boolean
  childSchemaSiblings: boolean
  customReferences: boolean
}

/** Select an occurrence's vocabulary, including schemas declared inside custom values. */
export const referencePosition = (
  value: unknown,
  inherited: ReferenceContext,
  inheritedSiblings: boolean,
  customReferences: boolean,
): ReferencePosition => {
  const customSchema = customReferences && inherited === 'object' && declaresSchema(value)
  const context = customSchema ? 'schema' : inherited
  const vocabularySiblings = customSchema || inheritedSiblings
  const childSchemaSiblings =
    isObject(value) && typeof value.$schema === 'string'
      ? vocabularySiblings && !/draft-0[3467]/.test(value.$schema)
      : vocabularySiblings
  // Keep the inherited dialect separate for wrappers containing newer schemas.
  const schemaSiblings =
    customReferences && !isSchemaContext(context)
      ? true
      : childSchemaSiblings && (getSchemaVocabulary(context)?.referenceSiblings ?? true)
  return { context, schemaSiblings, childSchemaSiblings, customReferences }
}

/** Ignored reference siblings cannot introduce schema resources or anchors. */
export const ignoresReferenceSiblings = (value: unknown, position: ReferencePosition): boolean => {
  const { context, schemaSiblings, customReferences } = position
  return (
    context !== 'generic' &&
    context !== 'path-item' &&
    isReferenceContext(context) &&
    isObject(value) &&
    typeof value.$ref === 'string' &&
    ((!isSchemaContext(context) && !customReferences) || !schemaSiblings)
  )
}

/** Carry the custom interpretation only when crossing into an opted-in branch. */
export const childReferencePosition = (
  value: object,
  key: string,
  { context, customReferences }: ReferencePosition,
  { swagger, asyncapi, openapi30 }: { swagger: boolean; asyncapi: boolean; openapi30: boolean },
  includeCustomReferences: boolean,
): Pick<ReferencePosition, 'context' | 'customReferences'> => {
  const schemaFormat = isObject(value) && typeof value.schemaFormat === 'string' ? value.schemaFormat : undefined
  const next =
    Array.isArray(value) && !['objects', 'messages'].includes(context) && !isSchemaMapContext(context)
      ? context
      : childReferenceContext(context, key, {
          swagger,
          openapi30,
          asyncapi,
          schemaFormat,
          includeCustomReferences,
          customReferences,
        })
  return {
    context: next,
    customReferences:
      customReferences ||
      (includeCustomReferences &&
        next !== 'data' &&
        childReferenceContext(context, key, { swagger, asyncapi, schemaFormat }) === 'data'),
  }
}
