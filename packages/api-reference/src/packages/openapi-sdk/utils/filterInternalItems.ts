import type { OpenAPI } from '@scalar/openapi-types'

/**
 * Filter `x-internal` entries
 */
export function filterInternalItems(
  content: OpenAPI.Document,
): OpenAPI.Document {
  const filteredContent = { ...content } as OpenAPI.Document

  // Filter paths
  if (filteredContent.paths) {
    filteredContent.paths = Object.fromEntries(
      Object.entries(filteredContent.paths).filter(([_, pathItem]) => {
        if (pathItem['x-internal']) return false

        // Filter operations within each path
        Object.keys(pathItem).forEach((key) => {
          const operation = pathItem[key as keyof typeof pathItem]
          if (typeof operation === 'object' && operation['x-internal']) {
            delete pathItem[key as keyof typeof pathItem]
          }
        })

        return Object.keys(pathItem).length > 0
      }),
    )
  }

  // Filter webhooks
  if (filteredContent.webhooks) {
    filteredContent.webhooks = Object.fromEntries(
      Object.entries(filteredContent.webhooks).filter(([_, webhookItem]) => {
        if (webhookItem['x-internal']) return false

        // Filter operations within each webhook
        Object.keys(webhookItem).forEach((key) => {
          const operation = webhookItem[key as keyof typeof webhookItem]
          if (typeof operation === 'object' && operation['x-internal']) {
            delete webhookItem[key as keyof typeof webhookItem]
          }
        })

        return Object.keys(webhookItem).length > 0
      }),
    )
  }

  return filteredContent
}
