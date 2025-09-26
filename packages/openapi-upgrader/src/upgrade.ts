import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { upgradeFromThreeOneToThreeTwo } from '@/3.1-to-3.2'

import { upgradeFromTwoToThree } from './2.0-to-3.0'
import { upgradeFromThreeToThreeOne } from './3.0-to-3.1'

/**
 * Upgrade OpenAPI documents from Swagger 2.0 or OpenAPI 3.0 to OpenAPI 3.1.0
 */
export function upgrade(value: UnknownObject, targetVersion: '3.0' | '3.1' | '3.2') {
  // Swagger 2.0 -> OpenAPI 3.0
  const openapi30 = upgradeFromTwoToThree(value)
  if (targetVersion === '3.0') {
    return openapi30 as OpenAPIV3.Document
  }

  // OpenAPI 3.0 -> OpenAPI 3.1
  const openapi31 = upgradeFromThreeToThreeOne(openapi30)
  if (targetVersion === '3.1') {
    return openapi31 as OpenAPIV3_1.Document
  }

  // OpenAPI 3.1 -> OpenAPI 3.2
  const openapi32 = upgradeFromThreeOneToThreeTwo(openapi31)
  if (targetVersion === '3.2') {
    // TODO: We need OpenAPI 3.2 types
    return openapi32 as OpenAPIV3_1.Document
  }

  return openapi32
}
