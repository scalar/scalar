import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { resolve } from '@scalar/workspace-store/resolve'
import type { DiscriminatorObject, SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { isTypeObject } from './is-type-object'

/** Extract the type of properties */
type Properties = NonNullable<Extract<SchemaObject, { type: 'object' }>['properties']>

type Options = Partial<
  Pick<ApiReferenceConfiguration, 'orderSchemaPropertiesBy' | 'orderRequiredPropertiesFirst'> & {
    hideReadOnly: boolean
    hideWriteOnly: boolean
  }
>

/** Take a list of property names and reduce it back into an object */
export const reduceNamesToObject = (names: string[], properties: Properties): Properties =>
  names.reduce<Properties>((acc, name) => {
    const prop = properties?.[name]
    if (prop) {
      acc[name] = prop
    }
    return acc
  }, {})

/**
 * One collator for every sort, rather than a fresh locale lookup per comparison.
 * `String.localeCompare` builds its collator on each call, which dominates the
 * comparator on schemas with many properties; `Intl.Collator` is the same
 * ordering with the setup hoisted out of the loop.
 */
const collator = new Intl.Collator(undefined)

/**
 * Everything the comparator needs to know about one property, read once.
 *
 * The comparator used to fetch `schema.properties[name]` and probe it for
 * `x-order` on every comparison. In the app the document is a stack of proxies
 * (reactive, change detection, overrides, `$ref` magic), so each of those reads
 * costs microseconds and a sort makes `n log n` of them: a 60-property object
 * took milliseconds per sort. With the inputs hoisted the comparator only reads
 * plain fields. It makes the same decisions in the same order on the same
 * values, and `Array.prototype.sort` is stable, so the result is identical.
 */
type PropertyRecord = {
  name: string
  /** The `x-order` extension value, `undefined` when the property does not carry one */
  order: unknown
  required: boolean
  discriminator: boolean
}

/**
 * Sorted names, memoised per `properties` object.
 *
 * A row sorts its children while it is collapsed (for the preview) and again
 * when it opens (for the panel), and every row that `$ref`s the same schema
 * sorts the same `properties` object over again. That object's identity
 * survives each copy on the render path (the display-time spreads keep the
 * reference, and every proxy layer caches its child proxies per target), so it
 * is a stable key, and a `WeakMap` lets the entries die with the document.
 *
 * An entry is valid only while `schema.required` is the same array: the
 * composition path builds a fresh `properties` AND a fresh `required` when it
 * merges variants, so a merged schema never hits a stale entry. Every option
 * that affects the order is part of the inner key. Nothing else the sort reads
 * changes while a document is rendered: api-reference never rewrites a schema
 * subtree in place, it swaps whole documents.
 */
type SortCacheEntry = {
  required: unknown
  names: readonly string[]
}
const sortCache = new WeakMap<object, Map<string, SortCacheEntry>>()

/** The one array every "nothing to sort" answer returns, frozen like the sorted ones. */
const EMPTY_NAMES: readonly string[] = Object.freeze([])

/**
 * Sort property names in an object schema.
 *
 * The returned array is shared with later calls for the same schema and options,
 * so it is frozen: an in-place `sort` / `reverse` / `splice` by one caller would
 * otherwise silently reorder every other consumer of the same schema. Callers
 * that need a mutable list copy it first (`slice`).
 */
export const sortPropertyNames = (
  schema: SchemaObject,
  discriminator?: DiscriminatorObject,
  {
    hideReadOnly = false,
    hideWriteOnly = false,
    orderSchemaPropertiesBy = 'alpha',
    orderRequiredPropertiesFirst = true,
  }: Options = {},
): readonly string[] => {
  if (!isTypeObject(schema) || !schema.properties) {
    return EMPTY_NAMES
  }

  const properties = schema.properties
  const required = schema.required
  const discriminatorName = discriminator?.propertyName

  // A `!` marks a present discriminator so an absent one can never collide with
  // a property literally named like the placeholder.
  const cacheKey = [
    discriminatorName === undefined ? '' : `!${discriminatorName}`,
    hideReadOnly,
    hideWriteOnly,
    orderSchemaPropertiesBy,
    orderRequiredPropertiesFirst,
  ].join('|')

  const bucket = sortCache.get(properties)
  const cached = bucket?.get(cacheKey)
  if (cached && cached.required === required) {
    return cached.names
  }

  const requiredPropertiesSet = new Set(required || [])

  /*
   * Filter BEFORE sorting, and only when something is actually hidden.
   *
   * The filter resolves every property through `resolve.schema` to read
   * `readOnly`/`writeOnly`; with neither flag set that is a full resolve pass
   * per schema whose result is always "keep". Skipping it there, and shrinking
   * the array the comparator runs over when it does apply, leaves the ordering
   * identical — the filter is order-preserving and independent of the compare.
   * It shares the single read of each property with the record below.
   */
  const shouldFilter = hideReadOnly || hideWriteOnly
  const records: PropertyRecord[] = []

  for (const name of Object.keys(properties)) {
    const propertySchema = properties[name]

    if (shouldFilter) {
      const resolved = resolve.schema(propertySchema)

      if (hideReadOnly && resolved?.readOnly === true) {
        continue
      }
      if (hideWriteOnly && resolved?.writeOnly === true) {
        continue
      }
    }

    records.push({
      name,
      order:
        propertySchema && typeof propertySchema === 'object' && 'x-order' in propertySchema
          ? propertySchema['x-order']
          : undefined,
      required: requiredPropertiesSet.has(name),
      discriminator: name === discriminatorName,
    })
  }

  records.sort((a, b) => {
    // Discriminator comes first always
    if (a.discriminator && !b.discriminator) {
      return -1
    }
    if (!a.discriminator && b.discriminator) {
      return 1
    }

    // Sort by x-order specification extension when present
    if (a.order !== undefined && b.order !== undefined) {
      return Number(a.order) - Number(b.order)
    }
    if (a.order !== undefined && b.order === undefined) {
      return -1
    }
    if (a.order === undefined && b.order !== undefined) {
      return 1
    }

    // Order required properties first
    if (orderRequiredPropertiesFirst) {
      // If one is required and the other isn't, required comes first
      if (a.required && !b.required) {
        return -1
      }
      if (!a.required && b.required) {
        return 1
      }
    }

    // If both have the same required status, sort alphabetically
    if (orderSchemaPropertiesBy === 'alpha') {
      return collator.compare(a.name, b.name)
    }

    return 0
  })

  // Frozen before it is shared, so a caller that sorts or splices it in place
  // fails loudly here instead of corrupting every other reader of this schema.
  const names = Object.freeze(records.map((record) => record.name))

  // A malformed document can carry a non-object `properties`; that cannot key
  // a WeakMap, so it simply goes uncached.
  if (typeof properties === 'object' && properties !== null) {
    if (bucket) {
      bucket.set(cacheKey, { required, names })
    } else {
      sortCache.set(properties, new Map([[cacheKey, { required, names }]]))
    }
  }

  return names
}
