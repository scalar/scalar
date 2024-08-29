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

  return specification as OpenAPIV3.Document
}
