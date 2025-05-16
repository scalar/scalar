/**
 * Unfortunately, this file is very messy. I think we should get rid of it entirely. :)
 * TODO: Slowly remove all the transformed properties and use the raw output of @scalar/openapi-parser instead.
 */
import { type RequestMethod, validRequestMethods } from '@/legacy/fixtures'
import { normalizeRequestMethod } from '@/legacy/helpers'
import { shouldIgnoreEntity } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'
import type { UnknownObject } from '@scalar/types/utils'

import { createEmptySpecification } from '@/libs/openapi'

type AnyObject = Record<string, any>

/**
 * Parse the given dereferencedDocument and return a super custom transformed dereferencedDocument.
 *
 * @deprecated Try to use a store instead.
 */
export const parse = (dereferencedDocument: OpenAPIV3_1.Document): Promise<Spec> => {
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: Yeah, I don’t know how to avoid this.
  return new Promise(async (resolve, reject) => {
    try {
      // Return an empty resolved dereferencedDocument if the given dereferencedDocument is empty
      if (!dereferencedDocument) {
        return resolve(transformResult(createEmptySpecification() as OpenAPIV3_1.Document))
      }

      return resolve(transformResult(dereferencedDocument))
    } catch (error) {
      console.error('[@scalar/api-reference]', 'Failed to parse the OpenAPI document. It might be invalid?')
      console.error(error)

      reject(error)
    }

    return resolve(transformResult(createEmptySpecification() as OpenAPIV3_1.Document))
  })
}

const transformResult = (originalSchema: OpenAPIV3_1.Document): Spec => {
  // Make it an object
  let schema = {} as AnyObject

  if (originalSchema && typeof originalSchema === 'object') {
    schema = originalSchema
  } else {
    schema = createEmptySpecification() as OpenAPIV3_1.Document
  }

  // Create empty tags array
  if (!schema.tags) {
    schema.tags = []
  }

  // Create empty paths object
  if (!schema.paths) {
    schema.paths = {}
  }

  // Create empty components object
  if (!schema.components) {
    schema.components = {}
  }

  // Create empty webhooks object
  if (!schema.webhooks) {
    schema.webhooks = {}
  }

  // Servers
  if (!schema.servers) {
    schema.servers = []
  }

  // Security
  if (!schema.security) {
    schema.security = []
  }

  // Webhooks
  const newWebhooks: AnyObject = {}

  Object.keys(schema.webhooks ?? {}).forEach((name) => {
    // prettier-ignore
    ;(Object.keys(schema.webhooks?.[name] ?? {}) as string[]).forEach((httpVerb) => {
      const originalWebhook = schema.webhooks?.[name][httpVerb]

      // Filter out webhooks marked as internal
      if (!originalWebhook || shouldIgnoreEntity(originalWebhook)) {
        return
      }

      if (Array.isArray(originalWebhook.tags)) {
        // Resolve the whole tag object
        const resolvedTags = originalWebhook.tags?.map((tag: string) =>
          schema.tags?.find((t: UnknownObject) => t.name === tag),
        )

        // Filter out tags marked as internal
        originalWebhook.tags = resolvedTags?.filter((tag: UnknownObject) => !shouldIgnoreEntity(tag))

        if (resolvedTags?.some((tag: UnknownObject) => shouldIgnoreEntity(tag))) {
          // Skip this webhook if it has tags marked as internal
          return
        }
      }

      if (newWebhooks[name] === undefined) {
        newWebhooks[name] = {}
      }

      newWebhooks[name][httpVerb] = {
        // Transformed data
        httpVerb: normalizeRequestMethod(httpVerb),
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
    })
  })

  Object.keys(schema.components?.schemas ?? {}).forEach((name) => {
    // Delete all schemas where `shouldIgnoreEntity` returns true
    if (shouldIgnoreEntity(schema.components?.schemas?.[name])) {
      delete schema.components?.schemas?.[name]
    }
  })

  /**
   * { '/pet': { … } }
   */
  Object.keys(schema.paths).forEach((path: string) => {
    const requestMethods = Object.keys(schema.paths[path]).filter((key) =>
      validRequestMethods.includes(key.toUpperCase() as RequestMethod),
    )

    requestMethods.forEach((requestMethod) => {
      const operation = schema.paths[path][requestMethod]

      // Skip if the operation is undefined
      if (operation === undefined) {
        return
      }

      // Filter out operations marked as internal
      if (shouldIgnoreEntity(operation)) {
        return
      }

      // Transform the operation
      const newOperation = {
        httpVerb: normalizeRequestMethod(requestMethod),
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
        if (!schema.tags?.find((tag: OpenAPIV3_1.TagObject) => tag.name === 'default')) {
          schema.tags?.push({
            name: 'default',
            description: '',
            operations: [],
          })
        }

        // find the index of the default tag
        const indexOfDefaultTag = schema.tags?.findIndex((tag: OpenAPIV3_1.TagObject) => tag.name === 'default')

        // Add the new operation to the default tag.
        if (indexOfDefaultTag >= 0) {
          // Add the new operation to the default tag.
          schema.tags[indexOfDefaultTag]?.operations.push(newOperation)
        }
      }
      // If the operation has tags, loop through them.
      else {
        operation.tags.forEach((operationTag: string) => {
          // Try to find the tag in the schema
          const indexOfExistingTag = schema.tags?.findIndex((tag: UnknownObject) => tag.name === operationTag)

          // Create tag if it doesn’t exist yet
          if (indexOfExistingTag === -1) {
            schema.tags?.push({
              name: operationTag,
              description: '',
            })
          }

          // Decide where to store the new operation
          const tagIndex = indexOfExistingTag !== -1 ? indexOfExistingTag : schema.tags.length - 1

          // Create operations array if it doesn’t exist yet
          if (typeof schema.tags[tagIndex]?.operations === 'undefined') {
            schema.tags[tagIndex].operations = []
          }

          // Add the new operation
          schema.tags[tagIndex].operations.push(newOperation)
        })
      }
    })
  })

  // Remove tags with `x-internal` set to true
  schema.tags = schema.tags?.filter((tag: UnknownObject) => !shouldIgnoreEntity(tag))

  const returnedResult = {
    ...schema,
    webhooks: newWebhooks,
  } as unknown as Spec

  return returnedResult
}
