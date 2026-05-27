import type { UnknownObject } from '@scalar/types/utils'

import { upgradeFromOneToTwo } from './1.2-to-2.6'
import { upgradeFromTwoToThree } from './2.6-to-3.0'
import { upgradeFromThreeToThreeOne } from './3.0-to-3.1'

/**
 * Upgrade an AsyncAPI document to the latest version.
 *
 * Each step only bumps the `asyncapi` version string for now — no structural
 * transformations are applied yet. The version-specific upgraders exist so the
 * real migration logic can be filled in later, mirroring `@scalar/openapi-upgrader`.
 */
export function upgrade(value: UnknownObject): UnknownObject {
  // AsyncAPI 1.x -> 2.6
  const asyncapi26 = upgradeFromOneToTwo(value)

  // AsyncAPI 2.x -> 3.0
  const asyncapi30 = upgradeFromTwoToThree(asyncapi26)

  // AsyncAPI 3.0 -> 3.1
  return upgradeFromThreeToThreeOne(asyncapi30)
}
