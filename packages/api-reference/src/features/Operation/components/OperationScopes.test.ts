import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'

import OperationScopes from './OperationScopes.vue'

/** Single OAuth2 scheme requiring two scopes */
const withScopes: RequiredSecurity = {
  state: 'required',
  requirements: [
    {
      schemes: [{ name: 'oauth2', scheme: { type: 'oauth2', flows: {} }, scopes: ['read:items', 'write:items'] }],
    },
  ],
}

/** A single OAuth2 scheme that lists the same scope twice */
const duplicateScopes: RequiredSecurity = {
  state: 'required',
  requirements: [
    {
      schemes: [{ name: 'oauth2', scheme: { type: 'oauth2', flows: {} }, scopes: ['read:items', 'read:items'] }],
    },
  ],
}

/** Two OR alternatives, each requiring a different scope set */
const alternativeScopes: RequiredSecurity = {
  state: 'required',
  requirements: [
    { schemes: [{ name: 'oauth2', scheme: { type: 'oauth2', flows: {} }, scopes: ['read:items'] }] },
    { schemes: [{ name: 'oidc', scheme: { type: 'openIdConnect', openIdConnectUrl: '' }, scopes: ['admin'] }] },
  ],
}

/** A scheme without any scopes (for example, an API key) */
const withoutScopes: RequiredSecurity = {
  state: 'required',
  requirements: [
    { schemes: [{ name: 'apiKey', scheme: { type: 'apiKey', name: 'X-API-Key', in: 'header' }, scopes: [] }] },
  ],
}

/** One OAuth2 alternative with scopes, plus a scope-free API key alternative (OR) */
const scopedOrScopeFree: RequiredSecurity = {
  state: 'required',
  requirements: [
    { schemes: [{ name: 'oauth2', scheme: { type: 'oauth2', flows: {} }, scopes: ['read:items'] }] },
    { schemes: [{ name: 'apiKey', scheme: { type: 'apiKey', name: 'X-API-Key', in: 'header' }, scopes: [] }] },
  ],
}

describe('OperationScopes', () => {
  it('lists every required scope under the heading', () => {
    const wrapper = mount(OperationScopes, { props: { requiredSecurity: withScopes } })
    expect(wrapper.text()).toContain('OAuth scopes')
    expect(wrapper.text()).toContain('read:items')
    expect(wrapper.text()).toContain('write:items')
  })

  it('de-duplicates scopes within an alternative', () => {
    const wrapper = mount(OperationScopes, { props: { requiredSecurity: duplicateScopes } })
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('read:items')
  })

  it('keeps mutually exclusive alternatives separate instead of merging them', () => {
    const wrapper = mount(OperationScopes, { props: { requiredSecurity: alternativeScopes } })
    // One list per OR alternative, so exclusive scope sets are not implied to be required together.
    expect(wrapper.findAll('ul')).toHaveLength(2)
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).toContain('read:items')
    expect(wrapper.text()).toContain('admin')
  })

  it('hints that scopes are optional when another alternative needs none', () => {
    const wrapper = mount(OperationScopes, { props: { requiredSecurity: scopedOrScopeFree } })
    // Only the scoped alternative renders a list, but the "one of" hint signals the
    // scopes are not mandatory because the API key alternative satisfies auth without them.
    expect(wrapper.findAll('ul')).toHaveLength(1)
    expect(wrapper.text()).toContain('read:items')
    expect(wrapper.text()).toContain('one of:')
  })

  it('renders nothing when no scopes are required', () => {
    const wrapper = mount(OperationScopes, { props: { requiredSecurity: withoutScopes } })
    expect(wrapper.text()).toBe('')
  })
})
