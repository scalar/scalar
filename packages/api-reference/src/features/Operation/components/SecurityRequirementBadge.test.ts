import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'

import SecurityRequirementBadge from './SecurityRequirementBadge.vue'

const requiredWithScopes: RequiredSecurity = {
  state: 'required',
  schemes: [
    { name: 'oauth2', scheme: { type: 'oauth2', flows: {} }, scopes: ['read:items', 'write:items'] },
    { name: 'apiKey', scheme: { type: 'apiKey', name: 'X-API-Key', in: 'header' }, scopes: [] },
  ],
}

const optional: RequiredSecurity = {
  state: 'optional',
  schemes: [{ name: 'bearerAuth', scheme: { type: 'http', scheme: 'bearer' }, scopes: [] }],
}

const none: RequiredSecurity = { state: 'none', schemes: [] }

describe('SecurityRequirementBadge', () => {
  it('renders "auth required" with a lock icon and tooltip listing schemes + scopes', () => {
    const wrapper = mount(SecurityRequirementBadge, { props: { requiredSecurity: requiredWithScopes } })
    const badge = wrapper.find('.security-requirement-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('auth required')
    // Tooltip content is passed via the ScalarTooltip `content` prop on the outer wrapper
    const tooltipContent = wrapper.findComponent({ name: 'ScalarTooltip' }).props('content')
    expect(tooltipContent).toBe('Requires oauth2 (oauth2) [read:items, write:items] · apiKey (apiKey)')
  })

  it('renders "auth optional" when state is optional', () => {
    const wrapper = mount(SecurityRequirementBadge, { props: { requiredSecurity: optional } })
    const badge = wrapper.find('.security-requirement-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('auth optional')
    const tooltipContent = wrapper.findComponent({ name: 'ScalarTooltip' }).props('content')
    expect(tooltipContent).toBe('Accepts bearerAuth (http)')
  })

  it('renders nothing when state is none', () => {
    const wrapper = mount(SecurityRequirementBadge, { props: { requiredSecurity: none } })
    expect(wrapper.find('.security-requirement-badge').exists()).toBe(false)
  })
})
