import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { Item, ItemGroup, PostmanCollection } from '../types'

/**
 * Recursively processes collection items to extract server URLs
 */
function processItems(items: (Item | ItemGroup)[], domains: Set<string>) {
  items.forEach((item) => {
    if ('item' in item && Array.isArray(item.item)) {
      processItems(item.item, domains)
    } else if ('request' in item) {
      const request = item.request
      if (typeof request !== 'string') {
        const url = typeof request.url === 'string' ? request.url : request.url?.raw

        if (url) {
          try {
            // Extract domain from URL
            const urlMatch = url.match(/^(?:https?:\/\/)?([^/?#]+)/i)
            if (urlMatch?.[1]) {
              // Ensure we have the protocol
              const serverUrl = urlMatch[1].startsWith('http')
                ? urlMatch[1].replace(/\/$/, '')
                : `https://${urlMatch[1]}`.replace(/\/$/, '')
              domains.add(serverUrl)
            }
          } catch (error) {
            console.error(`Error extracting domain from URL "${url}":`, error)
          }
        }
      }
    }
  })
}

/**
 * Parses a Postman collection to extract unique server URLs.
 */
export function parseServers(postmanCollection: PostmanCollection): OpenAPIV3_1.ServerObject[] {
  const domains = new Set<string>()

  if (postmanCollection.item && Array.isArray(postmanCollection.item)) {
    processItems(postmanCollection.item, domains)
  }

  return Array.from(domains).map((domain) => ({
    url: domain,
  }))
}
