import { environmentSchema } from '@scalar/oas-utils/entities/environment'
import { type Collection, collectionSchema, requestSchema, serverSchema } from '@scalar/oas-utils/entities/spec'
import { workspaceSchema } from '@scalar/oas-utils/entities/workspace'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import type { EnvVariable } from '@/store/active-entities'

import RequestAuth from './RequestAuth.vue'

const securitySchemeMutators = {
  add: vi.fn(),
  edit: vi.fn(),
}
const requestMutators = {
  edit: vi.fn(),
}
const collectionMutators = {
  edit: vi.fn(),
}

// Mock useWorkspace
vi.mock('@/store/store', () => ({
  useWorkspace: () => ({
    securitySchemes: {
      'bearer-auth': {
        uid: 'bearer-auth',
        type: 'http',
        nameKey: 'bearerAuth',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        username: 'user',
        password: 'pass',
        token: '123456',
      },
      'api-key': {
        uid: 'api-key',
        type: 'apiKey',
        nameKey: 'apiKeyAuth',
        in: 'header',
        value: '123456',
      },
      'basic-auth': {
        uid: 'basic-auth',
        type: 'http',
        scheme: 'basic',
        nameKey: 'basicAuth',
        bearerFormat: 'JWT',
        username: 'user',
        password: 'pass',
        token: '123456',
      },
      'client-id': {
        uid: 'client-id',
        type: 'apiKey',
        nameKey: 'Client ID',
        in: 'header',
        value: 'client123',
      },
      'client-key': {
        uid: 'client-key',
        type: 'apiKey',
        nameKey: 'Client Key',
        in: 'header',
        value: 'key456',
      },
      'oauth2-auth': {
        uid: 'oauth2-auth',
        type: 'oauth2',
        nameKey: 'OAuth2',
        flows: {
          authorizationCode: {
            type: 'authorizationCode',
            authorizationUrl: 'https://auth.example.com/authorize',
            tokenUrl: 'https://auth.example.com/token',
            refreshUrl: 'https://auth.example.com/refresh',
            scopes: {
              read: 'Read access',
              write: 'Write access',
            },
            selectedScopes: ['read'],
            'x-scalar-client-id': 'test-client-id',
            'x-scalar-redirect-uri': 'https://callback.example.com',
            token: '',
          },
        },
      },
    },
    collectionMutators,
    requestMutators,
    securitySchemeMutators,
  }),
}))

describe('RequestAuth.vue', () => {
  const createBaseProps = () =>
    ({
      collection: collectionSchema.parse({
        uid: 'test-collection',
        securitySchemes: ['bearer-auth', 'api-key-auth', 'basic-auth', 'client-id', 'client-key'],
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }, { basicAuth: [] }],
      }),
      operation: requestSchema.parse({
        uid: 'test-operation',
        security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
      }),
      selectedSecuritySchemeUids: [] as Collection['selectedSecuritySchemeUids'],
      server: serverSchema.parse({
        url: 'https://api.example.com',
      }),
      environment: environmentSchema.parse({
        uid: 'test-environment',
      }),
      envVariables: [] as EnvVariable[],
      title: 'Authentication',
      layout: 'client',
      workspace: workspaceSchema.parse({
        uid: 'test-workspace',
        proxyUrl: 'https://proxy.scalar.com',
      }),
    }) as const

  const clickAuthSelect = async (wrapper: VueWrapper) => {
    const dropdownButton = wrapper
      .findAll('button')
      .filter((node) => node.text().includes('Auth Type'))
      .at(0)
    expect(dropdownButton?.text()).toContain('Auth Type')
    await dropdownButton?.trigger('click')
    await nextTick()
  }

  it('renders the basics', async () => {
    const wrapper = mount(RequestAuth, {
      props: createBaseProps(),
    })

    expect(wrapper.text()).toContain('Authentication')
    expect(wrapper.text()).toContain('Required')
    expect(wrapper.text()).toContain('Auth Type')
    expect(wrapper.text()).toContain('No authentication selected')
  })

  it('calls correct mutator when selecting auth scheme', async () => {
    const wrapper = mount(RequestAuth, {
      props: createBaseProps(),
      attachTo: document.body,
    })

    await clickAuthSelect(wrapper)

    // Select a security scheme
    await nextTick()

    const options = document.querySelectorAll('li[role="option"]')
    const bearerAuthOption = Array.from(options).find((option) => option.textContent?.includes('bearerAuth'))

    expect(bearerAuthOption?.textContent).toContain('bearerAuth')

    bearerAuthOption?.dispatchEvent(new Event('click'))
    await nextTick()

    // Verify mutation
    expect(requestMutators.edit).toHaveBeenCalledWith('test-operation', 'selectedSecuritySchemeUids', ['bearer-auth'])
  })

  it('shows optional status when security is optional', async () => {
    const props = createBaseProps()
    props.operation.security = [{}]

    const wrapper = mount(RequestAuth, {
      props,
    })

    expect(wrapper.text()).toContain('Optional')
  })

  it('displays multiple when multiple schemes are selected', async () => {
    const props = {
      ...createBaseProps(),
      selectedSecuritySchemeUids: ['bearer-auth', 'api-key'] as Collection['selectedSecuritySchemeUids'],
    }

    const wrapper = mount(RequestAuth, {
      props,
    })

    expect(wrapper.text()).toContain('Multiple')
    expect(wrapper.text()).toContain('Bearer Token')
  })

  it('handles complex auth requirements with multiple keys', async () => {
    const props = createBaseProps()
    props.operation.security = [{ 'Client ID': [], 'Client Key': [] }, {}]

    const wrapper = mount(RequestAuth, {
      attachTo: document.body,
      props,
    })

    expect(wrapper.text()).toContain('Required')

    await clickAuthSelect(wrapper)

    const options = document.querySelectorAll('li[role="option"]')
    const clientIdOption = Array.from(options).find((option) => option.textContent?.includes('Client ID & Client Key'))

    expect(clientIdOption).toBeDefined()
    expect(clientIdOption?.textContent).toContain('Client ID & Client Key')
  })

  it('opens auth select when auth indicator is clicked', async () => {
    const wrapper = mount(RequestAuth, {
      props: createBaseProps(),
      attachTo: document.body,
    })

    const requiredIndicator = wrapper.findAll('span').find((node) => node.text().includes('Required'))
    await requiredIndicator?.trigger('click')

    const options = document.querySelectorAll('li[role="option"]')
    const bearerAuthOption = Array.from(options).find((option) => option.textContent?.includes('bearerAuth'))

    expect(bearerAuthOption).toBeDefined()
    expect(bearerAuthOption?.textContent).toContain('bearerAuth')
  })

  it('emits authorized event when child component emits it', async () => {
    const props = {
      ...createBaseProps(),
      selectedSecuritySchemeUids: ['oauth2-auth'] as Collection['selectedSecuritySchemeUids'],
    }

    const wrapper = mount(RequestAuth, {
      props,
    })

    // Find the OAuth2 component
    const oauth2 = wrapper.findComponent({ name: 'OAuth2' })
    expect(oauth2.exists()).toBe(true)

    // Emit the authorized event from the child component
    await oauth2.vm.$emit('authorized')

    // Check that the parent component emitted the authorized event
    expect(wrapper.emitted('authorized')).toBeTruthy()
    expect(wrapper.emitted('authorized')).toHaveLength(1)
  })
})
