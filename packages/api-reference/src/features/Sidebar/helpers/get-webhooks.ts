import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Returns all webhooks from the OpenAPI document.
 * Each webhook can have HTTP methods (get, post, put, etc.) as keys.
 */
export function getWebhooks(
  content?: OpenAPIV3_1.Document,
  {
    filter,
  }: {
    filter?: (webhook: OpenAPIV3_1.PathItemObject) => boolean
  } = {},
) {
  if (!content) {
    return {} as Record<string, Record<OpenAPIV3_1.HttpMethods, OpenAPIV3_1.OperationObject>>
  }

  const webhooks =
    // OpenAPI 3.x
    (
      Object.keys(content?.webhooks ?? {}).length
        ? content?.webhooks
        : // Fallback
          {}
    ) as Record<string, Record<OpenAPIV3_1.HttpMethods, OpenAPIV3_1.OperationObject>>

  if (filter) {
    // Filter each webhook's operations based on the filter function
    return Object.fromEntries(
      Object.entries(webhooks)
        .map(([name, webhook]) => {
          const filteredOperations = Object.fromEntries(
            Object.entries(webhook).filter(([_, operation]) => filter(operation as OpenAPIV3_1.PathItemObject)),
          )
          // Only include webhooks that have at least one matching operation
          return Object.keys(filteredOperations).length > 0 ? [name, filteredOperations] : null
        })
        .filter(
          (entry): entry is [string, Record<OpenAPIV3_1.HttpMethods, OpenAPIV3_1.OperationObject>] => entry !== null,
        ),
    )
  }

  return webhooks
}
