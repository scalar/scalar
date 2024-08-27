import type { AnyObject, Filesystem, UpgradeResult } from '../types'
import { getEntrypoint } from './getEntrypoint'
import { makeFilesystem } from './makeFilesystem'
import { upgradeFromThreeToThreeOne } from './upgradeFromThreeToThreeOne'
import { upgradeFromTwoToThree } from './upgradeFromTwoToThree'

/**
 * Upgrade specification to OpenAPI 3.1.0
 */
export function upgrade(
  specification: AnyObject | Filesystem,
  _options?: AnyObject,
): UpgradeResult {
  const upgraders = [upgradeFromTwoToThree, upgradeFromThreeToThreeOne]

  // TODO: Run upgrade over the whole filesystem
  const result = upgraders.reduce(
    (currentSpecification, upgrader) => upgrader(currentSpecification),
    getEntrypoint(makeFilesystem(specification)).specification,
  )

  return {
    specification: result,
    // TODO: Make dynamic
    version: '3.1',
  }
}
