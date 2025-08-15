import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import { isDereferenced } from '@scalar/openapi-types/helpers'

import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/parameter'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/path-operations'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { MediaTypeObject } from '@scalar/workspace-store/schemas/v3.1/strict/media-header-encoding'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'

/**
 * Formats a property object into a string.
 */
export function formatProperty(key: string, obj: SchemaObject): string {
  let output = key
  const isRequired = obj.required?.includes(key)
  output += isRequired ? ' REQUIRED ' : ' optional '

  // Check existence before accessing
  if (obj.properties?.[key]) {
    output += obj.properties[key].type
    if (obj.properties[key].description) {
      output += ' ' + obj.properties[key].description
    }
  }

  return output
}

/**
 * Recursively logs the properties of an object.
 */
function recursiveLogger(obj: MediaTypeObject): string[] {
  const results: string[] = ['Body']

  const properties = obj?.schema?.properties
  if (properties) {
    Object.keys(properties).forEach((key) => {
      if (!obj.schema) {
        return
      }

      results.push(formatProperty(key, obj.schema))

      const property = properties[key]
      const isNestedObject = property.type === 'object' && !!property.properties
      if (isNestedObject && property.properties) {
        Object.keys(property.properties).forEach((subKey) => {
          results.push(`${subKey} ${property.properties?.[subKey]?.type}`)
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
 * Returns all models from the specification, no matter if it's OpenAPI 3.x.
 */
export function getModels(document?: OpenAPIV3_1.Document) {
  if (!document) {
    return {} as Record<string, OpenAPIV3_1.SchemaObject>
  }

  const models =
    // OpenAPI 3.x
    (
      Object.keys(document?.components?.schemas ?? {}).length
        ? document?.components?.schemas
        : // Fallback
          {}
    ) as Record<string, OpenAPIV3_1.SchemaObject>

  // Filter out all schemas with `x-internal: true`
  Object.keys(models ?? {}).forEach((key) => {
    if (models[key]?.['x-internal'] === true || models[key]?.['x-scalar-ignore'] === true) {
      delete models[key]
    }
  })

  return models
}

/**
 * Checks if the OpenAPI document has schemas.
 */
export const hasModels = (content?: OpenAPIV3_1.Document) => {
  if (!content) {
    return false
  }

  if (Object.keys(getModels(content) ?? {}).length) {
    return true
  }

  return false
}

/**
 * Checks if the OpenAPI document has webhooks.
 */
export const hasWebhooks = (document?: OpenAPIV3_1.Document) => {
  if (!document) {
    return false
  }

  if (Object.keys(document?.webhooks ?? {}).length) {
    return true
  }

  return false
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
