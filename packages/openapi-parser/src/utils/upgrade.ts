import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { AnyObject, Filesystem, UpgradeResult } from '../types/index.js'
import { getEntrypoint } from './getEntrypoint.js'
import { makeFilesystem } from './makeFilesystem.js'
import { upgradeFromThreeToThreeOne } from './upgradeFromThreeToThreeOne.js'
import { upgradeFromTwoToThree } from './upgradeFromTwoToThree.js'

/**
 * Upgrade specification to OpenAPI 3.1.0
 */
export function upgrade(
  value: string | AnyObject | Filesystem,
): UpgradeResult<OpenAPIV3_1.Document> {
  if (!value) {
    return {
      specification: null,
      version: '3.1',
    }
  }
  const upgraders = [upgradeFromTwoToThree, upgradeFromThreeToThreeOne]

  // TODO: Run upgrade over the whole filesystem
  const result = upgraders.reduce(
    (currentSpecification, upgrader) => upgrader(currentSpecification),
    getEntrypoint(makeFilesystem(value)).specification,
  ) as OpenAPIV3_1.Document

  return {
    specification: result,
    // TODO: Make dynamic
    version: '3.1',
  } as UpgradeResult<OpenAPIV3_1.Document>
}
