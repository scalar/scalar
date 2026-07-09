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

/** Two OR alternatives that reference the same scope */
const duplicateScopes: RequiredSecurity = {
  state: 'required',
  requirements: [
    { schemes: [{ name: 'oauth2', scheme: { type: 'oauth2', flows: {} }, scopes: ['read:items'] }] },
    { schemes: [{ name: 'oidc', scheme: { type: 'openIdConnect', openIdConnectUrl: '' }, scopes: ['read:items'] }] },
  ],
}

/** A scheme without any scopes (for example, an API key) */
const withoutScopes: RequiredSecurity = {
  state: 'required',
  requirements: [
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

  it('de-duplicates scopes shared across alternatives', () => {
    const wrapper = mount(OperationScopes, { props: { requiredSecurity: duplicateScopes } })
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('read:items')
  })

  it('renders nothing when no scopes are required', () => {
    const wrapper = mount(OperationScopes, { props: { requiredSecurity: withoutScopes } })
    expect(wrapper.text()).toBe('')
  })
})
