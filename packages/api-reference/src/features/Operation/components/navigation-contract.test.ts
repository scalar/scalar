import { createNavigation, createWorkspaceEventBus, withNavigation } from '@scalar/workspace-store/events'
import { describe, expect, it } from 'vitest'

import type RequestBody from './RequestBody.vue'

type RequestBodyBus = NonNullable<InstanceType<typeof RequestBody>['$props']['eventBus']>

/** Compile the actual component boundary rather than a duplicated props definition. */
const acceptRequestBodyHost = (bus: RequestBodyBus): RequestBodyBus => bus

const verifyTypes = (): void => {
  // @ts-expect-error Omitting the required dependency is not an explicit disabled host.
  const omitted: Pick<InstanceType<typeof RequestBody>['$props'], 'eventBus'> = {}
  void omitted
  const plain = createWorkspaceEventBus()
  // @ts-expect-error A notification bus alone does not support model navigation.
  acceptRequestBodyHost(plain)
  const item = createNavigation(plain, { 'scroll-to:nav-item': () => undefined })
  // @ts-expect-error Item scrolling is not a substitute for model navigation.
  acceptRequestBodyHost(withNavigation(plain, item.navigation))
  acceptRequestBodyHost(withNavigation(plain, false))
  const model = createNavigation(plain, { 'scroll-to:model-by-name': () => undefined })
  acceptRequestBodyHost(withNavigation(plain, model.navigation))
}
void verifyTypes

describe('navigation component contract', () => {
  it('accepts an explicit disabled host', () => {
    expect(acceptRequestBodyHost(withNavigation(createWorkspaceEventBus(), false)).navigation).toBe(false)
  })
})
