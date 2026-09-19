import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

/**
 * Stable ids for the objects a signature records.
 *
 * A signature has to notice that a node was swapped for a different one, but it
 * must not keep that node alive, so it records an id instead of the object. Ids
 * live in a `WeakMap`, so they die with the document.
 */
const objectIds = new WeakMap<object, number>()
let nextObjectId = 0

const objectId = (value: object): number => {
  const existing = objectIds.get(value)

  if (existing !== undefined) {
    return existing
  }

  nextObjectId += 1
  objectIds.set(value, nextObjectId)

  return nextObjectId
}

/** Markers, so a key named `allOf` can never be confused with the list it introduces. */
const OBJECT = Symbol('object')
const LIST = Symbol('list')
const MAP = Symbol('map')
const CYCLE = Symbol('cycle')
const REFERENCE = Symbol('reference')

/** Keys whose value is another schema. */
const SCHEMA_KEYS = new Set([
  'additionalProperties',
  'contains',
  'else',
  'if',
  'items',
  'not',
  'propertyNames',
  'then',
  'unevaluatedItems',
  'unevaluatedProperties',
])

/** Keys whose value is a list of schemas. */
const SCHEMA_LIST_KEYS = new Set(['allOf', 'anyOf', 'oneOf', 'prefixItems'])

/** Keys whose value maps names to schemas. */
const SCHEMA_MAP_KEYS = new Set(['$defs', 'definitions', 'patternProperties', 'properties'])

/** Keys whose value is a list a merge rebuilds from both sides. */
const VALUE_LIST_KEYS = new Set(['enum', 'required'])

const visitValue = (value: unknown, signature: unknown[]): void => {
  if (value === null || typeof value !== 'object') {
    signature.push(value)
    return
  }

  if (Array.isArray(value)) {
    signature.push(LIST, value.length)

    for (const item of value) {
      visitValue(item, signature)
    }

    return
  }

  signature.push(REFERENCE, objectId(value))
}

const visitSchemaMap = (map: unknown, signature: unknown[], seen: Set<object>): void => {
  if (map === null || typeof map !== 'object') {
    signature.push(map)
    return
  }

  if (seen.has(map)) {
    signature.push(CYCLE, objectId(map))
    return
  }

  seen.add(map)
  signature.push(MAP, objectId(map))

  for (const name of Object.keys(map)) {
    signature.push(name)
    visitSchema((map as Record<string, unknown>)[name], signature, seen)
  }
}

/**
 * Records one schema, following every key whose value a merge reads into its result.
 *
 * Anything else is recorded by identity alone: a merge copies those values into
 * its result by reference, so the renderer reads them live and an edit inside one
 * cannot make a merged result stale.
 */
const visitSchema = (schema: unknown, signature: unknown[], seen: Set<object>): void => {
  if (schema === null || typeof schema !== 'object') {
    signature.push(schema)
    return
  }

  if (Array.isArray(schema)) {
    signature.push(LIST, schema.length)

    for (const item of schema) {
      visitSchema(item, signature, seen)
    }

    return
  }

  if (seen.has(schema)) {
    signature.push(CYCLE, objectId(schema))
    return
  }

  seen.add(schema)
  signature.push(OBJECT, objectId(schema))

  const record = schema as Record<string, unknown>

  for (const key of Object.keys(record)) {
    // The magic proxy synthesises this from `$ref`, which is followed below.
    if (key === '$ref-value') {
      continue
    }

    signature.push(key)

    const value = record[key]

    if (SCHEMA_KEYS.has(key) || SCHEMA_LIST_KEYS.has(key)) {
      visitSchema(value, signature, seen)
      continue
    }

    if (SCHEMA_MAP_KEYS.has(key)) {
      visitSchemaMap(value, signature, seen)
      continue
    }

    if (VALUE_LIST_KEYS.has(key)) {
      visitValue(value, signature)
      continue
    }

    if (value === null || typeof value !== 'object') {
      signature.push(value)
      continue
    }

    signature.push(REFERENCE, objectId(value))
  }

  // A merge reads through `$ref`, so the target belongs to the signature too.
  if (typeof record.$ref === 'string') {
    visitSchema(getResolvedRef(record as { $ref: string; '$ref-value': unknown }), signature, seen)
  }
}

/**
 * A flat record of everything a merge of this schema reads into its result.
 *
 * Two signatures taken from the same node compare equal exactly while every
 * value the merge would read is unchanged, so an entry keyed by node identity
 * can be checked against the live document without merging again. Strings
 * compare by pointer first, so an untouched description costs one comparison.
 */
export const schemaSignature = (schema: unknown): unknown[] => {
  const signature: unknown[] = []

  visitSchema(schema, signature, new Set())

  return signature
}

/**
 * A flat record of a node's own entries and of the entries behind its `$ref`.
 *
 * For a walk that only merges the two levels — resolving a reference onto its
 * siblings, say — this is the whole read set, and it costs one pass over the
 * keys rather than a walk of the graph the schema reaches.
 */
export const shallowSchemaSignature = (node: unknown): unknown[] => {
  const signature: unknown[] = []

  visitOwnEntries(node, signature)

  if (node !== null && typeof node === 'object' && typeof (node as Record<string, unknown>).$ref === 'string') {
    visitOwnEntries(getResolvedRef(node as { $ref: string; '$ref-value': unknown }), signature)
  }

  return signature
}

/**
 * A flat record of a node's own entries and of the members a composition folds into it.
 *
 * `optimizeValueForDisplay` flattens a composition by spreading its members, one
 * level of their own `allOf`, and their `properties` and `required`; everything
 * below that it copies by reference. This records exactly that much.
 */
export const compositionSchemaSignature = (node: unknown): unknown[] => {
  const signature: unknown[] = []

  visitOwnEntries(node, signature)

  if (node === null || typeof node !== 'object') {
    return signature
  }

  const record = node as Record<string, unknown>

  if (typeof record.$ref === 'string') {
    visitOwnEntries(getResolvedRef(record as { $ref: string; '$ref-value': unknown }), signature)
  }

  for (const keyword of COMPOSITION_KEYWORDS) {
    const members = record[keyword]

    if (!Array.isArray(members)) {
      continue
    }

    signature.push(keyword, members.length)

    for (const member of members) {
      visitCompositionMember(member, signature, true)
    }
  }

  return signature
}

const COMPOSITION_KEYWORDS = ['allOf', 'anyOf', 'oneOf', 'not']

const visitCompositionMember = (member: unknown, signature: unknown[], followNestedAllOf: boolean): void => {
  visitOwnEntries(member, signature)

  if (member === null || typeof member !== 'object') {
    return
  }

  const record = member as Record<string, unknown>
  const resolved =
    typeof record.$ref === 'string'
      ? (getResolvedRef(record as { $ref: string; '$ref-value': unknown }) as Record<string, unknown> | undefined)
      : record

  if (resolved !== record) {
    visitOwnEntries(resolved, signature)
  }

  if (resolved === null || typeof resolved !== 'object') {
    return
  }

  // `properties` and `required` are unioned into the flattened schema, so their
  // own entries decide the result; what each property holds is copied by reference.
  visitOwnEntries(resolved.properties, signature)
  visitOwnEntries(resolved.required, signature)

  if (followNestedAllOf && Array.isArray(resolved.allOf) && resolved.allOf.length === 1) {
    visitCompositionMember(resolved.allOf[0], signature, false)
  }
}

const visitOwnEntries = (node: unknown, signature: unknown[]): void => {
  if (node === null || typeof node !== 'object') {
    signature.push(node)
    return
  }

  signature.push(OBJECT, objectId(node))

  const record = node as Record<string, unknown>

  for (const key of Object.keys(record)) {
    if (key === '$ref-value') {
      continue
    }

    signature.push(key)

    const value = record[key]

    if (value === null || typeof value !== 'object') {
      signature.push(value)
      continue
    }

    signature.push(REFERENCE, objectId(value))
  }
}

/** Whether two signatures describe the same reads. */
export const signaturesMatch = (left: readonly unknown[], right: readonly unknown[]): boolean => {
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index++) {
    if (!Object.is(left[index], right[index])) {
      return false
    }
  }

  return true
}
