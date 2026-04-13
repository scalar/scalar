import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { MediaTypeObject } from '@scalar/workspace-store/schemas/v3.1/strict/media-type'
import type {
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  ReferenceType,
  SchemaObject,
  SchemaReferenceType,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

/** Object schema shape with properties, used when logging request body. */
type ObjectSchemaWithProperties = {
  properties: Record<string, SchemaReferenceType<SchemaObject>>
  required?: string[]
}

const isSchemaObject = (value: unknown): value is SchemaObject => typeof value === 'object' && value !== null

const schemaTypeToString = (schema: SchemaObject): string => {
  if (!('type' in schema)) {
    return ''
  }

  if (typeof schema.type === 'string') {
    return schema.type
  }

  return Array.isArray(schema.type) ? schema.type.join('|') : ''
}

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

/**
 * Formats a property object into a string.
 */
function formatProperty(key: string, obj: ObjectSchemaWithProperties): string {
  let output = key
  const isRequired = obj.required?.includes(key)
  output += isRequired ? ' REQUIRED ' : ' optional '
  const propRef = obj.properties[key]
  if (!propRef) {
    return output
  }
  const property = resolveSchemaRef(propRef)

  if (property) {
    output += schemaTypeToString(property)

    if ('description' in property && typeof property.description === 'string') {
      output += ` ${property.description}`
    }
  }

  return output
}

/**
 * Recursively logs the properties of an object.
 */
function recursiveLogger(obj: MediaTypeObject): string[] {
  const results: string[] = ['Body']
  const schema = getResolvedRef(obj?.schema)

  if (!schema || !isObjectSchema(schema) || !schema.properties) {
    return results
  }

  const properties = schema.properties
  const schemaWithProps: ObjectSchemaWithProperties = {
    properties,
    required: schema.required,
  }
  Object.keys(properties).forEach((key) => {
    if (!obj.schema) {
      return
    }

    results.push(formatProperty(key, schemaWithProps))

    const propRef = properties[key]
    if (!propRef) {
      return
    }
    const property = resolveSchemaRef(propRef)
    if (property && isObjectSchema(property) && property.properties) {
      const nestedProperties = property.properties
      Object.keys(nestedProperties).forEach((subKey) => {
        const ref = nestedProperties[subKey]
        if (!ref) {
          return
        }
        const nested = resolveSchemaRef(ref)
        const typeStr = nested ? schemaTypeToString(nested) : ''
        results.push(`${subKey} ${typeStr}`)
      })
    }
  })

  return results
}

/**
 * Extracts the request body from an operation.
 */
export function extractRequestBody(operation: OperationObject): string[] | null {
  const content = getResolvedRef(operation?.requestBody)?.content
  const contentValue = Object.values(content ?? {})
  if (contentValue.length === 0) {
    // No content found
    return null
  }

  return contentValue.flatMap((media) => recursiveLogger(media))
}

/**
 * Formats a parameter into a searchable string.
 */
function formatParameter(param: ParameterObject): string {
  const output = [param.name]
  output.push(param.required ? 'REQUIRED' : 'optional')
  output.push(param.in)

  if ('schema' in param && param.schema) {
    const schema = getResolvedRef(param.schema)
    if (schema) {
      output.push(schemaTypeToString(schema))
    }
  }

  if (param.description) {
    output.push(param.description)
  }

  return output.join(' ')
}

/**
 * Extracts parameters from an operation into searchable strings.
 */
export function extractParameters(parameters: ReferenceType<ParameterObject>[]): string[] | null {
  return parameters.map((parameter) => formatParameter(getResolvedRef(parameter)))
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
