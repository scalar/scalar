import type { UnknownObject } from '@scalar/types/utils'

import { upgradeFromOneToTwo } from './1.2-to-2.6'
import { upgradeFromTwoToThree } from './2.6-to-3.0'
import { upgradeFromThreeToThreeOne } from './3.0-to-3.1'

/**
 * Upgrade an AsyncAPI document to the latest version.
 *
 * Each step migrates the document through one major version, applying the structural
 * transformations that version requires (for example 2.x → 3.0 lifts channel
 * `publish`/`subscribe` operations into the top-level `operations` map and splits a
 * server `url` into `host`/`pathname`), mirroring `@scalar/openapi-upgrader`.
 */
export function upgrade(value: UnknownObject): UnknownObject {
  // AsyncAPI 1.x -> 2.6
  const asyncapi26 = upgradeFromOneToTwo(value)

  // AsyncAPI 2.x -> 3.0
  const asyncapi30 = upgradeFromTwoToThree(asyncapi26)

  // AsyncAPI 3.0 -> 3.1
  return upgradeFromThreeToThreeOne(asyncapi30)
}
