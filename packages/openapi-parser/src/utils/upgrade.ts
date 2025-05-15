import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { UnknownObject } from '@scalar/types/utils'
import type { AnyObject, Filesystem, UpgradeResult } from '../types/index'
import { getEntrypoint } from './getEntrypoint'
import { isFilesystem } from './isFilesystem'
import { normalize } from './normalize'
import { upgradeFromThreeToThreeOne } from './upgradeFromThreeToThreeOne'
import { upgradeFromTwoToThree } from './upgradeFromTwoToThree'

const upgraders = [
  // Swagger 2.0 -> OpenAPI 3.0
  upgradeFromTwoToThree,
  // OpenAPI 3.0 -> OpenAPI 3.1
  upgradeFromThreeToThreeOne,
]

/**
 * Upgrade specification to OpenAPI 3.1.0
 */
export function upgrade(value: string | AnyObject | Filesystem): UpgradeResult<OpenAPIV3_1.Document> {
  if (!value) {
    return {
      specification: null,
      version: '3.1',
    }
  }

  // TODO: Run upgrade over the whole filesystem
  const result = upgraders.reduce(
    (currentSpecification, upgrader) => upgrader(currentSpecification as UnknownObject),
    isFilesystem(value) ? getEntrypoint(value as Filesystem).specification : normalize(value),
  ) as OpenAPIV3_1.Document

  return {
    specification: result,
    // TODO: Make dynamic
    version: '3.1',
  } as UpgradeResult<OpenAPIV3_1.Document>
}
