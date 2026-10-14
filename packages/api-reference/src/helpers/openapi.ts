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
 * Limits apply across all roots of one entry: 64 schema edges deep, 10,000 visits,
 * and 100,000 characters (at most 2,048 per string). These bounds keep recursive,
 * very wide, and unusually verbose schemas from monopolizing search construction.
 * Traversal order follows the document; fields beyond these limits are omitted.
 * Identity tracking is local to each extraction so shared schemas remain searchable
 * on every owning operation. A shallower revisit is allowed to avoid losing fields
 * when a shared schema first appears near the depth limit.
 */
const extractSchemaSearchText = (
  schemas: Iterable<SchemaReferenceType<SchemaObject> | undefined>,
  includeRefSiblings = false,
): SchemaSearchText => {
  const names = new Set<string>()
  const descriptions = new Set<string>()
  const visited = new Map<SchemaObject, number>()
  let visits = 0
  let characters = 0

  const exhausted = (): boolean => visits >= 10_000 || characters >= 100_000
  const add = (target: Set<string>, value: string | undefined): void => {
    if (typeof value !== 'string' || !value || exhausted()) {
      return
    }
    const text = value.slice(0, Math.min(2_048, 100_000 - characters))
    if (!target.has(text)) {
      target.add(text)
      characters += text.length
    }
  }

  const visit = (schema: unknown, depth: number, property = false): void => {
    if (exhausted()) {
      return
    }
    visits++
    if (depth > 64 || !isSchemaObject(schema)) {
      return
    }
    if (property && (includeRefSiblings || !('$ref' in schema))) {
      add(descriptions, schema.description)
    }
    const previousDepth = visited.get(schema)
    if (previousDepth !== undefined && previousDepth <= depth) {
      return
    }
    visited.set(schema, depth)

    // Follow store-resolved links one hop at a time so reference chains share the budget.
    // Unresolved references contribute their property name but do not trigger I/O.
    if ('$ref' in schema) {
      if ('$ref-value' in schema) {
        visit(schema['$ref-value'], depth + 1, property)
      }
      // OpenAPI 3.0 references ignore siblings; 3.1+ schema keywords apply alongside $ref.
      if (!includeRefSiblings) {
        return
      }
    }
    for (const variants of [schema.oneOf, schema.anyOf, schema.allOf]) {
      for (const variant of variants ?? []) {
        if (exhausted()) {
          return
        }
        visit(variant, depth + 1)
      }
    }
    if ('properties' in schema && schema.properties) {
      for (const key in schema.properties) {
        if (exhausted()) {
          return
        }
        if (Object.hasOwn(schema.properties, key)) {
          add(names, key)
          visit(schema.properties[key], depth + 1, true)
        }
      }
    }
    if ('items' in schema && schema.items) {
      visit(schema.items, depth + 1)
    }
  }

  for (const schema of schemas) {
    if (exhausted()) {
      break
    }
    visit(schema, 0)
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

/** Collects request and response fields together under a single operation budget. */
const extractOperationSchemaSearchText = (operation: OperationObject, includeRefSiblings: boolean): SchemaSearchText =>
  extractSchemaSearchText(bodySchemas(operation, true), includeRefSiblings)

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

  const schema = (value: SchemaReferenceType<SchemaObject> | undefined): SchemaSearchFields => {
    // Callers outside the workspace store can pass schemas that have not been normalized.
    if (!isSchemaObject(value)) {
      return { names: [], descriptions: [] }
    }
    const cached = schemas.get(value)
    if (cached) {
      return cached
    }
    const fields = extractSchemaSearchText([value], includeRefSiblings)
    schemas.set(value, fields)
    return fields
  }

  return {
    schema,
    operation: (operation) => {
      const cached = operations.get(operation)
      if (cached) {
        return cached
      }
      const fields = extractOperationSchemaSearchText(operation, includeRefSiblings)
      operations.set(operation, fields)
      return fields
    },
    body: (operation) => {
      const requestBody = getResolvedRef(operation.requestBody)
      const cached = requestBody && bodies.get(requestBody)
      if (cached) {
        return cached
      }
      const fields = extractSchemaSearchText(bodySchemas(operation, false), includeRefSiblings)
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
