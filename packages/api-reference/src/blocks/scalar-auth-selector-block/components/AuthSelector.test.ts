import type { EnvVariable } from '@scalar/api-client/store'
import { environmentSchema } from '@scalar/oas-utils/entities/environment'
import { type Collection, collectionSchema, requestSchema, serverSchema } from '@scalar/oas-utils/entities/spec'
import { workspaceSchema } from '@scalar/oas-utils/entities/workspace'
import { captureCustomEvent } from '@test/utils/custom-event'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'

import AuthSelector from './AuthSelector.vue'

const selectedSecuritySchemeUids = ref<Collection['selectedSecuritySchemeUids']>([])

// Mock useWorkspace
vi.mock('@scalar/api-client/store', () => ({
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
    },
  }),
  useActiveEntities: () => ({
    activeCollection: computed(() =>
      collectionSchema.parse({
        uid: 'test-collection',
        securitySchemes: ['bearer-auth', 'api-key', 'basic-auth', 'client-id', 'client-key'],
        security: [{ bearerAuth: [] }, { apiKey: [] }, { basicAuth: [] }],
        selectedSecuritySchemeUids: selectedSecuritySchemeUids.value ?? undefined,
      }),
    ),
    activeEnvironment: computed(() =>
      environmentSchema.parse({
        uid: 'test-environment',
      }),
    ),
    activeEnvVariables: computed(() => [] as EnvVariable[]),
    activeWorkspace: computed(() =>
      workspaceSchema.parse({
        uid: 'test-workspace',
        proxyUrl: 'https://proxy.scalar.com',
      }),
    ),
  }),
}))

const createBaseProps = () =>
  ({
    operation: requestSchema.parse({
      uid: 'test-operation',
      security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    }),
    selectedSecuritySchemeUids: [] as Collection['selectedSecuritySchemeUids'],
    server: serverSchema.parse({
      url: 'https://api.example.com',
    }),
    title: 'Authentication',
    layout: 'client',
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

describe('AuthSelector.vue', () => {
  beforeEach(() => {
    selectedSecuritySchemeUids.value = []
  })

  it('renders the basics', async () => {
    const wrapper = mount(AuthSelector, {
      props: createBaseProps(),
    })

    expect(wrapper.text()).toContain('Authentication')
    expect(wrapper.text()).toContain('Required')
    expect(wrapper.text()).toContain('Auth Type')
    expect(wrapper.text()).toContain('No authentication selected')
  })

  it('emit correct event when selecting auth scheme', async () => {
    /** Attach to the body to handle the popover */
    const wrapper = mount(AuthSelector, {
      props: createBaseProps(),
      attachTo: document.body,
    })

    const expectEvent = captureCustomEvent(document.body, 'scalar-select-operation-security-schemes')
    await clickAuthSelect(wrapper)

    // Select a security scheme
    await nextTick()

    const options = document.querySelectorAll('li[role="option"]')
    const bearerAuthOption = Array.from(options).find((option) => option.textContent?.includes('bearerAuth'))

    expect(bearerAuthOption?.textContent).toContain('bearerAuth')

    bearerAuthOption?.dispatchEvent(new Event('click'))
    await nextTick()

    await expectEvent({
      'operationUid': 'test-operation',
      'uids': ['bearer-auth'],
    })
  })

  it('shows optional status when security is optional', async () => {
    const props = createBaseProps()
    props.operation.security = [{}]

    const wrapper = mount(AuthSelector, {
      props,
    })

    expect(wrapper.text()).toContain('Optional')
  })

  it('displays multiple when multiple schemes are selected', async () => {
    const props = createBaseProps()
    selectedSecuritySchemeUids.value = ['bearer-auth', 'api-key'] as Collection['selectedSecuritySchemeUids']

    const wrapper = mount(AuthSelector, {
      props,
      attachTo: document.body,
    })

    expect(wrapper.text()).toContain('Multiple')
    expect(wrapper.text()).toContain('Bearer Token')
  })

  it('handles complex auth requirements with multiple keys', async () => {
    const props = createBaseProps()
    props.operation.security = [{ 'Client ID': [], 'Client Key': [] }, {}]

    const wrapper = mount(AuthSelector, {
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
    const wrapper = mount(AuthSelector, {
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
})
