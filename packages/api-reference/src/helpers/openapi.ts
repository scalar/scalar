import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  ReferenceType,
  SchemaObject,
  SchemaReferenceType,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

const isSchemaObject = (value: unknown): value is SchemaObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Names and prose stay separate so exact field matches retain their higher search weight. */
type SchemaSearchText = { names: string[]; descriptions: string[] }

/**
 * Extracts only property names and descriptions, never examples or schema metadata.
 *
 * Limits apply across all roots of one entry: 6 schema edges deep, 10,000 visits,
 * and 100,000 characters (at most 2,048 per string). These bounds keep recursive,
 * very wide, and unusually verbose schemas from monopolizing search construction.
 * Fields beyond these limits are omitted, starting with the most deeply nested.
 * Identity tracking is local to each extraction so shared schemas remain searchable
 * on every owning operation.
 *
 * The depth limit counts reference hops, so it reaches about two references past a model. Going
 * further would make every operation in a connected API index nearly all of its fields, which
 * slows down every search keystroke.
 *
 * The walk is breadth-first so that a schema is always first reached by its shortest path,
 * which means it only ever needs expanding once. Depth-first order would reach a schema
 * by a long path first and expand it again for every shorter path, and every read here goes
 * through several proxies, so that gets very slow for models that reference each other.
 */
const extractSchemaSearchText = (
  schemas: Iterable<SchemaReferenceType<SchemaObject> | undefined>,
  includeRefSiblings = false,
): SchemaSearchText => {
  const names = new Set<string>()
  const descriptions = new Set<string>()
  const visited = new Set<SchemaObject>()
  const queue: { schema: unknown; depth: number; property: boolean }[] = []
  let visits = 0
  let characters = 0

  const exhausted = (): boolean => visits >= 10_000 || characters >= 100_000
  const add = (target: Set<string>, value: string | undefined): void => {
    if (typeof value !== 'string' || !value || characters >= 100_000) {
      return
    }
    const text = value.slice(0, Math.min(2_048, 100_000 - characters))
    if (!target.has(text)) {
      target.add(text)
      characters += text.length
    }
  }
  // Visits are charged here rather than when dequeued, so a very wide schema cannot add all of
  // its property names before the budget applies.
  const enqueue = (schema: unknown, depth: number, property = false): void => {
    if (!exhausted()) {
      visits++
      queue.push({ schema, depth, property })
    }
  }

  for (const schema of schemas) {
    if (exhausted()) {
      break
    }
    enqueue(schema, 0)
  }

  // Everything queued has been paid for, so the visit budget does not stop this loop.
  for (let head = 0; head < queue.length && characters < 100_000; head++) {
    const { schema, depth, property } = queue[head]!
    if (depth > 6 || !isSchemaObject(schema)) {
      continue
    }
    if (property && (includeRefSiblings || !('$ref' in schema))) {
      add(descriptions, schema.description)
    }
    if (visited.has(schema)) {
      continue
    }
    visited.add(schema)

    // Follow store-resolved links one hop at a time so reference chains share the budget.
    // Unresolved references contribute their property name but do not trigger I/O.
    if ('$ref' in schema) {
      if ('$ref-value' in schema) {
        enqueue(schema['$ref-value'], depth + 1, property)
      }
      // OpenAPI 3.0 references ignore siblings; 3.1+ schema keywords apply alongside $ref.
      if (!includeRefSiblings) {
        continue
      }
    }
    for (const variants of [schema.oneOf, schema.anyOf, schema.allOf]) {
      for (const variant of variants ?? []) {
        enqueue(variant, depth + 1)
      }
    }
    if ('properties' in schema && schema.properties) {
      for (const key in schema.properties) {
        if (exhausted()) {
          break
        }
        if (Object.hasOwn(schema.properties, key)) {
          add(names, key)
          enqueue(schema.properties[key], depth + 1, true)
        }
      }
    }
    if ('items' in schema && schema.items) {
      enqueue(schema.items, depth + 1)
    }
  }
  return { names: [...names], descriptions: [...descriptions] }
}

/**
 * Combines the fields of several schemas into one entry, keeping the entry within the same limits
 * as a single extraction: 100,000 characters, and at most 10,000 schemas.
 */
const mergeSchemaSearchText = (
  schemas: Iterable<SchemaReferenceType<SchemaObject> | undefined>,
  extract: (schema: SchemaReferenceType<SchemaObject> | undefined) => SchemaSearchText,
): SchemaSearchText => {
  const names = new Set<string>()
  const descriptions = new Set<string>()
  let visits = 0
  let characters = 0

  const add = (target: Set<string>, values: string[]): void => {
    for (const value of values) {
      if (characters >= 100_000) {
        return
      }
      const text = value.slice(0, 100_000 - characters)
      if (!target.has(text)) {
        target.add(text)
        characters += text.length
      }
    }
  }

  for (const schema of schemas) {
    if (visits >= 10_000 || characters >= 100_000) {
      break
    }
    visits++
    const fields = extract(schema)
    add(names, fields.names)
    add(descriptions, fields.descriptions)
  }
  return { names: [...names], descriptions: [...descriptions] }
}

/** Yields media schemas lazily so extraction can stop at its per-entry budget. */
function* bodySchemas(
  operation: OperationObject,
  includeResponses: boolean,
): Generator<SchemaReferenceType<SchemaObject> | undefined> {
  const content = getResolvedRef(operation.requestBody)?.content
  for (const key in content) {
    if (Object.hasOwn(content, key)) {
      yield getResolvedRef(content[key])?.schema
    }
  }
  if (includeResponses) {
    for (const code in operation.responses) {
      if (!Object.hasOwn(operation.responses, code)) {
        continue
      }
      const responseContent = getResolvedRef(operation.responses[code])?.content
      // Count empty responses against the traversal budget too.
      yield undefined
      for (const mediaType in responseContent) {
        if (Object.hasOwn(responseContent, mediaType)) {
          yield getResolvedRef(responseContent[mediaType])?.schema
        }
      }
    }
  }
}

const pushUnique = (target: string[], value: string | undefined): void => {
  if (value && !target.includes(value)) {
    target.push(value)
  }
}

/**
 * Extracts the names of every parameter on an operation.
 *
 * The returned strings contain only parameter names (e.g. `userId`, `limit`) so they can be indexed
 * as a high-signal field for search. Filter-style metadata like `REQUIRED`, `optional`, `query` and
 * the schema type are intentionally excluded — those tokens dilute fuzzy matches and produce false
 * positives for queries like `query` or `integer`.
 */
export function extractParameterNames(parameters: ReferenceType<ParameterObject>[]): string[] {
  const names: string[] = []

  parameters.forEach((parameter) => {
    const resolved = getResolvedRef(parameter)
    pushUnique(names, resolved?.name)
  })

  return names
}

/**
 * Extracts the descriptions of every parameter on an operation.
 *
 * Kept separate from parameter names so the search index can weight each independently.
 */
export function extractParameterDescriptions(parameters: ReferenceType<ParameterObject>[]): string[] {
  const descriptions: string[] = []

  parameters.forEach((parameter) => {
    const resolved = getResolvedRef(parameter)
    pushUnique(descriptions, resolved?.description)
  })

  return descriptions
}

/** Extracts request-body property names, including nested objects, arrays, and compositions. */
export const extractBodyFieldNames = (operation: OperationObject): string[] =>
  extractSchemaSearchText(bodySchemas(operation, false)).names

/** Extracts request-body property descriptions separately from field names. */
export const extractBodyDescriptions = (operation: OperationObject): string[] =>
  extractSchemaSearchText(bodySchemas(operation, false)).descriptions

/** Extracts schema property names using the shared bounded traversal. */
export const extractSchemaFieldNames = (schema: SchemaObject | undefined): string[] =>
  extractSchemaSearchText([schema]).names

/** Extracts schema property descriptions using the shared bounded traversal. */
export const extractSchemaDescriptions = (schema: SchemaObject | undefined): string[] =>
  extractSchemaSearchText([schema]).descriptions

/** Search fields collected together without changing their independent ordering. */
type SchemaSearchFields = {
  names: string[]
  descriptions: string[]
}

/**
 * Creates extraction caches for one synchronous index build. Discarding them after the build
 * ensures edits to existing schema objects are visible the next time search is indexed.
 *
 * Operations usually reference the same few schemas, and walking those is by far the most expensive
 * part of indexing, so each schema is walked once per build and its fields are shared.
 */
export const createSearchFieldExtractor = (
  includeRefSiblings = false,
): {
  schema: (schema: SchemaReferenceType<SchemaObject> | undefined) => SchemaSearchFields
  body: (operation: OperationObject) => SchemaSearchFields
  operation: (operation: OperationObject) => SchemaSearchFields
} => {
  const schemas = new WeakMap<SchemaObject, SchemaSearchFields>()
  const bodies = new WeakMap<object, SchemaSearchFields>()
  const operations = new WeakMap<OperationObject, SchemaSearchFields>()

  /**
   * Every usage has its own reference object, so a plain reference has to be cached by what it resolves
   * to. In OpenAPI 3.1+ a reference with sibling keywords adds to its target, so it keeps its own entry.
   */
  const getCacheKey = (value: SchemaObject): SchemaObject => {
    const target = '$ref-value' in value ? value['$ref-value'] : undefined
    if (!('$ref' in value) || !isSchemaObject(target)) {
      return value
    }
    const hasSiblings = includeRefSiblings && Object.keys(value).some((key) => key !== '$ref' && key !== '$ref-value')
    return hasSiblings ? value : target
  }

  const schema = (value: SchemaReferenceType<SchemaObject> | undefined): SchemaSearchFields => {
    // Callers outside the workspace store can pass schemas that have not been normalized.
    if (!isSchemaObject(value)) {
      return { names: [], descriptions: [] }
    }
    const key = getCacheKey(value)
    const cached = schemas.get(key)
    if (cached) {
      return cached
    }
    const fields = extractSchemaSearchText([key], includeRefSiblings)
    schemas.set(key, fields)
    return fields
  }

  return {
    schema,
    operation: (operation) => {
      const cached = operations.get(operation)
      if (cached) {
        return cached
      }
      const fields = mergeSchemaSearchText(bodySchemas(operation, true), schema)
      operations.set(operation, fields)
      return fields
    },
    body: (operation) => {
      const requestBody = getResolvedRef(operation.requestBody)
      const cached = requestBody && bodies.get(requestBody)
      if (cached) {
        return cached
      }
      const fields = mergeSchemaSearchText(bodySchemas(operation, false), schema)
      if (requestBody) {
        bodies.set(requestBody, fields)
      }
      return fields
    },
  }
}

/**
 * Assigns a value as an ordinary own, enumerable data property.
 *
 * `target.__proto__ = value` runs the prototype setter instead of creating a property, so a
 * document with a `__proto__` key could otherwise change the prototype of the merged object.
 * Defining the property explicitly keeps a key with that name as plain data.
 */
const defineOwnProperty = (target: Record<any, any>, key: string, value: unknown): void => {
  if (key === '__proto__') {
    Object.defineProperty(target, key, { value, writable: true, enumerable: true, configurable: true })
  } else {
    target[key] = value
  }
}

/**
 * Whether `target` already has its own mergeable object under `key`.
 *
 * Only an own object is a safe merge target. Reaching an inherited property — every object inherits
 * `constructor`, and `__proto__` resolves to an accessor on `Object.prototype` — would let a
 * document walk up to `Object.prototype` and add a property to every object on the page.
 */
const hasOwnObject = (target: Record<any, any>, key: string): boolean =>
  Object.hasOwn(target, key) && target[key] !== null && typeof target[key] === 'object'

/**
 * Deep merge for objects.
 *
 * OpenAPI documents are untrusted input and can carry keys like `__proto__`, `constructor`, or
 * `prototype` (a schema is free to describe a property named `constructor`). Those keys are merged
 * as ordinary own data, so nothing is silently dropped, but the merge never writes through the
 * prototype chain, which would otherwise pollute `Object.prototype` for every object on the page.
 */
export function deepMerge(source: Record<any, any>, target: Record<any, any>): Record<any, any> {
  for (const [key, val] of Object.entries(source)) {
    if (val !== null && typeof val === 'object') {
      if (!hasOwnObject(target, key)) {
        // Match the shape of the source value rather than reaching through its prototype, which
        // also keeps objects created with a `null` prototype from throwing.
        defineOwnProperty(target, key, Array.isArray(val) ? [] : {})
      }
      deepMerge(val, target[key])
    } else if (typeof val !== 'undefined') {
      defineOwnProperty(target, key, val)
    }
  }

  return target
}

/**
 * Creates an empty specification object.
 * The returning object has the same structure as a valid OpenAPI specification, but everything is empty.
 */
export function createEmptySpecification(partialSpecification?: Partial<OpenApiDocument>) {
  const emptySpecification = {
    openapi: '3.1.0',
    info: {
      title: '',
      description: '',
      termsOfService: '',
      version: '',
      license: {
        name: '',
        url: '',
      },
      contact: {
        email: '',
      },
    },
    servers: [],
    tags: [],
    'x-scalar-original-document-hash': '',
  }

  if (!partialSpecification) {
    return emptySpecification
  }

  deepMerge(partialSpecification, emptySpecification)

  return emptySpecification
}
