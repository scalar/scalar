import { type ResolvedOpenAPI, openapi } from '@scalar/openapi-parser'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

import { validRequestMethods } from '../fixtures'
import type { AnyStringOrObject, SwaggerSpec } from '../types'

export const parse = (
  specification: AnyStringOrObject,
): Promise<SwaggerSpec> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const { valid, schema, errors } = await openapi()
        .load(specification)
        .resolve()

      if (!valid || schema === undefined) {
        reject(errors?.[0]?.error ?? 'Failed to parse the OpenAPI file.')

        return
      }

      resolve(transformResult(structuredClone(schema)))
    } catch (error) {
      reject(error)
    }
  })
}

const transformResult = (schema: ResolvedOpenAPI.Document): SwaggerSpec => {
  if (!schema.tags) {
    schema.tags = []
  }

  if (!schema.paths) {
    schema.paths = {}
  }

  // Webhooks
  const newWebhooks: Record<string, any> = {}

  // @ts-expect-error TODO: The types are just screwed, needs refactoring
  Object.keys(schema.webhooks ?? {}).forEach((name) => {
    // prettier-ignore
    ;(
      // @ts-expect-error TODO: The types are just screwed, needs refactoring
      Object.keys(schema.webhooks?.[name] ?? {}) as OpenAPIV3_1.HttpMethods[]
    ).forEach((httpVerb) => {
      const originalWebhook = // @ts-expect-error TODO: The types are just screwed, needs refactoring
        (schema.webhooks?.[name] as OpenAPIV3_1.PathItemObject)[httpVerb]

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
        pathParameters: schema.paths?.[name]?.parameters,
        // Original webhook
        information: {
          ...originalWebhook,
        },
      }

      // Object.assign(
      //   (schema).webhooks?.[name]?.[httpVerb] ?? {},
      //   {},
      // )
      // Object.assign(
      //   (schema).webhooks?.[name]?.[httpVerb] ?? {},
      //   {},
      // )
      // information: {
      //   ...(schema).webhooks?.[name],
      // },
    })
  })

  /**
   * { '/pet': { … } }
   */
  Object.keys(schema.paths).forEach((path: string) => {
    // @ts-expect-error TODO: The types are just screwed, needs refactoring
    const requestMethods = Object.keys(schema.paths[path]).filter((key) =>
      validRequestMethods.includes(key.toUpperCase()),
    )

    requestMethods.forEach((requestMethod) => {
      // @ts-expect-error TODO: The types are just screwed, needs refactoring
      const operation = schema.paths[path][requestMethod]

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
        pathParameters: schema.paths?.[path]?.parameters,
      }

      // If there are no tags, we’ll create a default one.
      if (!operation.tags || operation.tags.length === 0) {
        // Create the default tag.
        if (
          !schema.tags?.find(
            (tag: OpenAPIV2.TagObject | OpenAPIV3.TagObject) =>
              tag.name === 'default',
          )
        ) {
          schema.tags?.push({
            name: 'default',
            description: '',
            // @ts-expect-error TODO: The types are just screwed, needs refactoring
            operations: [],
          })
        }

        // find the index of the default tag
        const indexOfDefaultTag = schema.tags?.findIndex(
          (tag: OpenAPIV2.TagObject | OpenAPIV3.TagObject) =>
            tag.name === 'default',
        )

        // Add the new operation to the default tag.
        // @ts-expect-error TODO: The types are just screwed, needs refactoring
        if (indexOfDefaultTag >= 0) {
          // Add the new operation to the default tag.
          // @ts-expect-error TODO: The types are just screwed, needs refactoring
          schema.tags[indexOfDefaultTag]?.operations.push(newOperation)
        }
      }
      // If the operation has tags, loop through them.
      else {
        operation.tags.forEach((operationTag: string) => {
          // Try to find the tag in the schema
          const indexOfExistingTag = schema.tags?.findIndex(
            // @ts-expect-error TODO: The types are just screwed, needs refactoring
            (tag: SwaggerTag) => tag.name === operationTag,
          )

          // Create tag if it doesn’t exist yet
          if (indexOfExistingTag === -1) {
            schema.tags?.push({
              name: operationTag,
              description: '',
            })
          }

          // Decide where to store the new operation
          const tagIndex =
            indexOfExistingTag !== -1
              ? indexOfExistingTag
              : // @ts-expect-error TODO: The types are just screwed, needs refactoring
                schema.tags.length - 1

          // Create operations array if it doesn’t exist yet
          // @ts-expect-error TODO: The types are just screwed, needs refactoring
          if (typeof schema.tags[tagIndex]?.operations === 'undefined') {
            // @ts-expect-error TODO: The types are just screwed, needs refactoring
            schema.tags[tagIndex].operations = []
          }

          // Add the new operation
          // @ts-expect-error TODO: The types are just screwed, needs refactoring
          schema.tags[tagIndex].operations.push(newOperation)
        })
      }
    })
  })

  const returnedResult = {
    ...schema,
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
