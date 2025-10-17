import type { OpenAPIV3, OpenAPIV3_1, OpenAPIV3_2 } from '@scalar/openapi-types'

import { upgradeFromThreeOneToThreeTwo } from '@/3.1-to-3.2'

import { upgradeFromTwoToThree } from './2.0-to-3.0'
import { upgradeFromThreeToThreeOne } from './3.0-to-3.1'
import type { UnknownObject } from '@scalar/types/utils'

/**
 * Upgrade OpenAPI documents from Swagger 2.0 or OpenAPI 3.0 to the specified target version
 */
export function upgrade(value: UnknownObject, targetVersion: '3.0'): OpenAPIV3.Document
export function upgrade(value: UnknownObject, targetVersion: '3.1'): OpenAPIV3_1.Document
export function upgrade(value: UnknownObject, targetVersion: '3.2'): OpenAPIV3_2.Document
export function upgrade(
  value: UnknownObject,
  targetVersion: '3.0' | '3.1' | '3.2',
): OpenAPIV3.Document | OpenAPIV3_1.Document | OpenAPIV3_2.Document {
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
    return openapi32 as OpenAPIV3_2.Document
  }

  return openapi32
}
