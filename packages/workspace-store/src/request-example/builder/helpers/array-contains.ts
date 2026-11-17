import { isObject } from '@scalar/helpers/object/is-object'

/** Dialects whose direct array assertions this generator understands. */
type ArrayDialect = 'modern' | 'draft7' | 'unsupported'
type Primitive = string | number | boolean | null

/** Unknown dialects and pre-3.1 OpenAPI must not acquire modern contains semantics. */
export const getArrayDialect = (dialect?: string, openapiVersion?: string): ArrayDialect => {
  if (openapiVersion && !/^3\.[1-9](?:\.|$)/.test(openapiVersion)) {
    return 'unsupported'
  }
  if (!dialect || /^https:\/\/spec\.openapis\.org\/oas\/3\.[12]\/dialect\/base#?$/.test(dialect)) {
    return 'modern'
  }
  const uri = dialect.replace(/#$/, '')
  if (uri === 'https://json-schema.org/draft/2020-12/schema') {
    return 'modern'
  }
  return uri === 'http://json-schema.org/draft-07/schema' ? 'draft7' : 'unsupported'
}

const MAX_ITEMS = 999
const MAX_CANDIDATES = 128
const isPrimitive = (value: unknown): value is Primitive =>
  value === null ||
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value))

const keywords = new Set([
  '__scalar_',
  '$status',
  '$global',
  'type',
  'const',
  'enum',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'minLength',
  'maxLength',
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
])

/** Complex assertions are left to the existing best-effort generator, never treated as nonmatches. */
const isSimple = (schema: unknown): schema is boolean | Record<string, unknown> => {
  if (typeof schema === 'boolean') {
    return true
  }
  if (!isObject(schema) || Object.keys(schema).some((key) => !keywords.has(key) && !key.startsWith('x-'))) {
    return false
  }
  if (
    schema.type !== undefined &&
    (typeof schema.type !== 'string' || !['string', 'number', 'integer', 'boolean', 'null'].includes(schema.type))
  ) {
    return false
  }
  if ('const' in schema && !isPrimitive(schema.const)) {
    return false
  }
  return (
    !('enum' in schema) ||
    (Array.isArray(schema.enum) && schema.enum.length <= MAX_CANDIDATES && schema.enum.every(isPrimitive))
  )
}

const bound = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : fallback

const matches = (schema: boolean | Record<string, unknown>, value: Primitive): boolean => {
  if (typeof schema === 'boolean') {
    return schema
  }
  if ('const' in schema && value !== schema.const) {
    return false
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    return false
  }
  if (schema.type !== undefined) {
    const type = value === null ? 'null' : typeof value
    if (schema.type === 'integer' ? typeof value !== 'number' || !Number.isInteger(value) : schema.type !== type) {
      return false
    }
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      return false
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      return false
    }
    if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum) {
      return false
    }
    if (typeof schema.exclusiveMaximum === 'number' && value >= schema.exclusiveMaximum) {
      return false
    }
  }
  if (typeof value === 'string') {
    const length = Array.from(value).length
    if (length < bound(schema.minLength, 0) || length > bound(schema.maxLength, Number.POSITIVE_INFINITY)) {
      return false
    }
  }
  return true
}

/**
 * Fill direct primitive arrays with a single contains rule. Tuple values count toward the same
 * limits as tail values. Candidates are bounded and selected linearly; no composition traversal,
 * nested value synthesis, or XML branch selection is attempted. Unsupported schemas return undefined
 * for the existing generator. Contradictions or exhausted candidates return a partial example.
 * TODO: Handle independent contains rules across references and compositions in a follow-up.
 */
export const generateContainsArray = (
  schema: Record<string, unknown>,
  prefixes: unknown[],
  generate: (schema: unknown) => unknown,
  dialect: ArrayDialect,
): Primitive[] | undefined => {
  if (dialect === 'unsupported' || !('contains' in schema) || !isSimple(schema.contains)) {
    return undefined
  }
  if (schema.allOf || schema.anyOf || schema.oneOf || schema.$ref) {
    return undefined
  }
  const contains = schema.contains
  const items = schema.items ?? true
  const tuple = dialect === 'modern' && Array.isArray(schema.prefixItems) ? schema.prefixItems : []
  if (!isSimple(items) || !tuple.every(isSimple) || (dialect === 'draft7' && schema.prefixItems)) {
    return undefined
  }
  const minimum = dialect === 'modern' ? bound(schema.minContains, 1) : 1
  const maximum = dialect === 'modern' ? bound(schema.maxContains, Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY
  const maxItems = Math.min(bound(schema.maxItems, MAX_ITEMS), MAX_ITEMS)
  const length = Math.min(maxItems, Math.max(bound(schema.minItems, 0), minimum, prefixes.length))
  const values: Primitive[] = []
  const candidates: Primitive[] = []
  const add = (value: unknown): void => {
    if (isPrimitive(value) && candidates.length < MAX_CANDIDATES && !candidates.includes(value)) {
      candidates.push(value)
    }
  }
  // Authored item examples remain fixed even when they cannot satisfy the array constraints.
  const unrestricted =
    items === true ||
    (isObject(items) && !['type', 'const', 'enum', 'example', 'examples', 'default'].some((key) => key in items))
  const sampleSchema = unrestricted ? contains : items
  const generatedSample = typeof sampleSchema === 'boolean' ? null : generate(sampleSchema)
  const sample = unrestricted ? (generatedSample ?? null) : generatedSample
  const authored =
    isObject(items) && (items.example !== undefined || (Array.isArray(items.examples) && items.examples.length > 0))
  add(sample)
  if (!authored) {
    for (const source of [contains, items]) {
      if (!isObject(source)) {
        continue
      }
      if ('const' in source) {
        add(source.const)
      }
      if (Array.isArray(source.enum)) {
        source.enum.forEach(add)
      }
      add(generate(source))
      for (const key of ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum'] as const) {
        const limit = source[key]
        if (typeof limit === 'number') {
          for (const offset of [0, 1, -1]) {
            add(limit + offset)
          }
        }
      }
    }
    for (const value of [null, 1, 2, 3, 0, -1, true, false, '', 'string', 'a']) {
      add(value)
    }
    for (let index = 4; index < 32; index++) {
      add(index)
      add(`string${index}`)
    }
  }
  const available = authored ? candidates : candidates.filter((value) => matches(items, value))
  let count = 0
  const append = (value: Primitive): boolean => {
    const match = matches(contains, value)
    if ((!authored && match && count >= maximum) || (schema.uniqueItems === true && values.includes(value))) {
      return false
    }
    values.push(value)
    count += Number(match)
    return true
  }
  for (const [index, value] of prefixes.slice(0, maxItems).entries()) {
    if (!isPrimitive(value) || !matches(tuple[index] ?? true, value) || !append(value)) {
      return values
    }
  }
  if (items === false || (sample === undefined && typeof items !== 'boolean')) {
    return values
  }
  while (values.length < maxItems && (values.length < length || (!authored && count < minimum))) {
    const candidate = available.find(
      (value) =>
        (authored || count >= minimum || matches(contains, value)) &&
        (authored || !matches(contains, value) || count < maximum) &&
        (schema.uniqueItems !== true || !values.includes(value)),
    )
    if (candidate === undefined || !append(candidate)) {
      break
    }
  }
  return values
}
