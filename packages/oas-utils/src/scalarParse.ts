import { type ResolvedOpenAPI, openapi } from '@scalar/openapi-parser'
import { z } from 'zod'

import {
  type PathsObject,
  type Spec,
  objectKeys,
  operationSchema,
  requestMethodSchema,
  tagSchema,
  transformedOperationSchema,
} from './types'

/**
 * Parse and transform an OpenAPI specification for rendering
 */
export const scalarParse = (specification: any): Promise<Spec> => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const result = await openapi().load(specification).resolve()

      if (result.schema === undefined) {
        throw 'Failed to parse the OpenAPI file.'
      }

      if (result.errors?.length) {
        console.warn(
          'Please open an issue on https://github.com/scalar/scalar\n',
          'Scalar OpenAPI Parser Warning:\n',
          result.errors,
        )
      }
      resolve(transformResult(structuredClone(result.schema)))
    } catch (error) {
      reject(error)
    }
  })
}

/** Transform a resolved OpenAPI spec from the OpenAPI Parser for better rendering */
export const transformResult = <TSpec extends ResolvedOpenAPI.Document>(
  schema: TSpec,
): Spec => {
  const tags = initTags(schema)
  const paths = initPaths(schema)

  if (
    'paths' in schema &&
    schema.paths !== undefined &&
    schema.paths !== null
  ) {
    // What's going on here? path is string but we're trying to do paths[path]?
    Object.keys(schema.paths).forEach((path) => {
      objectKeys(paths[path]).forEach((requestMethod) => {
        // Check if the request method is valid
        const method = requestMethodSchema.parse(requestMethod.toUpperCase())
        if (method) {
          // save the original operation
          const operation = paths[path][requestMethod]
          // parse the operation
          const parsedOperation = operationSchema.parse(operation)

          // Transform the operation
          const newOperation = {
            httpVerb: requestMethod,
            path,
            operationId: parsedOperation.operationId || path,
            name: parsedOperation.summary || path || '',
            description: parsedOperation.description || '',
            information: {
              ...operation,
            },
            pathParameters: paths[path]?.parameters,
          }

          // If the operation has no tags, add operation to the default tag
          if (!parsedOperation.tags || parsedOperation.tags.length === 0) {
            // Create the default tag.

            // find the index of the default tag
            const indexOfDefaultTag = tags.findIndex(
              (tag) => tag.name === 'default',
            )

            // Add the new operation to the default tag.
            if (indexOfDefaultTag >= 0) {
              // Add the new operation to the default tag.
              tags[indexOfDefaultTag].operations.push(newOperation)
            }
          }
          // If the operation has tags, loop through them.
          else {
            parsedOperation.tags.forEach((operationTag) => {
              // Try to find the tag in the schema
              const indexOfExistingTag = tags.findIndex(
                (tag) => tag.name === operationTag,
              )

              // Create tag if it doesn’t exist yet
              if (indexOfExistingTag === -1) {
                tags.push({
                  name: operationTag,
                  description: '',
                  operations: [],
                })
              }

              // Decide where to store the new operation
              const tagIndex =
                indexOfExistingTag !== -1 ? indexOfExistingTag : tags.length - 1

              // Create operations array if it doesn’t exist yet
              if (typeof tags[tagIndex].operations === 'undefined') {
                tags[tagIndex].operations = []
              }
              // Add the new operation
              tags[tagIndex].operations.push(newOperation)
            })
          }
        }
      })
    })
  }

  return {
    ...schema,
    webhooks: transformWebhooks(schema) || {},
    tags: tags.filter((tag) => tag.operations.length > 0),
    paths: paths,
  }
}

/**
 * Initialize and format tags array
 */
export const initTags = <T extends ResolvedOpenAPI.Document>(schema: T) => {
  const tags = new Array<z.infer<typeof tagSchema>>()

  const defaultTag = {
    name: 'default',
    description: '',
    operations: [],
  }

  // format existing tags
  if ('tags' in schema && schema.tags !== undefined && schema.tags !== null) {
    schema.tags.forEach((tag) => {
      tags.push(tagSchema.parse(tag)) //
    })
  }

  // Add the default tag if it doesn’t exist
  if (!tags.find((tag) => tag.name === 'default')) {
    tags.push(defaultTag)
  }
  return tags
}

/**
 * Initialize Paths if they don’t exist and properly type them
 */
export const initPaths = <T extends ResolvedOpenAPI.Document>(schema: T) => {
  if (
    'paths' in schema &&
    schema.paths !== undefined &&
    schema.paths !== null
  ) {
    const paths = schema.paths as PathsObject
    return paths
  } else return {} as PathsObject
}

/**
 * Transform webhooks data for rendering
 * Add Webhooks to the schema if they don’t exist and properly type them
 * Returns a new webhooks object with the transformed data
 */
export const transformWebhooks = <T extends ResolvedOpenAPI.Document>(
  schema: T,
) => {
  const webhooks: Record<string, any> = {}

  if (
    'webhooks' in schema &&
    schema.webhooks !== undefined &&
    schema.webhooks !== null
  ) {
    for (const [name, webhookRecord] of Object.entries(schema.webhooks)) {
      const webhookName = z.string().parse(name)
      /**
       * Example
          myWebhook: {
            "description": "Overriding description",
            "post": {
              "requestBody": {
                "required": true,
                "content": {
                  "application/json": {
                    "schema": { ...
       */
      for (const [key, value] of Object.entries(webhookRecord)) {
        // check if http verb
        const method = requestMethodSchema.safeParse(key.toUpperCase())
        if (method.success === true) {
          const data = transformedOperationSchema.parse(value)

          // Format data for rendering
          const newWebhook = {
            httpVerb: method,
            path: webhookName,
            operationId: data.operationId || webhookName,
            name: data.summary || webhookName || '',
            description: webhookRecord.description || '',
            pathParameters: schema.paths?.[webhookName]?.parameters,
            // Original data
            information: {
              ...webhookRecord,
            },
          }
          webhooks[webhookName] = newWebhook
        }
      }
    }
  }
  return webhooks
}
