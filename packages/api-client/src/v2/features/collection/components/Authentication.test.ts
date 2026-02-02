import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import Authentication from './Authentication.vue'

describe('Authentication', () => {
  const baseDocument = {
    'x-scalar-set-operation-security': true,
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
    uid: 'env-1',
    name: 'Default',
    color: '#FFFFFF',
    value: '',
    isDefault: true,
  }

  const mountWithProps = (
    custom: Partial<{
      document: any
      environment: any
    }> = {},
  ) => {
    const document = custom.document ?? baseDocument
    const environment = custom.environment ?? baseEnvironment
    const eventBus = createWorkspaceEventBus()
    const workspaceStore = createWorkspaceStore()

    /**
     * Set up the workspace store with the selected security from the document.
     * This mimics how the store would be populated in the actual application.
     */
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
          document,
          environment,
          eventBus,
          layout: 'web',
          securitySchemes: document.components?.securitySchemes ?? {},
          workspaceStore,
          collectionType: 'document',
          documentSlug: 'test-document',
          activeWorkspace: {
            id: 'test-workspace',
            label: 'Test Workspace',
          },
          plugins: [],
        },
      }),
      eventBus,
    }
  }

  it('emits document:toggle:document-security event when toggle is clicked', async () => {
    const { wrapper, eventBus } = mountWithProps()
    const emitSpy = vi.spyOn(eventBus, 'emit')

    const toggle = wrapper.findComponent({ name: 'ScalarToggle' })
    await toggle.vm.$emit('update:modelValue', false)
    await nextTick()

    expect(emitSpy).toHaveBeenCalledWith('document:toggle:security')
  })

  it('passes correct props to AuthSelector when document security is enabled', () => {
    const { wrapper } = mountWithProps()

    const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
    expect(authSelector.exists()).toBe(true)

    const props = authSelector.props()
    expect(props.environment).toEqual(baseEnvironment)
    expect(props.isStatic).toBe(true)
    expect(props.meta).toEqual({ type: 'document' })
    expect(props.securityRequirements).toEqual([{ BearerAuth: [] }])
    expect(props.securitySchemes).toEqual(baseDocument.components.securitySchemes)
    expect(props.selectedSecurity).toEqual({
      selectedIndex: 0,
      selectedSchemes: [{ BearerAuth: [] }],
    })
    expect(props.title).toBe('Authentication')
  })

  it('applies disabled styles to AuthSelector when document security is disabled', () => {
    const { wrapper } = mountWithProps({
      document: {
        ...baseDocument,
        'x-scalar-set-operation-security': false,
      },
    })

    const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
    const authSelectorElement = authSelector.element as HTMLElement

    /**
     * When document security is disabled, the AuthSelector should have
     * pointer-events-none, opacity-50, and mix-blend-luminosity classes.
     */
    expect(authSelectorElement.classList.contains('pointer-events-none')).toBe(true)
    expect(authSelectorElement.classList.contains('opacity-50')).toBe(true)
    expect(authSelectorElement.classList.contains('mix-blend-luminosity')).toBe(true)

    /**
     * The parent wrapper should have cursor-not-allowed class.
     */
    const authWrapper = wrapper.find('.cursor-not-allowed')
    expect(authWrapper.exists()).toBe(true)
  })

  it('computes correct server from selected server URL', () => {
    const { wrapper } = mountWithProps()

    const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
    const serverProp = authSelector.props('server')

    /**
     * The server prop should match the server with the URL
     * that matches x-scalar-selected-server.
     */
    expect(serverProp).toEqual({
      url: 'https://api.example.com',
      description: 'Production Server',
    })
  })

  it('handles missing security and securitySchemes gracefully', () => {
    const { wrapper } = mountWithProps({
      document: {
        ...baseDocument,
        security: undefined,
        components: undefined,
      },
    })

    const authSelector = wrapper.findComponent({ name: 'AuthSelector' })
    expect(authSelector.exists()).toBe(true)

    const props = authSelector.props()

    /**
     * When security and components are missing, the component should
     * pass empty arrays/objects as defaults to prevent errors.
     */
    expect(props.securityRequirements).toEqual([])
    expect(props.securitySchemes).toEqual({})
  })
})
