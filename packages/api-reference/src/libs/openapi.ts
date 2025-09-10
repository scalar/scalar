import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import { isDereferenced } from '@scalar/openapi-types/helpers'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject, ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Formats a property object into a string.
 */
export function formatProperty(key: string, obj: OpenAPIV3_1.SchemaObject): string {
  let output = key
  const isRequired = obj.required?.includes(key)
  output += isRequired ? ' REQUIRED ' : ' optional '
  const property = getResolvedRef(obj.properties?.[key])

  // Check existence before accessing
  if (property) {
    output += property.type
    if (property.description) {
      output += ' ' + property.description
    }
  }

  return output
}

/**
 * Recursively logs the properties of an object.
 */
function recursiveLogger(obj: OpenAPIV3_1.MediaTypeObject): string[] {
  const results: string[] = ['Body']
  const schema = getResolvedRef(obj?.schema)

  const properties = schema?.properties
  if (properties) {
    Object.keys(properties).forEach((key) => {
      if (!obj.schema) {
        return
      }

      results.push(formatProperty(key, schema))

      const property = getResolvedRef(properties[key])
      const isNestedObject = property.type === 'object' && Boolean(property.properties)
      if (isNestedObject && property.properties) {
        Object.keys(property.properties).forEach((subKey) => {
          results.push(`${subKey} ${getResolvedRef(property.properties?.[subKey])?.type}`)
        })
      }
    })
  }

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
 * Creates an empty specification object.
 * The returning object has the same structure as a valid OpenAPI specification, but everything is empty.
 */
export function createEmptySpecification(partialSpecification?: Partial<OpenAPI.Document>) {
  return deepMerge(partialSpecification ?? {}, {
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
  }) as OpenAPI.Document
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
      } else if (parameter.in === 'body') {
        map.body.push(parameter)
      } else if (parameter.in === 'formData') {
        map.formData.push(parameter)
      }
    })
  }

  return map
}
