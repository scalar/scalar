import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { isObjectLike } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

/**
 * Keywords that describe a value without constraining it. An `allOf` member made only of these
 * accepts every value, so it adds nothing to the composition.
 *
 * Deliberately closed: an `x-*` key can change what a member means to a tool reading it, so a member
 * carrying one is left alone.
 */
const ANNOTATION_KEYWORDS = new Set([
  'title',
  'description',
  'example',
  'examples',
  'default',
  'deprecated',
  'readOnly',
  'writeOnly',
  'externalDocs',
  '$comment',
])

/**
 * Keywords that only document a site. `default`, `deprecated`, `readOnly` and `writeOnly` are absent
 * on purpose: they change how the site behaves, so a wrapper carrying them keeps its `allOf`.
 */
const DOCUMENTATION_KEYWORDS = new Set(['title', 'description', 'example', 'examples', 'externalDocs', '$comment'])

/** Segments whose entries are named, reusable definitions. */
const DEFINITION_MAP_SEGMENTS = new Set(['$defs', 'definitions'])

/** The JSON pointer (without the leading `#`) for a traversal path. */
const pointerOf = (path: readonly string[]): string => path.map((segment) => `/${escapeJsonPointer(segment)}`).join('')

/**
 * Whether an `allOf` member carries annotations only. An empty `{}` is left alone: it documents
 * nothing, so it is not the documentation workaround this upgrade undoes.
 */
const isAnnotationOnly = (member: unknown): member is UnknownObject =>
  isObjectLike(member) &&
  Object.keys(member).length > 0 &&
  Object.keys(member).every((key) => ANNOTATION_KEYWORDS.has(key))

/** Whether a value is a `$ref` with nothing but documentation beside it. */
const isDocumentedRef = (value: unknown): value is UnknownObject & { $ref: string } =>
  isObjectLike(value) &&
  typeof value.$ref === 'string' &&
  Object.keys(value).every((key) => key === '$ref' || DOCUMENTATION_KEYWORDS.has(key))

/** Whether a path names a reusable definition, such as `components/schemas/User`. */
const isDefinitionRoot = (path: readonly string[]): boolean => {
  const parent = path.at(-2)
  if (parent === 'schemas' && path.at(-3) === 'components' && path.length === 3) {
    return true
  }
  return parent !== undefined && DEFINITION_MAP_SEGMENTS.has(parent)
}

/**
 * Collects the pointer of every node a local `$ref` passes through or lands on.
 *
 * Collected from the original document, before anything is rewritten, so the collapse can leave
 * those nodes alone: `#/components/schemas/Order/properties/buyer/allOf/0` stops resolving once
 * `buyer` stops being an `allOf`, and so does a pointer at an annotation member it would drop.
 */
export const collectReferencedPointers = (document: unknown): Set<string> => {
  const pointers = new Set<string>()
  const seen = new WeakSet<object>()

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!isObjectLike(value) || seen.has(value)) {
      return
    }
    seen.add(value)

    const ref = value.$ref
    if (typeof ref === 'string' && ref.startsWith('#/')) {
      const segments = parseJsonPointerSegments(ref.slice(1))
      for (let length = 0; length <= segments.length; length++) {
        pointers.add(pointerOf(segments.slice(0, length)))
      }
    }

    Object.values(value).forEach(visit)
  }

  visit(document)
  return pointers
}

/**
 * Collapses `allOf` members that only annotate the composition.
 *
 * OpenAPI 3.0 ignores everything beside a `$ref`, so exporters that want to document a reference
 * wrap it: `allOf: [{ $ref: X }, { description: '…', example: … }]`. The second member constrains
 * nothing, but tools read the pair as a composition of two schemas (an `X & unknown` intersection,
 * or two panels where one is meant). OpenAPI 3.1 allows those keywords beside a `$ref`, so the
 * upgrade restores the shape the author meant.
 *
 * - The annotation members after the last constraining member are dropped, and their keywords move
 *   onto the wrapper (the wrapper's own keywords win, then earlier members'). Only trailing members
 *   go, so every remaining member keeps its index.
 * - A wrapper left with one documented `$ref` and only documentation becomes that `$ref`, with the
 *   documentation beside it.
 * - A named definition keeps its wrapper, so a documented subtype does not turn into an alias of
 *   its base. So does any node a `$ref` points at or through, which would otherwise stop resolving.
 *
 * Expects its members already upgraded, which the bottom-up traversal guarantees.
 */
export const collapseAnnotationOnlyAllOf = (
  schema: UnknownObject,
  path: readonly string[],
  referencedPointers: ReadonlySet<string>,
): UnknownObject => {
  const members = schema.allOf
  if (!Array.isArray(members) || members.length < 2) {
    return schema
  }

  const isReferenced = (index: number): boolean => referencedPointers.has(pointerOf([...path, 'allOf', String(index)]))
  // The last member that has to stay: one that constrains, or one a `$ref` points at.
  let lastKept = members.length - 1
  while (lastKept >= 0 && isAnnotationOnly(members[lastKept]) && !isReferenced(lastKept)) {
    lastKept--
  }
  if (lastKept < 0 || lastKept === members.length - 1) {
    return schema
  }

  const remaining = members.slice(0, lastKept + 1)
  const collapsed: UnknownObject = { ...schema, allOf: remaining }
  for (const member of members.slice(lastKept + 1) as UnknownObject[]) {
    for (const [key, value] of Object.entries(member)) {
      if (!(key in collapsed)) {
        collapsed[key] = value
      }
    }
  }

  const [onlyMember] = remaining
  const keepsWrapper = isDefinitionRoot(path) || referencedPointers.has(pointerOf(path))
  const onlyDocuments = Object.keys(collapsed).every((key) => key === 'allOf' || DOCUMENTATION_KEYWORDS.has(key))
  if (keepsWrapper || remaining.length !== 1 || !isDocumentedRef(onlyMember) || !onlyDocuments) {
    return collapsed
  }

  const { allOf: _allOf, ...documentation } = collapsed
  return { ...onlyMember, ...documentation }
}
