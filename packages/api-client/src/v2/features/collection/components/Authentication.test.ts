import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import type { MergedSecuritySchemes } from '@/v2/blocks/scalar-auth-selector-block'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'

import Authentication from './Authentication.vue'

const baseDocument = {
  'x-scalar-selected-server': 'https://api.example.com',
  openapi: '3.1.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
  },
  'x-scalar-original-document-hash': '123',
  servers: [
    {
      url: 'https://api.example.com',
      description: 'Production Server',
    },
    {
      url: 'https://staging.example.com',
      description: 'Staging Server',
    },
  ],
  security: [{ BearerAuth: [] }],
  paths: {
    '/pets': {
      get: {
        operationId: 'getPets',
        security: [{ ApiKeyAuth: [] }],
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
  },
} satisfies WorkspaceDocument

const baseEnvironment = {
  description: 'Default environment',
  color: '#FFFFFF',
  variables: [],
} satisfies XScalarEnvironment

const defaultProps = {
  document: baseDocument,
  environment: baseEnvironment,
  eventBus: createWorkspaceEventBus(),
  workspaceStore: createWorkspaceStore(),
  layout: 'web' as const,
  securitySchemes: (baseDocument.components?.securitySchemes ?? {}) as unknown as MergedSecuritySchemes,
  documentSlug: 'test-document',
  activeWorkspace: {
    id: 'test-workspace',
    label: 'Test Workspace',
  },
  plugins: [],
}

const mountWithProps = (
  custom: Partial<{
    document: WorkspaceDocument | null
    environment: typeof baseEnvironment
    collectionType: 'document' | 'operation'
    path: string
    method: string
  }> = {},
) => {
  const document = custom.document ?? baseDocument
  const environment = custom.environment ?? baseEnvironment
  const eventBus = createWorkspaceEventBus()
  const workspaceStore = createWorkspaceStore()

  workspaceStore.auth.setAuthSelectedSchemas(
    { type: 'document', documentName: 'test-document' },
    {
      selectedIndex: 0,
      selectedSchemes: [{ BearerAuth: [] }],
    },
  )

  return {
    wrapper: mount(Authentication, {
      props: {
        ...defaultProps,
        document,
        environment,
        eventBus,
        workspaceStore,
        securitySchemes: (document?.components?.securitySchemes ?? {}) as unknown as MergedSecuritySchemes,
        collectionType: custom.collectionType ?? 'document',
        path: custom.path,
        method: (custom.method ?? 'get') as HttpMethod | undefined,
      },
    }),
    eventBus,
    workspaceStore,
  }
}

describe('document collection', () => {
  it('does not show operation security toggle', () => {
    const { wrapper } = mountWithProps({ collectionType: 'document' })

    const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
    expect(toggle.exists()).toBe(false)
  })

  it('passes correct props to AuthSelector', () => {
    const { wrapper } = mountWithProps({ collectionType: 'document' })

    const authSelector = wrapper.findComponent(AuthSelector)
    expect(authSelector.exists()).toBe(true)

    const props = authSelector.props()
    expect(props.environment).toEqual(baseEnvironment)
    expect(props.isStatic).toBe(true)
    expect(props.meta).toEqual({ type: 'document' })
    expect(props.securityRequirements).toEqual([{ BearerAuth: [] }])
    expect(props.securitySchemes).toEqual(baseDocument.components?.securitySchemes)
    expect(props.selectedSecurity).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ BearerAuth: [] }],
    })
    expect(props.title).toBe('Authentication')
  })

  it('does not apply disabled styles to AuthSelector', () => {
    const { wrapper } = mountWithProps({ collectionType: 'document' })

    const authSelector = wrapper.findComponent(AuthSelector)
    const authSelectorElement = authSelector.element as HTMLElement

    expect(authSelectorElement.classList.contains('pointer-events-none')).toBe(false)
    expect(authSelectorElement.classList.contains('opacity-50')).toBe(false)
    expect(wrapper.find('.cursor-not-allowed').exists()).toBe(false)
  })

  it('computes correct server from selected server URL', () => {
    const { wrapper } = mountWithProps({ collectionType: 'document' })

    const authSelector = wrapper.findComponent(AuthSelector)
    const serverProp = authSelector.props('server')

    expect(serverProp).toEqual({
      url: 'https://api.example.com',
      description: 'Production Server',
    })
  })

  it('handles missing security and securitySchemes gracefully', () => {
    const { wrapper } = mountWithProps({
      collectionType: 'document',
      document: {
        ...baseDocument,
        security: undefined,
        components: undefined,
      } as WorkspaceDocument,
    })

    const authSelector = wrapper.findComponent(AuthSelector)
    expect(authSelector.exists()).toBe(true)

    const props = authSelector.props()
    expect(props.securityRequirements).toEqual([])
    expect(props.securitySchemes).toEqual({})
  })
})

describe('operation collection', () => {
  it('shows operation security toggle', () => {
    const { wrapper } = mountWithProps({
      collectionType: 'operation',
      path: '/pets',
      method: 'get',
    })

    const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
    expect(toggle.exists()).toBe(true)
  })

  it('emits auth:update:selected-security-schemes when toggle is turned on', async () => {
    const { wrapper, eventBus } = mountWithProps({
      collectionType: 'operation',
      path: '/pets',
      method: 'get',
    })
    const fn = vi.fn()
    eventBus.on('auth:update:selected-security-schemes', fn)

    const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
    await toggle.vm.$emit('update:modelValue', true)
    await nextTick()

    expect(fn).toHaveBeenCalledWith({
      selectedRequirements: [],
      newSchemes: [],
      meta: {
        type: 'operation',
        path: '/pets',
        method: 'get',
      },
    })
  })

  it('emits auth:clear:selected-security-schemes when toggle is turned off', async () => {
    const { wrapper, workspaceStore, eventBus } = mountWithProps({
      collectionType: 'operation',
      path: '/pets',
      method: 'get',
    })
    workspaceStore.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName: 'test-document', path: '/pets', method: 'get' },
      { selectedIndex: 0, selectedSchemes: [{ ApiKeyAuth: [] }] },
    )
    const fn = vi.fn()
    eventBus.on('auth:clear:selected-security-schemes', fn)

    const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
    await toggle.vm.$emit('update:modelValue', false)
    await nextTick()

    expect(fn).toHaveBeenCalledWith({
      meta: {
        type: 'operation',
        path: '/pets',
        method: 'get',
      },
    })
  })

  it('passes operation-level meta and securityRequirements to AuthSelector', () => {
    const { wrapper } = mountWithProps({
      collectionType: 'operation',
      path: '/pets',
      method: 'get',
    })

    const authSelector = wrapper.findComponent(AuthSelector)
    const props = authSelector.props()

    expect(props.meta).toEqual({
      type: 'operation',
      path: '/pets',
      method: 'get',
    })
    expect(props.securityRequirements).toEqual([{ ApiKeyAuth: [] }])
  })

  it('applies disabled styles to AuthSelector when operation security is off', () => {
    const { wrapper } = mountWithProps({
      collectionType: 'operation',
      path: '/pets',
      method: 'get',
    })

    const authSelector = wrapper.findComponent(AuthSelector)
    const authSelectorElement = authSelector.element as HTMLElement

    expect(authSelectorElement.classList.contains('pointer-events-none')).toBe(true)
    expect(authSelectorElement.classList.contains('opacity-50')).toBe(true)
    expect(authSelectorElement.classList.contains('mix-blend-luminosity')).toBe(true)

    const authWrapper = wrapper.find('.cursor-not-allowed')
    expect(authWrapper.exists()).toBe(true)
  })

  it('does not apply disabled styles when operation-level auth is set in store', () => {
    const workspaceStore = createWorkspaceStore()
    workspaceStore.auth.setAuthSelectedSchemas(
      { type: 'document', documentName: 'test-document' },
      { selectedIndex: 0, selectedSchemes: [{ BearerAuth: [] }] },
    )
    workspaceStore.auth.setAuthSelectedSchemas(
      { type: 'operation', documentName: 'test-document', path: '/pets', method: 'get' },
      { selectedIndex: 0, selectedSchemes: [{ ApiKeyAuth: [] }] },
    )

    const wrapper = mount(Authentication, {
      props: {
        ...defaultProps,
        document: baseDocument,
        environment: baseEnvironment,
        eventBus: createWorkspaceEventBus(),
        workspaceStore,
        securitySchemes: (baseDocument.components?.securitySchemes ?? {}) as unknown as MergedSecuritySchemes,
        collectionType: 'operation',
        path: '/pets',
        method: 'get' as HttpMethod,
      },
    })

    const authSelector = wrapper.findComponent(AuthSelector)
    const authSelectorElement = authSelector.element as HTMLElement

    expect(authSelectorElement.classList.contains('pointer-events-none')).toBe(false)
    expect(authSelectorElement.classList.contains('opacity-50')).toBe(false)
  })
})
