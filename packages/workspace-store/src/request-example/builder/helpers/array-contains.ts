import { isObject } from '@scalar/helpers/object/is-object'
import { isObjectEqual } from '@scalar/helpers/object/is-object-equal'

/** Dialects whose array assertions this bounded generator understands. */
type ArrayDialect = 'modern' | 'draft7' | 'unsupported'

/** Unknown dialects and pre-3.1 OpenAPI must not acquire modern contains semantics. */
export const getArrayDialect = (dialect?: string, openapiVersion?: string): ArrayDialect => {
  if (openapiVersion && !/^3\.[1-9](?:\.|$)/.test(openapiVersion)) {
    return 'unsupported'
  }
  if (!dialect || /^https:\/\/spec\.openapis\.org\/oas\/3\.[12]\/dialect\//.test(dialect)) {
    return 'modern'
  }
  const uri = dialect.replace(/#$/, '')
  if (uri === 'https://json-schema.org/draft/2020-12/schema') {
    return 'modern'
  }
  return uri === 'http://json-schema.org/draft-07/schema' ? 'draft7' : 'unsupported'
}

const MAX_NODES = 1000
const MAX_CANDIDATES = 128
const MAX_SCHEMA_VISITS = 64
const MAX_MATCH_STEPS = 50_000
const MAX_SEARCH_STEPS = 4096
const MAX_SCHEMA_DEPTH = 32

/** Malformed constraints are ignored consistently with the existing length generator. */
const bound = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : fallback

const annotations = new Set([
  '__scalar_',
  '$id',
  '$anchor',
  '$comment',
  '$defs',
  'definitions',
  '$schema',
  '$ref-value',
  'title',
  'description',
  'default',
  'example',
  'examples',
  'deprecated',
  'readOnly',
  'writeOnly',
  'xml',
  'externalDocs',
  'discriminator',
  'format',
  'contentEncoding',
  'contentMediaType',
  'contentSchema',
])
const assertions = new Set([
  '$ref',
  'type',
  'const',
  'enum',
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'minLength',
  'maxLength',
  'properties',
  'required',
  'additionalProperties',
  'minProperties',
  'maxProperties',
  'items',
  'prefixItems',
  'minItems',
  'maxItems',
  'uniqueItems',
  'contains',
  'minContains',
  'maxContains',
])

/** Count before comparing or repeating values, including authored cyclic/non-JSON values. */
const sizeOf = (value: unknown, seen = new Set<object>(), remaining = MAX_NODES): number => {
  if (value === null || typeof value !== 'object') {
    return 1
  }
  if (remaining <= 0 || seen.has(value)) {
    return MAX_NODES + 1
  }
  seen.add(value)
  let size = 1
  for (const child of Object.values(value)) {
    size += sizeOf(child, seen, remaining - size)
    if (size > remaining) {
      break
    }
  }
  seen.delete(value)
  return size
}

/**
 * Three-state matching: an unsupported assertion or a reference/depth limit is unknown, never a
 * proven nonmatch. This is deliberately a bounded subset, not a general JSON Schema validator.
 */
const matches = (
  schema: unknown,
  value: unknown,
  dialect: ArrayDialect,
  budget: { steps: number },
  seen = new Set<object>(),
): boolean | undefined => {
  if (--budget.steps < 0 || seen.size >= MAX_SCHEMA_DEPTH) {
    return undefined
  }
  if (typeof schema === 'boolean') {
    return schema
  }
  if (!isObject(schema) || seen.has(schema)) {
    return undefined
  }
  seen.add(schema)
  try {
    if (typeof schema.$schema === 'string') {
      dialect = getArrayDialect(schema.$schema)
      if (dialect === 'unsupported') return undefined
    }
    const checks: (boolean | undefined)[] = []
    const check = (child: unknown, data = value): boolean | undefined => matches(child, data, dialect, budget, seen)
    if (Object.keys(schema).some((key) => !assertions.has(key) && !annotations.has(key) && !key.startsWith('x-'))) {
      checks.push(undefined)
    }
    if ('$ref' in schema) {
      checks.push(check(schema['$ref-value']))
      // Draft-07 ignores reference siblings.
      if (dialect === 'draft7') {
        return checks.at(-1)
      }
    }
    if (schema.type !== undefined) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type]
      checks.push(
        types.some((type) => {
          if (type === 'null') return value === null
          if (type === 'array') return Array.isArray(value)
          if (type === 'object') return isObject(value)
          if (type === 'integer') return typeof value === 'number' && Number.isInteger(value)
          return typeof value === type
        }),
      )
    }
    if ('const' in schema)
      checks.push(sizeOf(schema.const) <= MAX_NODES ? isObjectEqual(value, schema.const) : undefined)
    if (Array.isArray(schema.enum)) {
      checks.push(
        schema.enum.length <= MAX_CANDIDATES && schema.enum.every((item) => sizeOf(item) <= MAX_NODES)
          ? schema.enum.some((item) => isObjectEqual(value, item))
          : undefined,
      )
    }
    for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
      const members = schema[keyword]
      if (!Array.isArray(members)) continue
      if (members.length > MAX_CANDIDATES) {
        checks.push(undefined)
        continue
      }
      const results = members.map((member) => check(member))
      checks.push(
        keyword === 'allOf'
          ? results.includes(false)
            ? false
            : results.includes(undefined)
              ? undefined
              : true
          : keyword === 'anyOf'
            ? results.includes(true)
              ? true
              : results.includes(undefined)
                ? undefined
                : false
            : results.includes(undefined)
              ? undefined
              : results.filter(Boolean).length === 1,
      )
    }
    if ('not' in schema) {
      const result = check(schema.not)
      checks.push(result === undefined ? undefined : !result)
    }
    if (typeof value === 'number') {
      for (const key of ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum'] as const) {
        const limit = schema[key]
        if (typeof limit !== 'number') continue
        checks.push(
          key === 'minimum'
            ? value >= limit
            : key === 'maximum'
              ? value <= limit
              : key === 'exclusiveMinimum'
                ? value > limit
                : value < limit,
        )
      }
    }
    if (typeof value === 'string') {
      const length = Array.from(value).length
      checks.push(length >= bound(schema.minLength, 0) && length <= bound(schema.maxLength, Number.POSITIVE_INFINITY))
    }
    if (isObject(value)) {
      const keys = Object.keys(value)
      checks.push(
        keys.length >= bound(schema.minProperties, 0) &&
          keys.length <= bound(schema.maxProperties, Number.POSITIVE_INFINITY),
      )
      if (Array.isArray(schema.required))
        checks.push(schema.required.every((key) => typeof key === 'string' && Object.hasOwn(value, key)))
      const properties = isObject(schema.properties) ? schema.properties : {}
      for (const key of keys) {
        if (Object.hasOwn(properties, key)) checks.push(check(properties[key], value[key]))
        else if (schema.additionalProperties !== undefined) checks.push(check(schema.additionalProperties, value[key]))
      }
    }
    if (Array.isArray(value)) {
      checks.push(
        value.length >= bound(schema.minItems, 0) && value.length <= bound(schema.maxItems, Number.POSITIVE_INFINITY),
      )
      if (schema.uniqueItems)
        checks.push(value.every((item, index) => !value.slice(0, index).some((other) => isObjectEqual(item, other))))
      const prefixes = dialect === 'modern' && Array.isArray(schema.prefixItems) ? schema.prefixItems : []
      for (let index = 0; index < value.length; index++) {
        checks.push(check(prefixes[index] ?? schema.items ?? true, value[index]))
      }
      if ('contains' in schema) {
        const results = value.map((item) => check(schema.contains, item))
        const count = results.filter((result) => result === true).length
        checks.push(
          results.includes(undefined)
            ? undefined
            : count >= (dialect === 'modern' ? bound(schema.minContains, 1) : 1) &&
                count <=
                  (dialect === 'modern'
                    ? bound(schema.maxContains, Number.POSITIVE_INFINITY)
                    : Number.POSITIVE_INFINITY),
        )
      }
    }
    return checks.includes(false) ? false : checks.includes(undefined) ? undefined : true
  } finally {
    seen.delete(schema)
  }
}

type ArrayLayer = { schema: Record<string, unknown>; path: string[] }

/** Visit same-instance array applicators without following item schemas or entering cycles. */
const arrayLayers = (
  schema: unknown,
  select: (schema: Record<string, unknown>, path: string[]) => unknown,
  path: string[] = [],
  seen = new Set<object>(),
): ArrayLayer[] => {
  if (!isObject(schema) || seen.has(schema) || seen.size >= MAX_SCHEMA_VISITS) return []
  seen.add(schema)
  const layers = [{ schema, path }]
  if ('$ref-value' in schema) layers.push(...arrayLayers(schema['$ref-value'], select, path, seen))
  if (Array.isArray(schema.allOf)) {
    for (const [index, child] of schema.allOf.slice(0, MAX_SCHEMA_VISITS).entries()) {
      layers.push(...arrayLayers(child, select, [...path, 'allOf', String(index)], seen))
    }
  }
  const selected = select(schema, path)
  if (selected !== undefined) layers.push(...arrayLayers(selected, select, path, seen))
  return layers
}

/** Detect containment before normal array union selection can overwrite surrounding assertions. */
export const hasArrayContains = (schema: unknown, seen = new Set<object>()): boolean => {
  if (!isObject(schema) || seen.has(schema) || seen.size >= MAX_SCHEMA_VISITS) return false
  seen.add(schema)
  if ('contains' in schema) return true
  if ('$ref-value' in schema && hasArrayContains(schema['$ref-value'], seen)) return true
  return ['allOf', 'anyOf', 'oneOf'].some((keyword) => {
    const members = schema[keyword]
    return (
      Array.isArray(members) && members.slice(0, MAX_SCHEMA_VISITS).some((member) => hasArrayContains(member, seen))
    )
  })
}

/**
 * Search at most 128 candidates, 64 schema nodes, 50,000 matching steps and 4,096 search steps.
 * Contradictions, unsupported assertions and exhausted budgets return the longest visited prefix
 * that obeys item schemas, maximum match counts, uniqueness and the 1,000-node output cap. This
 * partial example can miss minima; it is not a claim that arbitrary schemas are satisfiable.
 */
export const generateContainsArray = (
  schema: Record<string, unknown>,
  dialect: ArrayDialect,
  generate: (schema: unknown, path: string[]) => unknown,
  select: (schema: Record<string, unknown>, path: string[]) => unknown,
): { values: unknown[]; itemSchemas: unknown[] } => {
  const layers = arrayLayers(schema, select)
  const rules = layers
    .filter((layer) => 'contains' in layer.schema)
    .map(({ schema: source }) => ({
      schema: source.contains,
      min: dialect === 'modern' ? bound(source.minContains, 1) : 1,
      max: dialect === 'modern' ? bound(source.maxContains, Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY,
    }))
  const maximum = Math.min(MAX_NODES - 1, ...layers.map(({ schema: source }) => bound(source.maxItems, MAX_NODES)))
  if (maximum === 0) return { values: [], itemSchemas: [] }
  const prefixLength = Math.min(
    MAX_NODES - 1,
    Math.max(
      0,
      ...layers.map(({ schema: source }) =>
        dialect === 'modern' && Array.isArray(source.prefixItems) ? source.prefixItems.length : 0,
      ),
    ),
  )
  const length = Math.min(
    maximum,
    Math.max(
      prefixLength,
      ...layers.map(({ schema: source }) => bound(source.minItems, 0)),
      ...rules.map((rule) => rule.min),
    ),
  )
  const unique = layers.some((layer) => layer.schema.uniqueItems === true)
  const budget = { steps: MAX_MATCH_STEPS }
  const candidates: unknown[] = []
  const add = (value: unknown): void => {
    if (
      value !== undefined &&
      candidates.length < MAX_CANDIDATES &&
      sizeOf(value) < MAX_NODES &&
      !candidates.some((other) => isObjectEqual(value, other))
    )
      candidates.push(value)
  }
  let visits = MAX_SCHEMA_VISITS
  const harvest = (source: unknown, path: string[], seen = new Set<object>()): void => {
    if (!isObject(source) || seen.has(source) || --visits < 0) return
    seen.add(source)
    add(generate(source, path))
    if ('const' in source) add(source.const)
    if (Array.isArray(source.enum)) source.enum.slice(0, MAX_CANDIDATES).forEach(add)
    for (const key of ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum'] as const) {
      const value = source[key]
      if (typeof value === 'number' && Number.isFinite(value)) {
        for (let offset = 0; offset <= Math.min(length + 1, MAX_CANDIDATES / 2); offset++) {
          add(value + offset)
          add(value - offset)
        }
      }
    }
    if ('$ref' in source) harvest(source['$ref-value'], path, seen)
    for (const key of ['allOf', 'oneOf', 'anyOf'] as const) {
      const members = source[key]
      if (Array.isArray(members))
        members
          .slice(0, MAX_SCHEMA_VISITS)
          .forEach((member, index) => harvest(member, [...path, key, String(index)], seen))
    }
    seen.delete(source)
  }
  for (const { schema: source, path } of layers) {
    harvest(source.items, [...path, 'items'])
    harvest(source.contains, [...path, 'contains'])
    if (dialect === 'modern' && Array.isArray(source.prefixItems)) {
      source.prefixItems
        .slice(0, MAX_SCHEMA_VISITS)
        .forEach((prefix, index) => harvest(prefix, [...path, 'prefixItems', String(index)]))
    }
    const item = generate(source.items, [...path, 'items'])
    const contains = generate(source.contains, [...path, 'contains'])
    if (isObject(item) && isObject(contains)) add({ ...item, ...contains })
  }
  for (const value of [null, 1, 2, 3, 0, -1, true, false, '', 'string', 'a', [], {}]) add(value)
  for (let index = 4; index < MAX_SCHEMA_DEPTH; index++) {
    add(index)
    add(`string${index}`)
  }
  type Candidate = { value: unknown; matches: boolean[]; size: number }
  const slots = new Map<number, { schema: unknown; candidates: Candidate[] }>()
  const getSlot = (index: number): { schema: unknown; candidates: Candidate[] } => {
    const key = index < prefixLength ? index : -1
    const cached = slots.get(key)
    if (cached) return cached
    const sources = layers.map(
      ({ schema: source }) =>
        (dialect === 'modern' && Array.isArray(source.prefixItems) ? source.prefixItems[index] : undefined) ??
        source.items ??
        true,
    )
    const itemSchema = sources.length === 1 ? sources[0] : { allOf: sources }
    const local: unknown[] = []
    let omitted = false
    let authored = false
    for (const [layerIndex, source] of sources.entries()) {
      const sample = generate(source, [
        ...layers[layerIndex]!.path,
        ...(index < prefixLength ? ['prefixItems', String(index)] : ['items']),
      ])
      if (sample === undefined) omitted = true
      if (
        isObject(source) &&
        (source.example !== undefined || (Array.isArray(source.examples) && source.examples.length > 0))
      )
        authored = true
      if (sample !== undefined && sizeOf(sample) < MAX_NODES && (index < prefixLength || authored)) local.push(sample)
    }
    if (!authored) local.push(...candidates)
    const valid = omitted
      ? []
      : local.flatMap((value) => {
          if (matches(itemSchema, value, dialect, budget) !== true) return []
          const results = rules.map((rule) => matches(rule.schema, value, dialect, budget))
          return results.some((result) => result === undefined)
            ? []
            : [{ value, matches: results as boolean[], size: sizeOf(value) }]
        })
    const slot = { schema: itemSchema, candidates: valid }
    slots.set(key, slot)
    return slot
  }
  const values: unknown[] = []
  let best: unknown[] = []
  const finish = (result: unknown[]): { values: unknown[]; itemSchemas: unknown[] } => ({
    values: result,
    itemSchemas: result.map((_, index) => getSlot(index).schema),
  })
  // Iterative DFS keeps large minItems from exhausting the JavaScript stack.
  const stack: { next: number; counts: number[]; size: number; candidates: Candidate[] }[] = []
  let counts = rules.map(() => 0)
  let size = 1
  let steps = MAX_SEARCH_STEPS
  while (--steps >= 0 && budget.steps >= 0) {
    const index = values.length
    if (values.length > best.length) best = values.slice()
    const needsMatch = rules.some((rule, ruleIndex) => counts[ruleIndex]! < rule.min)
    if (index >= length && !needsMatch && matches(schema, values, dialect, budget) === true) return finish(values)
    if (!stack[index]) {
      const choices = index < maximum ? getSlot(index).candidates : []
      const score = (candidate: Candidate): number =>
        candidate.matches.filter((match, ruleIndex) => match && counts[ruleIndex]! < rules[ruleIndex]!.min).length
      stack[index] = { next: 0, counts, size, candidates: [...choices].sort((a, b) => score(b) - score(a)) }
    }
    const frame = stack[index]!
    const candidate = frame.candidates[frame.next++]
    if (
      candidate &&
      (index < length ||
        candidate.matches.some((match, ruleIndex) => match && counts[ruleIndex]! < rules[ruleIndex]!.min)) &&
      rules.every((rule, ruleIndex) => counts[ruleIndex]! + Number(candidate.matches[ruleIndex]) <= rule.max) &&
      size + candidate.size <= MAX_NODES &&
      (!unique || !values.some((value) => isObjectEqual(value, candidate.value)))
    ) {
      values.push(candidate.value)
      counts = counts.map((count, ruleIndex) => count + Number(candidate.matches[ruleIndex]))
      size += candidate.size
    } else if (!candidate) {
      stack.pop()
      if (index === 0) break
      values.pop()
      counts = stack[index - 1]!.counts
      size = stack[index - 1]!.size
    }
  }
  return finish(best)
}

/** Keep XML metadata on the item branch that actually accepts the chosen value. */
export const getContainsItemSchema = (source: unknown, value: unknown, dialect: ArrayDialect, depth = 0): unknown => {
  if (!isObject(source) || depth >= MAX_SCHEMA_DEPTH) return {}
  if (Array.isArray(source.allOf))
    source = {
      ...source,
      allOf: source.allOf
        .slice(0, MAX_SCHEMA_VISITS)
        .map((member) => getContainsItemSchema(member, value, dialect, depth + 1)),
    }
  if (!isObject(source)) return {}
  const keyword = Array.isArray(source.oneOf) ? 'oneOf' : Array.isArray(source.anyOf) ? 'anyOf' : undefined
  if (!keyword) return source
  const members = source[keyword] as unknown[]
  const budget = { steps: MAX_NODES }
  const selected = members.slice(0, MAX_CANDIDATES).find((member) => matches(member, value, dialect, budget) === true)
  if (selected === undefined) return source
  const { oneOf: _oneOf, anyOf: _anyOf, ...base } = source
  return { ...base, allOf: [...(Array.isArray(base.allOf) ? base.allOf : []), selected] }
}
