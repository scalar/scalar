import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ReferenceType, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getRefName } from './get-ref-name'

/**
 * One run of a type signature. `word` is English describing a shape (`array of`,
 * `or`) in the sans face; `ident` is something the reader would type (a model
 * name, a type keyword) in the code face; `literal` is an enum or const value
 * quoted as JSON; `punctuation` is the muted `|` between union members.
 */
type TypeSignatureToken = {
  kind: 'word' | 'ident' | 'literal' | 'punctuation'
  text: string
}

/** Enums up to this many values render inline in the type position. */
const INLINE_ENUM_LIMIT = 3

/** Extensions that attach meaning to individual enum values. */
const ENUM_ANNOTATION_KEYS = ['x-enumDescriptions', 'x-enum-descriptions', 'x-enum-varnames', 'x-enumNames'] as const

/** Quote an enum or const value the way JSON would. */
const formatLiteral = (value: unknown): string => (typeof value === 'string' ? `"${value}"` : String(value))

const word = (text: string): TypeSignatureToken => ({ kind: 'word', text })
const ident = (text: string): TypeSignatureToken => ({ kind: 'ident', text })
const literal = (text: string): TypeSignatureToken => ({
  kind: 'literal',
  text,
})
const pipe = (): TypeSignatureToken => ({ kind: 'punctuation', text: '|' })

/** Join token lists with a separator token, like Array.prototype.join. */
const joinTokens = (lists: TypeSignatureToken[][], separator: () => TypeSignatureToken[]): TypeSignatureToken[] =>
  lists.flatMap((tokens, index) => (index === 0 ? tokens : [...separator(), ...tokens]))

/**
 * Whether the signature will actually render this schema's enum values inline.
 * The tree layout drops the separate value list for short enums on that
 * assumption, so it must be checked: a `$ref` renders as the model name before
 * reaching the enum branch, and a schema with no `type` renders no type detail,
 * so in both cases the values would otherwise be shown nowhere.
 */
export const typeSignatureInlinesEnum = (
  valueOrRef: SchemaObject | ReferenceType<SchemaObject> | undefined,
  options: { hideModelNames?: boolean } = {},
  /** Set when recursing into an array's items, which need no `type` of their own. */
  isItems = false,
): boolean => {
  if (!valueOrRef || typeof valueOrRef !== 'object') {
    return false
  }

  // A named $ref returns the model name before ever reaching the enum branch.
  if (
    '$ref' in valueOrRef &&
    typeof valueOrRef.$ref === 'string' &&
    !options.hideModelNames &&
    getRefName(valueOrRef.$ref)
  ) {
    return false
  }

  const value = getResolvedRef(valueOrRef)

  if (!value || typeof value !== 'object' || value.const !== undefined) {
    return false
  }

  // A schema with no `type` renders no signature to carry the values. Items are
  // exempt: the array signature's enum branch needs no `type` of its own.
  if (!isItems && !('type' in value)) {
    return false
  }

  const type = (value as { type?: unknown }).type

  // `type: ['array', 'null']` takes the union branch, which still recurses into
  // items, so it inlines the item enum exactly like a plain array.
  const isArrayType = type === 'array' || (Array.isArray(type) && type.includes('array'))

  // getEnumValues resolves items the same way the signature does, so the items
  // must be tested here or the values render twice.
  const items = 'items' in value ? value.items : undefined

  if (isArrayType && items && typeof items === 'object') {
    return typeSignatureInlinesEnum(items as SchemaObject, options, true)
  }

  // Bare literals cannot carry `x-enumDescriptions` or `x-enum-varnames`, so an
  // annotated enum keeps its value list (SchemaEnums' chip branch does the same).
  const annotated = ENUM_ANNOTATION_KEYS.some((key) => (value as Record<string, unknown>)[key])

  if (annotated) {
    return false
  }

  return Array.isArray(value.enum) && value.enum.length > 0 && value.enum.length <= INLINE_ENUM_LIMIT
}

/**
 * Compute the type signature of a schema as token runs: `array Planet[]` becomes
 * `array of Planet`, where "array of" is English and `Planet` stays an
 * identifier. Short enums render inline (`"standard" or "enterprise"`) because
 * two values are a type, not a list worth its own rows. A `$ref` to a named
 * model renders as the model name itself.
 */
export const getTypeSignatureTokens = (
  valueOrRef: SchemaObject | ReferenceType<SchemaObject> | undefined,
  options: { hideModelNames?: boolean } = {},
  depth = 0,
): TypeSignatureToken[] => {
  if (!valueOrRef || typeof valueOrRef !== 'object') {
    return []
  }

  // A $ref to a named model: the name is the type.
  if ('$ref' in valueOrRef && typeof valueOrRef.$ref === 'string') {
    const refName = options.hideModelNames ? null : getRefName(valueOrRef.$ref)

    if (refName) {
      return [ident(refName)]
    }
  }

  const value = getResolvedRef(valueOrRef)

  if (!value || typeof value !== 'object') {
    return []
  }

  // const renders as its value, not as the word "const".
  if (value.const !== undefined) {
    return [literal(formatLiteral(value.const))]
  }

  // A short enum is the type, inline, unless its values carry descriptions or
  // names, which only the value list can show.
  if (
    Array.isArray(value.enum) &&
    value.enum.length > 0 &&
    value.enum.length <= INLINE_ENUM_LIMIT &&
    !ENUM_ANNOTATION_KEYS.some((key) => (value as Record<string, unknown>)[key])
  ) {
    return joinTokens(
      value.enum.map((entry) => [literal(formatLiteral(entry))]),
      () => [word('or')],
    )
  }

  // Union types: string | null with the pipe muted.
  if ('type' in value && Array.isArray(value.type)) {
    return joinTokens(
      value.type.map((entry) => (entry === 'array' ? arrayTokens(value, options, depth) : [ident(String(entry))])),
      () => [pipe()],
    )
  }

  if ('type' in value && value.type === 'array') {
    return arrayTokens(value, options, depth)
  }

  if ('type' in value && value.type && value.contentEncoding) {
    return [ident(String(value.type)), word('•'), ident(value.contentEncoding)]
  }

  if ('type' in value && value.type) {
    return [ident(String(value.type))]
  }

  return []
}

/** Guard against a pathological items chain; deeper than this reads as noise anyway. */
const MAX_ARRAY_DEPTH = 8

const arrayTokens = (
  value: SchemaObject,
  options: { hideModelNames?: boolean },
  depth: number,
): TypeSignatureToken[] => {
  const items = 'items' in value ? value.items : undefined

  if (!items || depth >= MAX_ARRAY_DEPTH) {
    return [ident('array')]
  }

  const itemTokens = getTypeSignatureTokens(items as SchemaObject | ReferenceType<SchemaObject>, options, depth + 1)

  if (itemTokens.length === 0) {
    return [ident('array')]
  }

  return [word('array of'), ...itemTokens]
}
