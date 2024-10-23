import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { PostmanCollection } from '../types'
import { getDomainFromUrl } from './urlHelpers'

/**
 * Parses a Postman collection to extract unique server URLs.
 * Iterates through collection items, extracts domains from request URLs,
 * and returns an array of unique server objects for the OpenAPI specification.
 */
export function parseServers(
  postmanCollection: PostmanCollection,
): OpenAPIV3.ServerObject[] {
  // Set to store unique domains
  const domains = new Set<string>()

  if (postmanCollection.item && Array.isArray(postmanCollection.item)) {
    postmanCollection.item.forEach((item) => {
      if ('request' in item && typeof item.request !== 'string') {
        const url =
          typeof item.request.url === 'string'
            ? item.request.url
            : item.request.url?.raw

        if (url) {
          try {
            const domain = getDomainFromUrl(url)
            domains.add(domain)
          } catch (error) {
            // Silently handle errors in domain extraction
          }
        }
      }
    })
  }

  return Array.from(domains).map((domain) => ({ url: domain }))
}
