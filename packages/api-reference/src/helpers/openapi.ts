import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
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

/**
 * Walks the request body schemas of an operation and yields each property schema with its key.
 * Visits top-level properties plus one level of nested object properties — matching the depth that was
 * previously indexed for search.
 */
function forEachRequestBodyProperty(
  operation: OperationObject,
  visit: (key: string, schema: SchemaObject | undefined) => void,
): void {
  const content = getResolvedRef(operation?.requestBody)?.content
  if (!content) {
    return
  }

  Object.values(content).forEach((media) => {
    const resolvedMedia = getResolvedRef(media)
    const schema = getResolvedRef(resolvedMedia?.schema)

    if (!schema || !isObjectSchema(schema) || !schema.properties) {
      return
    }

    Object.entries(schema.properties).forEach(([key, propRef]) => {
      const property = resolveSchemaRef(propRef)
      visit(key, property)

      if (property && isObjectSchema(property) && property.properties) {
        Object.entries(property.properties).forEach(([nestedKey, nestedRef]) => {
          const nestedProperty = resolveSchemaRef(nestedRef)
          visit(nestedKey, nestedProperty)
        })
      }
    })
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
