import type { OpenAPIV3, OpenAPIV3_1, OpenAPIV3_2 } from '@scalar/openapi-types'
import type { UnknownObject } from '@scalar/types/utils'

import { migrateThreeOneToThreeTwo } from '@/3.1-to-3.2/upgrade-from-three-one-to-three-two'

import { upgradeFromTwoToThree } from './2.0-to-3.0'
import { upgradeFromThreeToThreeOne } from './3.0-to-3.1'
import { cloneDocument } from './helpers/clone-document'

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
  if (targetVersion === '3.2') {
    // Every step in the 3.2 pipeline owns the same clone, including earlier converters.
    const input = cloneDocument(value)
    const openapi30 = upgradeFromTwoToThree(input)
    const openapi31 = upgradeFromThreeToThreeOne(openapi30)
    return migrateThreeOneToThreeTwo(openapi31)
  }

  // Preserve the earlier targets without entering the 3.2 migration.
  const openapi30 = upgradeFromTwoToThree(value)
  return targetVersion === '3.0' ? openapi30 : upgradeFromThreeToThreeOne(openapi30)
}
