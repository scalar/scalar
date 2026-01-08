import { createWorkspaceStore } from '@scalar/workspace-store/client'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import 'fake-indexeddb/auto'

import Modal, { type ModalProps } from '@/v2/features/modal/Modal.vue'

import { createApiClientModal } from './create-api-client-modal'

// Mock useFocusTrap - requires a real focusable DOM element which is unavailable in JSDOM tests.
vi.mock('@vueuse/integrations/useFocusTrap', () => ({
  useFocusTrap: () => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
  }),
}))

/** Creates a minimal OpenAPI document for testing */
const createTestDocument = (overrides: Partial<OpenApiDocument> = {}): OpenApiDocument => ({
  openapi: '3.1.0',
  info: { title: 'Test API', version: '1.0.0' },
  'x-scalar-original-document-hash': 'test-hash',
  paths: {
    '/users': {
      get: { summary: 'Get users', operationId: 'getUsers' },
      post: { summary: 'Create user', operationId: 'createUser' },
    },
    '/pets': {
      get: { summary: 'Get pets', operationId: 'getPets' },
    },
  },
  ...overrides,
})

/** Sets up a workspace store with a test document */
const setupWorkspaceStore = async () => {
  const store = createWorkspaceStore()
  await store.addDocument({
    name: 'test-doc',
    document: createTestDocument(),
  })
  store.update('x-scalar-active-document', 'test-doc')
  return store
}

describe('createApiClientModal', () => {
  let mountElement: HTMLElement

  beforeEach(() => {
    // Create a DOM element for mounting.
    mountElement = document.createElement('div')
    mountElement.id = 'test-modal-mount'
    document.body.appendChild(mountElement)
  })

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = ''
  })

  it('creates modal and mounts automatically when mountOnInitialize is true', async () => {
    const workspaceStore = await setupWorkspaceStore()

    const modal = createApiClientModal({
      el: mountElement,
      workspaceStore,
      mountOnInitialize: true,
    })

    // The modal should be mounted immediately when mountOnInitialize is true.
    expect(modal.app).toBeDefined()
    expect(modal.app._instance).not.toBeNull()
    expect(mountElement.innerHTML).not.toBe('')

    modal.app.unmount()
  })

  it('creates modal without mounting when mountOnInitialize is false', async () => {
    const workspaceStore = await setupWorkspaceStore()

    const modal = createApiClientModal({
      el: mountElement,
      workspaceStore,
      mountOnInitialize: false,
    })

    // When mountOnInitialize is false, the modal should be created but not mounted.
    expect(modal.app).toBeDefined()
    expect(modal.app._instance).toBeNull()
    expect(mountElement.innerHTML).toBe('')

    modal.app.unmount()
  })

  it('opens modal and routes to specified operation', async () => {
    const workspaceStore = await setupWorkspaceStore()

    const modal = createApiClientModal({
      el: mountElement,
      workspaceStore,
      mountOnInitialize: true,
    })

    await nextTick()

    modal.open({
      path: '/users',
      method: 'post',
      example: 'default',
    })

    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(modal.modalState.open).toBe(true)

    const wrapper = mount(Modal, {
      attachTo: mountElement,
      props: modal.app._instance?.props as ModalProps,
    })

    const operationBlock = wrapper.findComponent({ name: 'OperationBlock' })
    expect(operationBlock.exists()).toBe(true)
    expect(operationBlock.props('path')).toBe('/users')
    expect(operationBlock.props('method')).toBe('post')
    expect(operationBlock.props('exampleKey')).toBe('default')

    wrapper.unmount()
    modal.app.unmount()
  })

  it('reacts to changes in options.authentication', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createTestDocument({
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              name: 'X-API-Key',
              in: 'header',
              'x-scalar-secret-token': '',
            },
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              'x-scalar-secret-token': '',
              'x-scalar-secret-username': '',
              'x-scalar-secret-password': '',
            },
          },
        },
      }),
    })
    store.update('x-scalar-active-document', 'test-doc')

    const options = ref({
      authentication: {
        securitySchemes: {
          oauth2: {
            type: 'oauth2' as const,
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://example.com/oauth/authorize',
                tokenUrl: 'https://example.com/oauth/token',
                scopes: {
                  'read:users': 'Read user data',
                  'write:users': 'Write user data',
                },
              },
            },
          },
        },
      },
    })

    const modal = createApiClientModal({
      el: mountElement,
      workspaceStore: store,
      mountOnInitialize: true,
      options,
    })

    modal.open({
      path: '/users',
      method: 'get',
      example: 'default',
    })

    await nextTick()

    const wrapper = mount(Modal, {
      attachTo: mountElement,
      props: modal.app._instance?.props as ModalProps,
    })

    const operationBlock = wrapper.findComponent({ name: 'OperationBlock' })

    // Verify the OperationBlock exists and receives the merged security schemes
    expect(operationBlock.exists()).toBe(true)
    const securitySchemes = operationBlock.props('securitySchemes')

    // Verify that document security schemes are present
    expect(securitySchemes).toHaveProperty('apiKey')
    expect(securitySchemes.apiKey).toMatchObject({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
    })
    expect(securitySchemes).toHaveProperty('bearerAuth')
    expect(securitySchemes.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    })

    // Verify that config security schemes are merged in.
    expect(securitySchemes).toHaveProperty('oauth2')
    expect(securitySchemes.oauth2).toMatchObject({
      type: 'oauth2',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read:users': 'Read user data',
            'write:users': 'Write user data',
          },
        },
      },
    })

    // Now lets check the reactivity
    options.value.authentication.securitySchemes.oauth2.flows.authorizationCode.authorizationUrl =
      'https://new-auth.test'
    await nextTick()
    expect(operationBlock.props('securitySchemes')).toHaveProperty('oauth2')
    expect(operationBlock.props('securitySchemes').oauth2).toMatchObject({
      flows: {
        authorizationCode: { authorizationUrl: 'https://new-auth.test' },
      },
    })

    wrapper.unmount()
    modal.app.unmount()
  })
})
