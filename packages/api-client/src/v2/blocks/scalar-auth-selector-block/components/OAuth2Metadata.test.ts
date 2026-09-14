import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import OAuth2Metadata from './OAuth2Metadata.vue'
import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

describe('OAuth2Metadata', () => {
  it('edits the metadata URL without changing the scheme type', async () => {
    const eventBus = createWorkspaceEventBus()
    const update = vi.fn()
    eventBus.on('auth:update:security-scheme', update)
    const wrapper = mount(OAuth2Metadata, {
      props: {
        scheme: { type: 'oauth2', flows: {} },
        name: 'oauth',
        environment: { color: '', variables: [] },
        eventBus,
        proxyUrl: '',
      },
    })
    wrapper.getComponent(RequestAuthDataTableInput).vm.$emit('update:modelValue', 'https://example.com/metadata')
    await flushPromises()
    expect(update.mock.calls).toStrictEqual([
      [{ name: 'oauth', payload: { type: 'oauth2', oauth2MetadataUrl: 'https://example.com/metadata' } }],
    ])
    wrapper.unmount()
  })

  it('fetches metadata and emits flow configuration without credentials', async () => {
    const eventBus = createWorkspaceEventBus()
    const update = vi.fn()
    eventBus.on('auth:update:security-scheme', update)
    const customFetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({ token_endpoint: 'https://example.com/token', grant_types_supported: ['client_credentials'] }),
      )
    const wrapper = mount(OAuth2Metadata, {
      props: {
        scheme: { type: 'oauth2', flows: {}, oauth2MetadataUrl: 'https://example.com/metadata' },
        name: 'oauth',
        environment: { color: '', variables: [] },
        eventBus,
        proxyUrl: '',
        customFetch,
      },
    })
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Fetch Configuration')!
      .trigger('click')
    await vi.waitFor(() =>
      expect(update.mock.calls).toStrictEqual([
        [
          {
            name: 'oauth',
            payload: {
              type: 'oauth2',
              flows: { clientCredentials: { tokenUrl: 'https://example.com/token', scopes: {} } },
            },
          },
        ],
      ]),
    )
    wrapper.unmount()
  })
})
