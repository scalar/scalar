import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createMockSidebar, createMockStore } from '@/helpers/test-utils'

import Operation from './Operation.vue'
import { collectionSchema } from '@scalar/oas-utils/entities/spec'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/schemas/workspace'
import { enableConsoleError, enableConsoleWarn } from '@scalar/helpers/testing/console-spies'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

// Mock the workspace store
vi.mock('@scalar/api-client/store', () => ({
  useWorkspace: () => ({
    securitySchemes: [],
  }),
}))

// Mock the discriminator hook
vi.mock('@/hooks/useOperationDiscriminator', () => ({
  useOperationDiscriminator: () => ({
    handleDiscriminatorChange: vi.fn(),
  }),
}))

// Mock the sidebar provider
vi.mock('@/features/sidebar/hooks/useSidebar', () => ({
  useSidebar: () => createMockSidebar({}),
}))

const clientOptions = [
  {
    label: 'Curl',
    options: [
      {
        id: 'shell/curl',
        label: 'Curl',
        lang: 'shell',
        title: 'Curl',
        targetKey: 'shell',
        targetTitle: 'Shell',
        clientKey: 'curl',
      },
    ],
  },
] as ClientOptionGroup[]

describe('Operation', () => {
  beforeEach(() => {
    enableConsoleWarn()
    enableConsoleError()
  })

  const mockCollection = collectionSchema.parse({})

  const createMockDocument = (): WorkspaceDocument => ({
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {
      '/users/{userId}': {
        parameters: [
          {
            in: 'path',
            name: 'userId',
            schema: {
              type: 'string',
            },
            required: true,
            deprecated: false,
          },
        ],
        get: {
          summary: 'Get user by ID',
          parameters: [
            {
              in: 'query',
              name: 'include',
              schema: {
                type: 'string',
              },
              required: false,
              deprecated: false,
            },
          ],
        },
      },
    },
    components: {
      schemas: {},
    },
  })

  it('renders path parameters from pathItem parameters', () => {
    const wrapper = mount(Operation, {
      props: {
        id: 'test-operation',
        path: '/users/{userId}',
        method: 'get',
        clientOptions,
        isWebhook: false,
        layout: 'modern',
        server: undefined,
        store: createMockStore(createMockDocument()),
        collection: mockCollection,
        document: createMockDocument(),
      },
    })

    // Check that the component renders
    expect(wrapper.exists()).toBe(true)

    // Get the ModernLayout component and check its parameters prop
    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    expect(modernLayout.exists()).toBe(true)

    // The parameters should include both path and query parameters
    const operation = modernLayout.props('operation')
    expect(operation.parameters).toHaveLength(2)

    // Check that path parameters are included
    const pathParameters = operation.parameters.filter((p: any) => p.in === 'path')
    expect(pathParameters).toHaveLength(1)
    expect(pathParameters[0].name).toBe('userId')
    expect(pathParameters[0].required).toBe(true)

    // Check that query parameters are included
    const queryParameters = operation.parameters.filter((p: any) => p.in === 'query')
    expect(queryParameters).toHaveLength(1)
    expect(queryParameters[0].name).toBe('include')
    expect(queryParameters[0].required).toBe(false)
  })

  it('renders path parameters from operation parameters only when no pathItem parameters', () => {
    const documentWithOnlyOperationParams = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users/{userId}': {
          get: {
            summary: 'Get user by ID',
            parameters: [
              {
                in: 'path',
                name: 'userId',
                schema: {
                  type: 'string',
                },
                required: true,
                deprecated: false,
              },
            ],
          },
        },
      },
      components: {
        schemas: {},
      },
    } as WorkspaceDocument

    const storeWithOnlyOperationParams = createMockStore(documentWithOnlyOperationParams)

    const wrapper = mount(Operation, {
      props: {
        id: 'test-operation',
        path: '/users/{userId}',
        method: 'get',
        clientOptions,
        isWebhook: false,
        layout: 'modern',
        server: undefined,
        store: storeWithOnlyOperationParams,
        collection: mockCollection,
        document: documentWithOnlyOperationParams,
      },
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    const operation = modernLayout.props('operation')

    // Should have one path parameter
    expect(operation.parameters).toHaveLength(1)
    expect(operation.parameters[0].in).toBe('path')
    expect(operation.parameters[0].name).toBe('userId')
  })

  it('handles webhook path parameters correctly', () => {
    const documentWithWebhooks = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      webhooks: {
        '/webhook/user-updated': {
          parameters: [
            {
              in: 'path',
              name: 'webhookId',
              schema: {
                type: 'string',
              },
              required: true,
              deprecated: false,
            },
          ],
          post: {
            summary: 'User updated webhook',
          },
        },
      },
    } as WorkspaceDocument

    const storeWithWebhooks = createMockStore(documentWithWebhooks)

    const wrapper = mount(Operation, {
      props: {
        id: 'test-webhook',
        path: '/webhook/user-updated',
        method: 'post',
        clientOptions,
        isWebhook: true,
        layout: 'modern',
        server: undefined,
        store: storeWithWebhooks,
        collection: mockCollection,
        document: documentWithWebhooks,
      },
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    const operation = modernLayout.props('operation')

    // Should have one path parameter from webhook
    expect(operation.parameters).toHaveLength(1)
    expect(operation.parameters[0].in).toBe('path')
    expect(operation.parameters[0].name).toBe('webhookId')
  })

  it('filters out unresolved references from parameters', () => {
    const documentWithRefs = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users/{userId}': {
          parameters: [
            {
              $ref: '#/components/parameters/UserId',
            },
            {
              in: 'path',
              name: 'userId',
              schema: {
                type: 'string',
              },
              required: true,
              deprecated: false,
            },
          ],
          get: {
            summary: 'Get user by ID',
          },
        },
      },
    } as WorkspaceDocument

    const storeWithRefs = createMockStore(documentWithRefs)

    const wrapper = mount(Operation, {
      props: {
        id: 'test-operation',
        path: '/users/{userId}',
        method: 'get',
        clientOptions,
        isWebhook: false,
        layout: 'modern',
        server: undefined,
        store: storeWithRefs,
        collection: mockCollection,
        document: documentWithRefs,
      },
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    const operation = modernLayout.props('operation')

    // Should only have the resolved parameter, not the $ref
    expect(operation.parameters).toHaveLength(1)
    expect(operation.parameters[0].name).toBe('userId')
    expect(operation.parameters[0].$ref).toBeUndefined()
  })

  it('overrides path parameters with operation parameters of the same name', () => {
    const documentWithOverridingParams = {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users/{userId}': {
          parameters: [
            {
              in: 'path',
              name: 'userId',
              schema: {
                type: 'string',
              },
              required: true,
              deprecated: false,
              description: 'Path parameter description',
            },
            {
              in: 'query',
              name: 'include',
              schema: {
                type: 'string',
              },
              required: false,
              deprecated: false,
              description: 'Path query parameter',
            },
          ],
          get: {
            summary: 'Get user by ID',
            parameters: [
              {
                in: 'path',
                name: 'userId',
                schema: {
                  type: 'string',
                },
                required: false,
                deprecated: true,
                description: 'Operation parameter description - should override',
              },
              {
                in: 'query',
                name: 'include',
                schema: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                required: true,
                deprecated: false,
                description: 'Operation query parameter - should override',
              },
            ],
          },
        },
      },
      components: {
        schemas: {},
      },
    } as WorkspaceDocument

    const storeWithOverridingParams = createMockStore(documentWithOverridingParams)

    const wrapper = mount(Operation, {
      props: {
        id: 'test-operation',
        path: '/users/{userId}',
        method: 'get',
        clientOptions,
        isWebhook: false,
        layout: 'modern',
        server: undefined,
        store: storeWithOverridingParams,
        collection: mockCollection,
        document: documentWithOverridingParams,
      },
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    const operation = modernLayout.props('operation')

    // Should have 2 parameters (path and query)
    expect(operation.parameters).toHaveLength(2)

    // Check that the path parameter is overridden by operation parameter
    const pathParameter = operation.parameters.find((p: any) => p.in === 'path' && p.name === 'userId')
    expect(pathParameter).toBeDefined()
    expect(pathParameter.required).toBe(false) // Overridden from true
    expect(pathParameter.deprecated).toBe(true) // Overridden from false
    expect(pathParameter.description).toBe('Operation parameter description - should override')

    // Check that the query parameter is overridden by operation parameter
    const queryParameter = operation.parameters.find((p: any) => p.in === 'query' && p.name === 'include')
    expect(queryParameter).toBeDefined()
    expect(queryParameter.required).toBe(true) // Overridden from false
    expect(queryParameter.schema.type).toBe('array') // Overridden from string
    expect(queryParameter.description).toBe('Operation query parameter - should override')
  })

  it('renders classic layout when specified', () => {
    const wrapper = mount(Operation, {
      props: {
        id: 'test-operation',
        path: '/users/{userId}',
        method: 'get',
        clientOptions,
        isWebhook: false,
        layout: 'classic',
        server: undefined,
        store: createMockStore(createMockDocument() as WorkspaceDocument),
        collection: mockCollection,
        document: createMockDocument(),
      },
    })

    // Should render ClassicLayout instead of ModernLayout
    const classicLayout = wrapper.findComponent({ name: 'ClassicLayout' })
    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })

    expect(classicLayout.exists()).toBe(true)
    expect(modernLayout.exists()).toBe(false)

    // Check that parameters are passed correctly
    const operation = classicLayout.props('operation')
    expect(operation.parameters).toHaveLength(2)

    const pathParameters = operation.parameters.filter((p: any) => p.in === 'path')
    expect(pathParameters).toHaveLength(1)
    expect(pathParameters[0].name).toBe('userId')
  })

  it('does not render when operation is not available', () => {
    const storeWithoutOperation: WorkspaceStore = {
      workspace: {
        documents: {},
        activeDocument: {
          openapi: '3.1.0',
          info: {
            title: 'Test API',
            version: '1.0.0',
          },
          paths: {
            '/users/{userId}': {
              // No get operation
            },
          },
        },
      },
      update: vi.fn(),
      updateDocument: vi.fn(),
      resolve: vi.fn(),
      addDocument: vi.fn(),
      config: {} as any,
      exportDocument: vi.fn(),
      saveDocument: vi.fn(),
      revertDocumentChanges: vi.fn(),
      commitDocument: vi.fn(),
      exportWorkspace: vi.fn(),
      loadWorkspace: vi.fn(),
      importWorkspaceFromSpecification: vi.fn(),
      replaceDocument: vi.fn(),
      rebaseDocument: vi.fn(),
    }

    const wrapper = mount(Operation, {
      props: {
        id: 'test-operation',
        path: '/users/{userId}',
        method: 'get',
        clientOptions,
        isWebhook: false,
        layout: 'modern',
        server: undefined,
        store: storeWithoutOperation,
        collection: mockCollection,
        document: {} as WorkspaceDocument,
      },
    })

    // Should not render anything when operation is not available
    expect(wrapper.html()).toBe('<!--v-if-->')
  })
})
