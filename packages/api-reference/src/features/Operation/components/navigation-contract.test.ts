import { createNavigation, createWorkspaceEventBus, withNavigation } from '@scalar/workspace-store/events'
import { describe, expect, it } from 'vitest'

import type RequestBody from './RequestBody.vue'

type RequestBodyBus = InstanceType<typeof RequestBody>['$props']['eventBus']

/** Compile the actual component boundary rather than a duplicated props definition. */
const acceptRequestBodyHost = (bus: RequestBodyBus): RequestBodyBus => bus

const verifyTypes = (): void => {
  // @ts-expect-error Model navigation is a required dependency.
  const omitted: Pick<InstanceType<typeof RequestBody>['$props'], 'eventBus'> = {}
  void omitted
  // @ts-expect-error Null cannot replace the required model handler.
  acceptRequestBodyHost(null)
  const plain = createWorkspaceEventBus()
  // @ts-expect-error A notification bus alone does not support model navigation.
  acceptRequestBodyHost(plain)
  const item = createNavigation(plain, { 'scroll-to:nav-item': () => undefined })
  // @ts-expect-error Item scrolling is not a substitute for model navigation.
  acceptRequestBodyHost(withNavigation(plain, item.navigation))
  // @ts-expect-error Disabling navigation cannot satisfy the component dependency.
  acceptRequestBodyHost(withNavigation(plain, false))
  // @ts-expect-error A disabled command cannot replace a required handler.
  createNavigation(plain, { 'scroll-to:model-by-name': false })
  // @ts-expect-error Removed event names cannot be registered.
  createNavigation(plain, { 'scroll-to:old-model-event': () => undefined })
  // @ts-expect-error The replacement command is required by its declared scope.
  createNavigation<'scroll-to:model-by-name'>(plain, {})
  const model = createNavigation(plain, { 'scroll-to:model-by-name': () => undefined })
  acceptRequestBodyHost(withNavigation(plain, model.navigation))
}
void verifyTypes

describe('navigation-contract', () => {
  it('accepts a host with a required model destination', () => {
    const bus = createWorkspaceEventBus()
    const model = createNavigation(bus, { 'scroll-to:model-by-name': () => undefined })
    expect(acceptRequestBodyHost(withNavigation(bus, model.navigation)).navigation).toBe(model.navigation)
  })
})
