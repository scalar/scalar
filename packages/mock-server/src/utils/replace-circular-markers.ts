import { isObject } from '@scalar/helpers/object/is-object'

/**
 * The placeholder `getResolvedRefDeep` leaves behind wherever it had to cut a `$ref` cycle.
 *
 * The marker is owned by `@scalar/workspace-store`; the Ajv test in this file's suite resolves a real
 * recursive schema, so it fails here if that sentinel ever changes.
 */
const CIRCULAR_MARKER = '[circular]'

/**
 * Keywords whose value is a schema, or an array of schemas.
 *
 * `items` covers the JSON Schema 2020-12 form as well as the older tuple form, which the walker reads
 * structurally — a tuple `items` does not compile under 2020-12 either way, with or without a cut.
 * `additionalItems` is listed for the same reason: Ajv 2020 ignores the keyword, but an older document
 * carrying one still walks cleanly.
 */
const SCHEMA_KEYWORDS = new Set([
  'additionalItems',
  'additionalProperties',
  'allOf',
  'anyOf',
  'contains',
  'contentSchema',
  'else',
  'if',
  'items',
  'not',
  'oneOf',
  'prefixItems',
  'propertyNames',
  'then',
  'unevaluatedItems',
  'unevaluatedProperties',
])

/**
 * Keywords whose value maps names to schemas. Their keys are author-chosen names rather than
 * keywords, so the walker must not read them as keywords of their own.
 */
const SCHEMA_MAP_KEYWORDS = new Set([
  '$defs',
  'definitions',
  // Ajv 2020 still implements the draft-07 `dependencies`, so a marker under it has to be rewritten
  // too. Its array form (`{ name: ['other'] }`) walks through untouched.
  'dependencies',
  'dependentSchemas',
  'patternProperties',
  'properties',
])

/** Map keywords `additionalProperties` reads to decide which properties it still applies to */
const PROPERTY_MAP_KEYWORDS = new Set(['patternProperties', 'properties'])

/**
 * Keywords that invert what a relaxed subschema means: matching more values there makes the schema as
 * a whole reject more requests. Verified against Ajv — `not: {}` rejects every request, `if: {}`
 * forces `then` onto every request, `oneOf: [{}, …]` rejects anything that also matches a sibling
 * branch (a recursive union or a nullable recursive reference being the realistic cases), and a
 * `contains` that matches more items can overshoot `maxContains`. Whenever the cycle was cut anywhere
 * below one of these, the keyword is dropped instead, so a valid request is never turned away.
 */
const INVERTING_SCHEMA_KEYWORDS = new Set(['contains', 'if', 'not', 'oneOf'])

/**
 * In-place applicators, whose subschemas decide which properties and items count as evaluated. A
 * relaxed branch stops contributing those annotations, so a sibling `unevaluatedProperties` or
 * `unevaluatedItems` would start rejecting values it used to accept. `if` and `oneOf` are listed for
 * completeness; a relaxed one of those is dropped by the inverting rule before it gets here, which
 * clears the sibling anyway.
 */
const IN_PLACE_SCHEMA_KEYWORDS = new Set([
  'allOf',
  'anyOf',
  'dependencies',
  'dependentSchemas',
  'else',
  'if',
  'oneOf',
  'then',
])

/**
 * Keywords whose value has to be an array of schemas. A cut at the array itself cannot be answered
 * with a schema, so the keyword is dropped rather than left as something Ajv refuses to compile.
 * `oneOf` belongs here too but never reaches it, because the inverting rule already drops it.
 */
const SCHEMA_ARRAY_KEYWORDS = new Set(['allOf', 'anyOf', 'prefixItems'])

/** A rewritten value, plus whether the rewrite made anything inside it accept more than it used to */
type Rewrite = {
  value: unknown
  relaxed: boolean
}

/**
 * Replace the `'[circular]'` markers `getResolvedRefDeep` leaves in schema positions with an empty
 * (always-valid) schema.
 *
 * A recursive schema — a `Node` whose `child` is another `Node` — resolves to a document where the
 * recursion point is the *string* `'[circular]'`. Ajv rejects the whole schema for it
 * (`data/properties/child must be object,boolean`), so a single recursive type silently disabled
 * validation of the request body, or of every parameter in the same location. Accepting anything at
 * the point where the cycle was cut keeps the rest of the schema enforceable.
 *
 * The rewrite only ever loosens what is enforced, so it can lose a violation but never invent one.
 * That is why relaxing is tracked as it goes: under `not`, `if`, `oneOf` or `contains` a looser
 * subschema would make the schema *stricter*, so those keywords are dropped rather than rewritten,
 * and a sibling `unevaluatedProperties`/`unevaluatedItems` goes with a relaxed in-place applicator
 * for the same reason.
 *
 * Only known schema positions are rewritten. A marker anywhere else — `enum`, `const`, `default`,
 * `example`, or a vendor extension — is data rather than a schema Ajv compiles, so it is copied
 * through untouched.
 */
export const replaceCircularMarkers = (schema: unknown): unknown => {
  // `getResolvedRefDeep` returns a graph, not a tree: one resolved schema object is shared by every
  // place that referenced it. Reusing the rewritten copy keeps a widely shared schema from being
  // walked once per occurrence, and is what makes the walk terminate rather than recur forever should
  // it ever be handed a genuinely cyclic object — which the resolver, having cut every cycle, is not
  // able to produce.
  //
  // Schemas and schema maps are cached apart, because the same object read as one or the other
  // rewrites differently: `{ not: … }` is a keyword in a schema and a schema named `not` in a map.
  const rewritten = new WeakMap<object, Rewrite>()
  const rewrittenMaps = new WeakMap<object, Rewrite>()

  const asSchema = (value: unknown): Rewrite => {
    // The cycle was cut here, so nothing is known about the value any more: accept anything.
    if (value === CIRCULAR_MARKER) {
      return { value: {}, relaxed: true }
    }

    if (!isObject(value) && !Array.isArray(value)) {
      return { value, relaxed: false }
    }

    const cached = rewritten.get(value)
    if (cached) {
      return cached
    }

    // Register each copy before filling it, so a self-referencing value resolves to the copy itself.
    if (Array.isArray(value)) {
      const items: unknown[] = []
      const rewrite: Rewrite = { value: items, relaxed: false }
      rewritten.set(value, rewrite)

      for (const item of value) {
        const child = asSchema(item)
        items.push(child.value)
        rewrite.relaxed ||= child.relaxed
      }

      return rewrite
    }

    const result: Record<string, unknown> = {}
    const rewrite: Rewrite = { value: result, relaxed: false }
    rewritten.set(value, rewrite)

    let droppedIf = false
    let droppedContains = false
    let droppedPrefixItems = false
    let droppedPropertyMap = false
    // Whether this schema stopped saying which properties and items it accounted for — either a
    // keyword was dropped outright, or a relaxed in-place branch no longer contributes what it did.
    let annotationsLost = false

    for (const [keyword, child] of Object.entries(value)) {
      if (!SCHEMA_KEYWORDS.has(keyword) && !SCHEMA_MAP_KEYWORDS.has(keyword)) {
        // Data rather than a schema, so it is carried over as it stands. Nothing mutates the result,
        // so sharing the value with the resolved document it came from is safe.
        result[keyword] = child
        continue
      }

      // A cut at an array-valued keyword itself cannot become a schema, so the keyword goes. A dropped
      // keyword also stops saying which properties and items it accounted for, so any `unevaluated*`
      // sibling has to go with it.
      if (SCHEMA_ARRAY_KEYWORDS.has(keyword) && child === CIRCULAR_MARKER) {
        droppedPrefixItems ||= keyword === 'prefixItems'
        rewrite.relaxed = true
        annotationsLost = true
        continue
      }

      // A cut at a schema map itself leaves an empty map, which accounts for nothing any more, so an
      // `unevaluated*` sibling has to go the same way a dropped keyword takes it.
      if (SCHEMA_MAP_KEYWORDS.has(keyword) && child === CIRCULAR_MARKER) {
        result[keyword] = {}
        droppedPropertyMap ||= PROPERTY_MAP_KEYWORDS.has(keyword)
        rewrite.relaxed = true
        annotationsLost = true
        continue
      }

      const rewrittenChild = SCHEMA_MAP_KEYWORDS.has(keyword) && isObject(child) ? asSchemaMap(child) : asSchema(child)

      if (INVERTING_SCHEMA_KEYWORDS.has(keyword) && rewrittenChild.relaxed) {
        droppedIf ||= keyword === 'if'
        droppedContains ||= keyword === 'contains'
        rewrite.relaxed = true
        annotationsLost = true
        continue
      }

      result[keyword] = rewrittenChild.value
      rewrite.relaxed ||= rewrittenChild.relaxed
      annotationsLost ||= rewrittenChild.relaxed && IN_PLACE_SCHEMA_KEYWORDS.has(keyword)
    }

    // `then` and `else` only apply alongside an `if`, so they leave with the dropped condition, and
    // `minContains`/`maxContains` only qualify a `contains`.
    if (droppedIf) {
      delete result.then
      delete result.else
    }

    if (droppedContains) {
      delete result.minContains
      delete result.maxContains
    }

    // `additionalProperties` and `items` only apply to what their siblings did not cover, so once that
    // sibling is gone they would start policing values it used to account for.
    if (droppedPropertyMap) {
      delete result.additionalProperties
    }

    if (droppedPrefixItems) {
      delete result.items
    }

    if (annotationsLost) {
      delete result.unevaluatedProperties
      delete result.unevaluatedItems
    }

    return rewrite
  }

  /** Rewrite every schema under a map keyword, keeping its author-chosen names as they are */
  const asSchemaMap = (map: Record<string, unknown>): Rewrite => {
    const cached = rewrittenMaps.get(map)
    if (cached) {
      return cached
    }

    const result: Record<string, unknown> = {}
    const rewrite: Rewrite = { value: result, relaxed: false }
    rewrittenMaps.set(map, rewrite)

    for (const [name, sub] of Object.entries(map)) {
      const child = asSchema(sub)
      result[name] = child.value
      rewrite.relaxed ||= child.relaxed
    }

    return rewrite
  }

  return asSchema(schema).value
}
