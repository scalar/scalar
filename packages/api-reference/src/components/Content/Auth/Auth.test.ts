import { apiReferenceConfigurationSchema } from '@scalar/schemas/api-reference'
import { coerce } from '@scalar/validation'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { MergedSecuritySchemes } from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import Auth from './Auth.vue'

const eventBus = createWorkspaceEventBus()
const workspaceStore = createWorkspaceStore()

const environment: XScalarEnvironment = { color: '', variables: [] }

/**
 * Minimal AsyncAPI document whose single server declares a security requirement that resolves
 * to `components.securitySchemes`. `x-scalar-navigation.name` scopes auth selections in the store.
 */
const asyncApiDocument = {
  asyncapi: '3.0.0',
  info: { title: 'Async API', version: '1.0.0' },
  'x-scalar-navigation': { name: 'async-doc' },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer' },
    },
  },
  servers: {
    production: {
      host: 'example.com',
      protocol: 'wss',
      security: [{ $ref: '#/components/securitySchemes/bearerAuth' }],
    },
  },
} as unknown as WorkspaceDocument

const config = coerce(apiReferenceConfigurationSchema, { layout: 'modern' })

const mountAuth = (securitySchemes: MergedSecuritySchemes, document = asyncApiDocument, options = config) =>
  mount(Auth, {
    props: {
      options,
      authStore: workspaceStore.auth,
      document,
      eventBus,
      securitySchemes,
      selectedServer: null,
      environment,
    },
  })

describe('Auth', () => {
  it('fetches OAuth2 metadata with the configured custom fetch', async () => {
    const customFetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({ token_endpoint: 'https://example.com/token', grant_types_supported: ['client_credentials'] }),
      )
    const document = {
      openapi: '3.2.1',
      'x-scalar-original-document-hash': '',
      info: { title: 'OAuth metadata', version: '1.0' },
      'x-scalar-navigation': {
        name: 'oauth-metadata',
        id: 'oauth-metadata',
        title: 'OAuth metadata',
        type: 'document',
      },
      security: [{ oauth: [] }],
    } satisfies WorkspaceDocument
    const wrapper = mountAuth(
      {
        oauth: {
          type: 'oauth2',
          flows: {},
          oauth2MetadataUrl: 'https://example.com/metadata',
        },
      },
      document,
      { ...config, customFetch },
    )
    expect(wrapper.text()).toContain('Metadata URL')
    expect(wrapper.text()).toContain('Fetch Configuration')
    const fetchButton = wrapper.findAll('button').find((button) => button.text() === 'Fetch Configuration')
    await fetchButton!.trigger('click')
    await flushPromises()
    expect(customFetch).toHaveBeenCalledExactlyOnceWith('https://example.com/metadata')
    wrapper.unmount()
  })

  it('renders the auth selector for an AsyncAPI document with security schemes', () => {
    const wrapper = mountAuth({
      bearerAuth: { type: 'http', scheme: 'bearer' },
    } as unknown as MergedSecuritySchemes)

    expect(wrapper.text()).toContain('Authentication')
  })

  it('renders nothing when the AsyncAPI document has no security schemes', () => {
    const wrapper = mountAuth({})

    expect(wrapper.text()).toBe('')
  })

  it('labels the authentication card as a group rather than a heading', () => {
    const wrapper = mountAuth({
      bearerAuth: { type: 'http', scheme: 'bearer' },
    } as unknown as MergedSecuritySchemes)

    // The card offers controls, it does not open a passage of the reference, so
    // its title belongs in no heading outline.
    expect(wrapper.find('h1, h2, h3, h4, h5, h6').exists()).toBe(false)

    const section = wrapper.get('section')
    expect(section.attributes('role')).toBe('group')
    expect(wrapper.get(`[id="${section.attributes('aria-labelledby')}"]`).text()).toContain('Authentication')
  })
})
