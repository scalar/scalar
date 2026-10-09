import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { RequiredSecurityScheme } from '@/features/Operation/helpers/get-required-security'

import SecurityRequirementBadgeScheme from './SecurityRequirementBadgeScheme.vue'

describe('SecurityRequirementBadgeScheme', () => {
  it.each([
    ['cookie', 'Send the API key in the “access_token” cookie.'],
    ['header', 'Send the API key in the “access_token” header.'],
    ['query', 'Send the API key in the “access_token” query parameter.'],
  ] as const)('explains an API key in a %s', (location, instruction) => {
    const wrapper = mount(SecurityRequirementBadgeScheme, {
      props: {
        scheme: {
          name: 'AuthRequired',
          scheme: { type: 'apiKey', name: 'access_token', in: location },
          scopes: [],
        },
      },
    })

    expect(wrapper.text()).toContain('AuthRequired')
    expect(wrapper.text()).toContain('API key')
    expect(wrapper.get('p').text()).toBe(instruction)
    wrapper.unmount()
  })

  it('renders the author description as Markdown', () => {
    const wrapper = mount(SecurityRequirementBadgeScheme, {
      props: {
        scheme: {
          name: 'AuthRequired',
          scheme: {
            type: 'apiKey',
            name: 'access_token',
            in: 'cookie',
            description: 'A **JWT token** in the `access_token` cookie.',
          },
          scopes: [],
        },
      },
    })

    expect(wrapper.get('strong').text()).toBe('JWT token')
    expect(wrapper.get('code').text()).toBe('access_token')
    wrapper.unmount()
  })

  it.each([
    [{ type: 'http', scheme: 'bearer' }, 'HTTP bearer'],
    [{ type: 'oauth2', flows: {} }, 'OAuth 2.0'],
    [{ type: 'openIdConnect', openIdConnectUrl: 'https://example.com/discovery' }, 'OpenID Connect'],
    [{ type: 'mutualTLS' }, 'Mutual TLS'],
  ] satisfies [RequiredSecurityScheme['scheme'], string][])(
    'labels %j without API key instructions',
    (scheme, label) => {
      const wrapper = mount(SecurityRequirementBadgeScheme, {
        props: { scheme: { name: 'Example', scheme, scopes: [] } },
      })

      expect(wrapper.text()).toContain(label)
      expect(wrapper.text()).not.toContain('Send the API key')
      wrapper.unmount()
    },
  )

  it('retains the name and scopes when a scheme is unresolved', () => {
    const wrapper = mount(SecurityRequirementBadgeScheme, {
      props: { scheme: { name: 'Unknown', scheme: undefined, scopes: ['read:items'] } },
    })

    expect(wrapper.text()).toContain('Unknown')
    expect(wrapper.get('ul').text()).toBe('read:items')
    wrapper.unmount()
  })
})
