import { normalizeRequestMethod } from '@/legacy/helpers'
import { shouldIgnoreEntity } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types/legacy'
import type { UnknownObject } from '@scalar/types/utils'

import { createEmptySpecification } from '@/libs/openapi'
import type { SidebarEntry } from '@/features/Sidebar'

type AnyObject = Record<string, any>

/**
 * Parse the given dereferencedDocument and return a super custom transformed dereferencedDocument.
 *
 * @deprecated Try to use a store instead.
 */
export const parse = (dereferencedDocument: OpenAPIV3_1.Document, items?: SidebarEntry[]): Promise<Spec> => {
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: Yeah, I don’t know how to avoid this.
  return new Promise(async (resolve, reject) => {
    try {
      // Return an empty resolved dereferencedDocument if the given dereferencedDocument is empty
      if (!dereferencedDocument) {
        return resolve(transformResult(createEmptySpecification() as OpenAPIV3_1.Document))
      }

      return resolve(transformResult(dereferencedDocument, items))
    } catch (error) {
      console.error('[@scalar/api-reference]', 'Failed to parse the OpenAPI document. It might be invalid?')
      console.error(error)

      reject(error)
    }

    return resolve(transformResult(createEmptySpecification() as OpenAPIV3_1.Document))
  })
}

const transformResult = (originalSchema: OpenAPIV3_1.Document, items?: SidebarEntry[]): Spec => {
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

  const parseTag = (item: SidebarEntry) => {
    if (!item.tag || !item.children?.length) {
      return
    }

    item.children.forEach((child) => {
      const tagIndex = schema.tags?.findIndex((tag: OpenAPIV3_1.TagObject) => tag.name === item.tag?.name)
      schema.tags[tagIndex].webhooks ||= []
      schema.tags[tagIndex].operations ||= []

      // Tag
      if (child.tag) {
        parseTag(child)
      }

      // Operation
      else if (child.operation) {
        schema.tags[tagIndex].operations.push({
          httpVerb: normalizeRequestMethod(child.httpVerb),
          path: child.path,
          operationId: child.operation.operationId || child.path,
          name: child.operation.summary || child.path || '',
          description: child.operation.description || '',
          isWebhook: false,
          information: {
            ...child.operation,
          },
          pathParameters: schema.paths?.[child.path ?? '']?.parameters,
        })
      }

      // Webhook
      else if (child.webhook) {
        schema.tags[tagIndex].webhooks.push({
          // Transformed data
          httpVerb: normalizeRequestMethod(child.httpVerb),
          path: child.name,
          operationId: child.webhook.operationId || child.name,
          name: child.webhook.summary || child.name || '',
          description: child.webhook.description || '',
          pathParameters: schema.paths?.[child.name ?? '']?.parameters,
          isWebhook: true,
          // Original webhook
          information: {
            ...child.webhook,
          },
        })
      }
    })
  }

  /**
   * Use the sidebar items as the source of truth as they have been filtered
   * TODO: this is an extreme hack just temp while we move over to use the sidebar items
   */
  items?.forEach((item) => {
    // Tag groups
    if (item.isGroup && item.children?.length) {
      item.children.forEach(parseTag)
    }
    // Tags
    if (item.tag) {
      parseTag(item)
    }
    // Webhooks
    if (item.title === 'Webhooks' && item.children?.length) {
      item.children.forEach((child) => {
        if (child.webhook && child.name && child.httpVerb) {
          newWebhooks[child.name] ||= {}
          newWebhooks[child.name][child.httpVerb] = {
            // Transformed data
            httpVerb: normalizeRequestMethod(child.httpVerb),
            path: child.name,
            operationId: child.webhook.operationId || child.name,
            name: child.webhook.summary || child.name || '',
            description: child.webhook.description || '',
            pathParameters: schema.paths?.[child.name]?.parameters,
            // Original webhook
            information: {
              ...child.webhook,
            },
          }
        }
      })
    }
  })

  Object.keys(schema.components?.schemas ?? {}).forEach((name) => {
    // Delete all schemas where `shouldIgnoreEntity` returns true
    if (shouldIgnoreEntity(schema.components?.schemas?.[name])) {
      delete schema.components?.schemas?.[name]
    }
  })

  // Remove tags with `x-internal` set to true
  schema.tags = schema.tags?.filter((tag: UnknownObject) => !shouldIgnoreEntity(tag))

  const returnedResult = {
    ...schema,
    webhooks: newWebhooks,
  } as unknown as Spec

  return returnedResult
}
