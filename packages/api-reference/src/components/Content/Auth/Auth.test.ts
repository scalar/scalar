import { apiReferenceConfigurationSchema } from '@scalar/schemas/api-reference'
import { coerce } from '@scalar/validation'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { MergedSecuritySchemes } from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

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

const mountAuth = (securitySchemes: MergedSecuritySchemes, document = asyncApiDocument) =>
  mount(Auth, {
    props: {
      options: config,
      authStore: workspaceStore.auth,
      document,
      eventBus,
      securitySchemes,
      selectedServer: null,
      environment,
    },
  })

describe('Auth (AsyncAPI document)', () => {
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
})
