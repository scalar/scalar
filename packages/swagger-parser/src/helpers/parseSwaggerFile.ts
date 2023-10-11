import SwaggerParser from '@apidevtools/swagger-parser'
import yaml from 'js-yaml'
import { type OpenAPI, type OpenAPIV2, type OpenAPIV3 } from 'openapi-types'

export type SwaggerSpec = {
  info: {
    title: string
    description?: string
    version: string
    termsOfService: string
    contact: {
      email: string
    }
    license: {
      name: string
      url: string
    }
  }
  tags: SwaggerTag[]
}

export type SwaggerTag = {
  name: string
  description?: string
  operations: SwaggerOperation[]
}

// TODO: types
export type SwaggerOperation = any

type AnyObject = Record<string, any>

export const parseSwaggerFile = (
  /**
   * A JSON string or an object containg a Swagger spec.
   */
  value: string | AnyObject,
): Promise<SwaggerSpec> => {
  return new Promise((resolve, reject) => {
    try {
      const data = parseJsonOrYaml(value) as OpenAPI.Document<object>

      SwaggerParser.dereference(data, (error, result) => {
        if (error) {
          reject(error)
        }

        if (result === undefined) {
          reject('Couldn’t parse the Swagger file.')

          return
        }

        const transformedResult = transformResult(result)

        resolve(transformedResult)
      })
    } catch (error) {
      reject(error)
    }
  })
}

const transformResult = (result: OpenAPI.Document<object>): SwaggerSpec => {
  if (!result.tags) {
    result.tags = []
  }

  if (!result.paths) {
    result.paths = {}
  }

  /**
   * { '/pet': { … } }
   */
  Object.keys(result.paths).forEach((path: string) => {
    // @ts-ignore
    Object.keys(result.paths[path]).forEach((requestMethod) => {
      // @ts-ignore
      const operation = result.paths[path][requestMethod]
      // Transform the operation
      const newOperation = {
        httpVerb: requestMethod,
        path,
        operationId: operation.operationId || path || '',
        name: operation.summary || '',
        description: operation.description || '',
        information: {
          ...operation,
        },
      }

      // If there are no tags, we’ll create a default one.
      if (!operation.tags || operation.tags.length === 0) {
        // Create the default tag.
        if (
          !result.tags?.find(
            (tag: OpenAPIV2.TagObject | OpenAPIV3.TagObject) =>
              tag.name === 'default',
          )
        ) {
          result.tags?.push({
            name: 'default',
            description: '',
            // @ts-ignore
            operations: [],
          })
        }

        // find the index of the default tag
        const indexOfDefaultTag = result.tags?.findIndex(
          (tag: OpenAPIV2.TagObject | OpenAPIV3.TagObject) =>
            tag.name === 'default',
        )

        // Add the new operation to the default tag.
        // @ts-ignore
        if (indexOfDefaultTag >= 0) {
          // Add the new operation to the default tag.
          // @ts-ignore
          result.tags[indexOfDefaultTag]?.operations.push(newOperation)
        }
      }
      // If the operation has tags, loop through them.
      else {
        operation.tags.forEach((operationTag: string) => {
          // Try to find the tag in the result
          const indexOfExistingTag = result.tags?.findIndex(
            // @ts-ignore
            (tag: SwaggerTag) => tag.name === operationTag,
          )

          // Create tag if it doesn’t exist yet
          if (indexOfExistingTag === -1) {
            result.tags?.push({
              name: operationTag,
              description: '',
            })
          }

          // Decide where to store the new operation
          const tagIndex =
            indexOfExistingTag !== -1
              ? indexOfExistingTag
              : // @ts-ignore
                result.tags.length - 1

          // Create operations array if it doesn’t exist yet
          // @ts-ignore
          if (typeof result.tags[tagIndex]?.operations === 'undefined') {
            // @ts-ignore
            result.tags[tagIndex].operations = []
          }

          // Add the new operation
          // @ts-ignore
          result.tags[tagIndex].operations.push(newOperation)
        })
      }
    })
  })

  return result as unknown as SwaggerSpec
}

export const parseJsonOrYaml = (value: string | AnyObject): AnyObject => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as AnyObject
    } catch (error) {
      // String starts with { or [, so it’s probably JSON.
      if (value.length > 0 && ['{', '['].includes(value[0])) {
        throw error
      }

      // Then maybe it’s YAML?
      return yaml.load(value) as AnyObject
    }
  }

  return value as AnyObject
}
