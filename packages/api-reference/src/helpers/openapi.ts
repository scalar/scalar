import { type NodeInput, getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { MediaTypeObject } from '@scalar/workspace-store/schemas/v3.1/strict/media-type'
import type {
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  SchemaObject,
  SchemaReferenceType,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

/** Object schema shape with properties, used when logging request body. */
type ObjectSchemaWithProperties = {
  properties: Record<string, SchemaReferenceType<SchemaObject>>
  required?: string[]
}

/**
 * Resolves a schema reference from workspace-store to a SchemaObject.
 * Bridges SchemaReferenceType (which uses '$ref-value': unknown) to NodeInput (which uses '$ref-value': SchemaObject).
 */
function resolveSchemaRef(ref: SchemaReferenceType<SchemaObject>): SchemaObject {
  return getResolvedRef(ref as NodeInput<SchemaObject>)
}

/**
 * Formats a property object into a string.
 */
function formatProperty(key: string, obj: ObjectSchemaWithProperties): string {
  let output = key
  const isRequired = obj.required?.includes(key)
  output += isRequired ? ' REQUIRED ' : ' optional '
  const propRef = obj.properties[key]
  if (!propRef) return output
  const property = resolveSchemaRef(propRef)

  // Check existence before accessing
  if (property && typeof property === 'object' && 'type' in property) {
    output += (property as { type?: string }).type ?? ''
    if ('description' in property && typeof (property as { description?: string }).description === 'string') {
      output += ' ' + (property as { description: string }).description
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
    if (!propRef) return
    const property = resolveSchemaRef(propRef)
    if (property && isObjectSchema(property) && property.properties) {
      const nestedProperties = property.properties
      Object.keys(nestedProperties).forEach((subKey) => {
        const ref = nestedProperties[subKey]
        if (!ref) return
        const nested = resolveSchemaRef(ref)
        const typeStr =
          nested && typeof nested === 'object' && 'type' in nested ? ((nested as { type?: string }).type ?? '') : ''
        results.push(`${subKey} ${typeStr}`)
      })
    }
  })

  return results
}

/**
 * Extracts the request body from an operation.
 */
export function extractRequestBody(operation: OperationObject): string[] | boolean {
  try {
    // TODO: Wait… there's more than just 'application/json' (https://github.com/scalar/scalar/issues/6427)
    const media = getResolvedRef(operation?.requestBody)?.content?.['application/json']
    if (!media) {
      throw new Error('Body not found')
    }

    return recursiveLogger(media)
  } catch (_error) {
    return false
  }
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
 * Type guard to check whether a node is a dereferenced OpenAPI reference.
 */
const isDereferenced = <T>(obj: T | { $ref: string }): obj is T =>
  typeof obj === 'object' && obj !== null && !('$ref' in obj && typeof obj.$ref === 'string')

/**
 * Creates an empty specification object.
 * The returning object has the same structure as a valid OpenAPI specification, but everything is empty.
 */
export function createEmptySpecification(partialSpecification?: Partial<OpenApiDocument>) {
  return deepMerge(partialSpecification ?? {}, {
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
  }) as OpenApiDocument
}

export type ParameterMap = {
  path: ParameterObject[]
  query: ParameterObject[]
  header: ParameterObject[]
  cookie: ParameterObject[]
  body: ParameterObject[]
  formData: ParameterObject[]
}

/**
 * This function creates a parameter map from an Operation Object, that's easier to consume.
 *
 * TODO: Isn't it easier to just stick to the OpenAPI structure, without transforming it?
 */
export function createParameterMap(operation: OperationObject) {
  const map: ParameterMap = {
    path: [],
    query: [],
    header: [],
    cookie: [],
    body: [],
    formData: [],
  }

  // TODO: They are not passed to the function, so we don't need to deal with them yet, but we should.
  // @see https://github.com/scalar/scalar/issues/6428
  // if (operation.pathParameters) {
  //   operation.pathParameters.forEach((parameter: OpenAPIV3_1.ParameterObject) => {
  //     if (parameter.in === 'path') {
  //       map.path.push(parameter)
  //     } else if (parameter.in === 'query') {
  //       map.query.push(parameter)
  //     } else if (parameter.in === 'header') {
  //       map.header.push(parameter)
  //     } else if (parameter.in === 'cookie') {
  //       map.cookie.push(parameter)
  //     } else if (parameter.in === 'body') {
  //       map.body.push(parameter)
  //     } else if (parameter.in === 'formData') {
  //       map.formData.push(parameter)
  //     }
  //   })
  // }

  const parameters = operation.parameters ?? []

  if (parameters) {
    parameters.forEach((parameter) => {
      if (!isDereferenced<ParameterObject>(parameter)) {
        return
      }

      if (typeof parameter === 'object' && parameter !== null && '$ref' in parameter) {
        return
      }

      if (parameter.in === 'path') {
        map.path.push(parameter)
      } else if (parameter.in === 'query') {
        map.query.push(parameter)
      } else if (parameter.in === 'header') {
        map.header.push(parameter)
      } else if (parameter.in === 'cookie') {
        map.cookie.push(parameter)
      } else if ((parameter as { in?: string }).in === 'body') {
        map.body.push(parameter)
      } else if ((parameter as { in?: string }).in === 'formData') {
        map.formData.push(parameter)
      }
    })
  }

  return map
}
