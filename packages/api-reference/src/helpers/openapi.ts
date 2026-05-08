import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  MediaTypeObject,
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  ReferenceType,
  SchemaObject,
  SchemaReferenceType,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

const isSchemaObject = (value: unknown): value is SchemaObject => typeof value === 'object' && value !== null

/**
 * Resolves a schema reference from workspace-store to a SchemaObject.
 * Returns undefined when a reference exists but has not been resolved yet.
 */
function resolveSchemaRef(ref: SchemaReferenceType<SchemaObject>): SchemaObject | undefined {
  if (typeof ref === 'object' && ref !== null && '$ref' in ref) {
    return isSchemaObject(ref['$ref-value']) ? ref['$ref-value'] : undefined
  }

  return ref
}

function pushUnique(target: string[], value: string | undefined): void {
  if (!value) {
    return
  }
  if (!target.includes(value)) {
    target.push(value)
  }
}

type CollectOptions = {
  visit: (key: string, schema: SchemaObject | undefined) => void
  visited: Set<SchemaObject>
  maxPropertyDepth: number
}

/**
 * Recursively visits every property of a schema, descending transparently through composition
 * keywords (`oneOf`, `anyOf`, `allOf`) and one level into nested object properties.
 *
 * Composition is treated as transparent — a `oneOf` of two object variants is *the same level* as a
 * single object, just expressed as multiple shapes. Property nesting is capped to keep the index
 * focused on shallow, commonly-searched fields. A visited-set keyed by resolved-schema identity
 * guards against recursive (`Tree → Tree`) schemas.
 */
function collectSchemaProperties(schema: SchemaObject | undefined, options: CollectOptions, propertyDepth = 0): void {
  if (!schema || options.visited.has(schema)) {
    return
  }
  options.visited.add(schema)

  const variants = [...(schema.oneOf ?? []), ...(schema.anyOf ?? []), ...(schema.allOf ?? [])]
  variants.forEach((variantRef) => {
    collectSchemaProperties(resolveSchemaRef(variantRef), options, propertyDepth)
  })

  if (isObjectSchema(schema) && schema.properties) {
    Object.entries(schema.properties).forEach(([key, propRef]) => {
      const property = resolveSchemaRef(propRef)
      options.visit(key, property)
      if (propertyDepth + 1 < options.maxPropertyDepth) {
        collectSchemaProperties(property, options, propertyDepth + 1)
      }
    })
  }
}

/**
 * Walks the request body schemas of an operation and yields each property schema with its key.
 */
function forEachRequestBodyProperty(
  operation: OperationObject,
  visit: (key: string, schema: SchemaObject | undefined) => void,
): void {
  const content = getResolvedRef(operation?.requestBody)?.content
  if (!content) {
    return
  }

  const visited = new Set<SchemaObject>()
  Object.values(content).forEach((media) => {
    const resolvedMedia = getResolvedRef(media) as MediaTypeObject | undefined
    const schema = getResolvedRef(resolvedMedia?.schema)
    collectSchemaProperties(schema, { visit, visited, maxPropertyDepth: 2 })
  })
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

/**
 * Extracts the names of properties from the request body schema(s) of an operation.
 *
 * Walks every media type and includes both top-level and one level of nested property names so
 * common fields like `email` or `username` surface in search regardless of how the body is shaped.
 */
export function extractBodyFieldNames(operation: OperationObject): string[] {
  const names: string[] = []

  forEachRequestBodyProperty(operation, (key) => {
    pushUnique(names, key)
  })

  return names
}

/**
 * Extracts the descriptions of properties from the request body schema(s) of an operation.
 */
export function extractBodyDescriptions(operation: OperationObject): string[] {
  const descriptions: string[] = []

  forEachRequestBodyProperty(operation, (_key, schema) => {
    if (schema && 'description' in schema && typeof schema.description === 'string') {
      pushUnique(descriptions, schema.description)
    }
  })

  return descriptions
}

/**
 * Extracts the property names of a schema for the search index.
 *
 * Same depth and composition behavior as `extractBodyFieldNames` — descends transparently through
 * `oneOf`/`anyOf`/`allOf`, walks one level into nested object properties, dedupes.
 */
export function extractSchemaFieldNames(schema: SchemaObject | undefined): string[] {
  const names: string[] = []
  collectSchemaProperties(schema, {
    visit: (key) => pushUnique(names, key),
    visited: new Set<SchemaObject>(),
    maxPropertyDepth: 2,
  })
  return names
}

/**
 * Extracts the property descriptions of a schema for the search index.
 */
export function extractSchemaDescriptions(schema: SchemaObject | undefined): string[] {
  const descriptions: string[] = []
  collectSchemaProperties(schema, {
    visit: (_key, propertySchema) => {
      if (propertySchema && 'description' in propertySchema && typeof propertySchema.description === 'string') {
        pushUnique(descriptions, propertySchema.description)
      }
    },
    visited: new Set<SchemaObject>(),
    maxPropertyDepth: 2,
  })
  return descriptions
}

/**
 * Deep merge for objects
 */
export function deepMerge(source: Record<any, any>, target: Record<any, any>) {
  for (const [key, val] of Object.entries(source)) {
    if (val !== null && typeof val === 'object') {
      target[key] ??= new val.__proto__.constructor()
      deepMerge(val, target[key])
    } else if (typeof val !== 'undefined') {
      target[key] = val
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
    return emptySpecification as OpenApiDocument
  }

  deepMerge(partialSpecification, emptySpecification)

  return emptySpecification as OpenApiDocument
}
