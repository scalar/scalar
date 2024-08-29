import type { OpenAPIV3 } from '@scalar/openapi-types'

import type { AnyObject } from '../types'

/**
 * Upgrade Swagger 2.0 to OpenAPI 3.0
 *
 * https://swagger.io/blog/news/whats-new-in-openapi-3-0/
 */
export function upgradeFromTwoToThree(specification: AnyObject) {
  // Version
  if (specification.swagger?.startsWith('2.0')) {
    specification.openapi = '3.0.3'
    delete specification.swagger
  } else {
    // Skip if it’s something else than 3.0.x
    return specification
  }

  // Servers
  if (specification.host) {
    const schemes = specification.schemes?.length
      ? specification.schemes
      : ['http']

    specification.servers = schemes.map((scheme) => ({
      url: `${scheme}://${specification.host}${specification.basePath ?? ''}`,
    }))

    delete specification.basePath
    delete specification.schemes
    delete specification.host
  }

  return specification as OpenAPIV3.Document
}
