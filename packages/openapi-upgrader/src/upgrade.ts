import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { upgradeFromTwoToThree } from './2.0-to-3.0'
import { upgradeFromThreeToThreeOne } from './3.0-to-3.1'

/**
 * Upgrade OpenAPI documents from Swagger 2.0 or OpenAPI 3.0 to OpenAPI 3.1.0
 */
export function upgrade(value: UnknownObject): OpenAPIV3_1.Document {
  // Swagger 2.0 -> OpenAPI 3.0
  const openapi30 = upgradeFromTwoToThree(value)

  // OpenAPI 3.0 -> OpenAPI 3.1
  const openapi31 = upgradeFromThreeToThreeOne(openapi30)

  return openapi31
}
