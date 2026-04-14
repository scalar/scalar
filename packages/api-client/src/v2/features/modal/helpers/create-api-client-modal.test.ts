import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { App } from 'vue'
import { nextTick, ref } from 'vue'

import 'fake-indexeddb/auto'

import { deepClone } from '@scalar/workspace-store/helpers/deep-clone'

import Modal, { type ModalProps } from '@/v2/features/modal/Modal.vue'

import { createApiClientModal } from './create-api-client-modal'

enableAutoUnmount(afterEach)

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

/** Creates an event bus with debug disabled to prevent pending setTimeout in tests */
const createTestEventBus = () => createWorkspaceEventBus({ debug: false })

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
  /** Track Vue apps created in tests to ensure proper cleanup */
  const createdApps: App[] = []

  beforeEach(() => {
    // Create a DOM element for mounting.
    mountElement = document.createElement('div')
    mountElement.id = 'test-modal-mount'
    document.body.appendChild(mountElement)
  })

  afterEach(() => {
    // Unmount any Vue apps created during tests to prevent pending async operations
    for (const app of createdApps) {
      try {
        app.unmount()
      } catch {
        // Ignore unmount errors - app may already be unmounted
      }
    }
    createdApps.length = 0

    // Clean up DOM
    document.body.innerHTML = ''
  })

  it('creates modal and mounts automatically when mountOnInitialize is true', async () => {
    const workspaceStore = await setupWorkspaceStore()

    const modal = createApiClientModal({
      el: mountElement,
      workspaceStore,
      mountOnInitialize: true,
      eventBus: createTestEventBus(),
    })
    createdApps.push(modal.app)

    // The modal should be mounted immediately when mountOnInitialize is true.
    expect(modal.app).toBeDefined()
    expect(modal.app._instance).not.toBeNull()
    expect(mountElement.innerHTML).not.toBe('')
  })

  it('creates modal without mounting when mountOnInitialize is false', async () => {
    const workspaceStore = await setupWorkspaceStore()

    const modal = createApiClientModal({
      el: mountElement,
      workspaceStore,
      mountOnInitialize: false,
      eventBus: createTestEventBus(),
    })
    createdApps.push(modal.app)

    // When mountOnInitialize is false, the modal should be created but not mounted.
    expect(modal.app).toBeDefined()
    expect(modal.app._instance).toBeNull()
    expect(mountElement.innerHTML).toBe('')
  })

  it('opens modal and routes to specified operation', async () => {
    const workspaceStore = await setupWorkspaceStore()

    const modal = createApiClientModal({
      el: mountElement,
      workspaceStore,
      mountOnInitialize: true,
      eventBus: createTestEventBus(),
    })
    createdApps.push(modal.app)

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
  })

  it('applies request body composition selection from the open-client-modal event', async () => {
    const workspaceStore = await setupWorkspaceStore()
    const eventBus = createWorkspaceEventBus()

    const modal = createApiClientModal({
      el: mountElement,
      eventBus,
      workspaceStore,
      mountOnInitialize: true,
    })

    await nextTick()

    eventBus.emit('ui:open:client-modal', {
      method: 'post',
      path: '/users',
      requestBodyCompositionSelection: {
        anyOf: 1,
        'payload.transform.oneOf': 0,
      },
    } as never)

    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    const wrapper = mount(Modal, {
      attachTo: mountElement,
      props: modal.app._instance?.props as ModalProps,
    })

    const operationBlock = wrapper.findComponent({ name: 'OperationBlock' })
    expect(operationBlock.exists()).toBe(true)
    expect(operationBlock.props('requestBodyCompositionSelection')).toEqual({
      anyOf: 1,
      'payload.transform.oneOf': 0,
    })
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
            },
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
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
      eventBus: createTestEventBus(),
    })
    createdApps.push(modal.app)

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
  })

  it('reacts when the options ref value is replaced', async () => {
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
      eventBus: createTestEventBus(),
    })
    createdApps.push(modal.app)

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
    expect(operationBlock.exists()).toBe(true)

    options.value = {
      authentication: {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://updated-auth.test',
                tokenUrl: 'https://updated-token.test',
                scopes: {
                  'read:users': 'Read user data',
                  'write:users': 'Write user data',
                },
              },
            },
          },
        },
      },
    }
    await nextTick()

    expect(operationBlock.props('securitySchemes').oauth2).toMatchObject({
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://updated-auth.test',
          tokenUrl: 'https://updated-token.test',
          scopes: {
            'read:users': 'Read user data',
            'write:users': 'Write user data',
          },
        },
      },
    })
  })

  it('reacts when updateOptions merges new authentication settings', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createTestDocument(),
    })
    store.update('x-scalar-active-document', 'test-doc')

    const modal = createApiClientModal({
      el: mountElement,
      workspaceStore: store,
      mountOnInitialize: true,
      options: {
        authentication: {
          securitySchemes: {
            oauth2: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://initial-auth.test',
                  tokenUrl: 'https://initial-token.test',
                  scopes: {
                    'read:users': 'Read user data',
                  },
                },
              },
            },
          },
        },
      },
      eventBus: createTestEventBus(),
    })
    createdApps.push(modal.app)

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
    expect(operationBlock.exists()).toBe(true)

    expect(operationBlock.props('securitySchemes').oauth2).toMatchObject({
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://initial-auth.test',
        },
      },
    })

    modal.updateOptions({
      authentication: {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: 'https://merged-auth.test',
                tokenUrl: 'https://merged-token.test',
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
    await nextTick()

    expect(operationBlock.props('securitySchemes').oauth2).toMatchObject({
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://merged-auth.test',
          tokenUrl: 'https://merged-token.test',
          scopes: {
            'read:users': 'Read user data',
            'write:users': 'Write user data',
          },
        },
      },
    })
  })

  it('reacts when updateOptions overwrites previous authentication settings', async () => {
    const store = createWorkspaceStore()
    await store.addDocument({
      name: 'test-doc',
      document: createTestDocument(),
    })
    store.update('x-scalar-active-document', 'test-doc')

    const modal = createApiClientModal({
      el: mountElement,
      workspaceStore: store,
      mountOnInitialize: true,
      options: {
        authentication: {
          securitySchemes: {
            oauth2: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://initial-auth.test',
                  tokenUrl: 'https://initial-token.test',
                  scopes: {
                    'read:users': 'Read user data',
                  },
                },
              },
            },
          },
        },
      },
      eventBus: createTestEventBus(),
    })
    createdApps.push(modal.app)

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
    expect(operationBlock.exists()).toBe(true)

    expect(operationBlock.props('securitySchemes').oauth2).toMatchObject({
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://initial-auth.test',
        },
      },
    })

    modal.updateOptions(
      {
        authentication: {
          securitySchemes: {
            oauth2: {
              type: 'oauth2',
              flows: {
                authorizationCode: {
                  authorizationUrl: 'https://overwrite-auth.test',
                  tokenUrl: 'https://overwrite-token.test',
                  scopes: {
                    'admin:users': 'Admin users',
                  },
                },
              },
            },
          },
        },
      },
      true,
    )
    await nextTick()

    expect(operationBlock.props('securitySchemes').oauth2).toMatchObject({
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://overwrite-auth.test',
          tokenUrl: 'https://overwrite-token.test',
          scopes: {
            'admin:users': 'Admin users',
          },
        },
      },
    })
  })

  it('keeps the changes when the modal closes', async () => {
    const workspaceStore = await setupWorkspaceStore()

    const modal = createApiClientModal({
      el: mountElement,
      workspaceStore,
      mountOnInitialize: true,
      eventBus: createTestEventBus(),
    })
    createdApps.push(modal.app)

    modal.open({
      path: '/users',
      method: 'get',
      example: 'default',
    })

    await nextTick()

    // Get the active document
    const documentSlug = workspaceStore.workspace['x-scalar-active-document']
    const document = workspaceStore.workspace.documents[documentSlug || '']
    expect(document).toBeDefined()

    const snapshot = deepClone(document)

    // Modify the document while modal is open
    document!.info.title = 'Modified Title'
    document!.info.version = '2.0.0'

    // Also modify servers (should be preserved)
    document!.servers = [{ url: 'https://api.example.com', description: 'Production server' }]

    await nextTick()

    // Close the modal
    modal.modalState.open = false
    await nextTick()

    // Get the document again
    const restoredDocument = workspaceStore.workspace.documents[documentSlug || '']
    expect(restoredDocument).toBeDefined()

    expect(restoredDocument).toEqual({
      ...snapshot,
      info: {
        title: 'Modified Title',
        version: '2.0.0',
      },
      servers: [{ url: 'https://api.example.com', description: 'Production server' }],
      'x-scalar-is-dirty': true,
    })
  })
})
