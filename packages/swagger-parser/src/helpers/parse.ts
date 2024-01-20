import SwaggerParser from '@apidevtools/swagger-parser'
import yaml from 'js-yaml'
import { type OpenAPI, type OpenAPIV2, type OpenAPIV3 } from 'openapi-types'
import { type OpenAPIV3_1 } from 'openapi-types'

import { validRequestMethods } from '../fixtures'
import type { AnyObject, AnyStringOrObject, SwaggerSpec } from '../types'

export const parse = (value: AnyStringOrObject): Promise<SwaggerSpec> => {
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

const transformResult = (result: OpenAPI.Document): SwaggerSpec => {
  if (!result.tags) {
    result.tags = []
  }

  if (!result.paths) {
    result.paths = {}
  }

  // Webhooks
  const newWebhooks: Record<string, any> = {}

  Object.keys((result as OpenAPIV3_1.Document).webhooks ?? {}).forEach(
    (name) => {
      ;(
        Object.keys(
          (result as OpenAPIV3_1.Document).webhooks?.[name] ?? {},
        ) as OpenAPIV3_1.HttpMethods[]
      ).forEach((httpVerb) => {
        const originalWebhook = (
          (result as OpenAPIV3_1.Document).webhooks?.[
            name
          ] as OpenAPIV3_1.PathItemObject
        )[httpVerb]

        if (newWebhooks[name] === undefined) {
          newWebhooks[name] = {}
        }

        newWebhooks[name][httpVerb] = {
          // Transformed data
          httpVerb: httpVerb,
          path: name,
          operationId: originalWebhook?.operationId || name,
          name: originalWebhook?.summary || name || '',
          description: originalWebhook?.description || '',
          pathParameters: result.paths?.[name]?.parameters,
          // Original webhook
          information: {
            ...originalWebhook,
          },
        }

        // Object.assign(
        //   (result as OpenAPIV3_1.Document).webhooks?.[name]?.[httpVerb] ?? {},
        //   {},
        // )
        // Object.assign(
        //   (result as OpenAPIV3_1.Document).webhooks?.[name]?.[httpVerb] ?? {},
        //   {},
        // )
        // information: {
        //   ...(result as OpenAPIV3_1.Document).webhooks?.[name],
        // },
      })
    },
  )

  /**
   * { '/pet': { … } }
   */
  Object.keys(result.paths).forEach((path: string) => {
    // @ts-ignore
    const requestMethods = Object.keys(result.paths[path]).filter((key) =>
      validRequestMethods.includes(key.toUpperCase()),
    )

    requestMethods.forEach((requestMethod) => {
      // @ts-ignore
      const operation = result.paths[path][requestMethod]

      // Transform the operation
      const newOperation = {
        httpVerb: requestMethod,
        path,
        operationId: operation.operationId || path,
        name: operation.summary || path || '',
        description: operation.description || '',
        information: {
          ...operation,
        },
        pathParameters: result.paths?.[path]?.parameters,
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

  const returnedResult = {
    ...result,
    webhooks: newWebhooks,
  } as unknown as SwaggerSpec

  return removeTagsWithoutOperations(returnedResult)
}

const removeTagsWithoutOperations = (spec: SwaggerSpec) => {
  return {
    ...spec,
    tags: spec.tags?.filter((tag) => tag.operations?.length > 0),
  }
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

/** @deprecated */
export const parseSwaggerFile = parse
