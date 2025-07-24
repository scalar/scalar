import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createMockSidebar, createMockStore } from '@/helpers/test-utils'

import Operation from './Operation.vue'
import { collectionSchema } from '@scalar/oas-utils/entities/spec'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/schemas/workspace'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

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

describe('Operation', () => {
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
        clientOptions: [],
        isWebhook: false,
        layout: 'modern',
        server: undefined,
        store: createMockStore(createMockDocument()),
        collection: mockCollection,
        document: createMockDocument() as OpenAPIV3_1.Document,
      },
    })

    // Check that the component renders
    expect(wrapper.exists()).toBe(true)

    // Get the ModernLayout component and check its parameters prop
    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    expect(modernLayout.exists()).toBe(true)

    // The parameters should include both path and query parameters
    const parameters = modernLayout.props('parameters')
    expect(parameters).toHaveLength(2)

    // Check that path parameters are included
    const pathParameters = parameters.filter((p: any) => p.in === 'path')
    expect(pathParameters).toHaveLength(1)
    expect(pathParameters[0].name).toBe('userId')
    expect(pathParameters[0].required).toBe(true)

    // Check that query parameters are included
    const queryParameters = parameters.filter((p: any) => p.in === 'query')
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
    }

    const storeWithOnlyOperationParams = createMockStore(documentWithOnlyOperationParams as WorkspaceDocument)

    const wrapper = mount(Operation, {
      props: {
        id: 'test-operation',
        path: '/users/{userId}',
        method: 'get',
        clientOptions: [],
        isWebhook: false,
        layout: 'modern',
        server: undefined,
        store: storeWithOnlyOperationParams,
        collection: mockCollection,
        document: documentWithOnlyOperationParams as OpenAPIV3_1.Document,
      },
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    const parameters = modernLayout.props('parameters')

    // Should have one path parameter
    expect(parameters).toHaveLength(1)
    expect(parameters[0].in).toBe('path')
    expect(parameters[0].name).toBe('userId')
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
    }

    const storeWithWebhooks = createMockStore(documentWithWebhooks as WorkspaceDocument)

    const wrapper = mount(Operation, {
      props: {
        id: 'test-webhook',
        path: '/webhook/user-updated',
        method: 'post',
        clientOptions: [],
        isWebhook: true,
        layout: 'modern',
        server: undefined,
        store: storeWithWebhooks,
        collection: mockCollection,
        document: documentWithWebhooks as OpenAPIV3_1.Document,
      },
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    const parameters = modernLayout.props('parameters')

    // Should have one path parameter from webhook
    expect(parameters).toHaveLength(1)
    expect(parameters[0].in).toBe('path')
    expect(parameters[0].name).toBe('webhookId')
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
    }

    const storeWithRefs = createMockStore(documentWithRefs as WorkspaceDocument)

    const wrapper = mount(Operation, {
      props: {
        id: 'test-operation',
        path: '/users/{userId}',
        method: 'get',
        clientOptions: [],
        isWebhook: false,
        layout: 'modern',
        server: undefined,
        store: storeWithRefs,
        collection: mockCollection,
        document: documentWithRefs as OpenAPIV3_1.Document,
      },
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    const parameters = modernLayout.props('parameters')

    // Should only have the resolved parameter, not the $ref
    expect(parameters).toHaveLength(1)
    expect(parameters[0].name).toBe('userId')
    expect(parameters[0].$ref).toBeUndefined()
  })

  it('renders classic layout when specified', () => {
    const wrapper = mount(Operation, {
      props: {
        id: 'test-operation',
        path: '/users/{userId}',
        method: 'get',
        clientOptions: [],
        isWebhook: false,
        layout: 'classic',
        server: undefined,
        store: createMockStore(createMockDocument() as WorkspaceDocument),
        collection: mockCollection,
        document: createMockDocument() as OpenAPIV3_1.Document,
      },
    })

    // Should render ClassicLayout instead of ModernLayout
    const classicLayout = wrapper.findComponent({ name: 'ClassicLayout' })
    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })

    expect(classicLayout.exists()).toBe(true)
    expect(modernLayout.exists()).toBe(false)

    // Check that parameters are passed correctly
    const parameters = classicLayout.props('parameters')
    expect(parameters).toHaveLength(2)

    const pathParameters = parameters.filter((p: any) => p.in === 'path')
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
      addDocumentSync: vi.fn(),
      config: {} as any,
      exportDocument: vi.fn(),
      saveDocument: vi.fn(),
      revertDocumentChanges: vi.fn(),
      commitDocument: vi.fn(),
      exportWorkspace: vi.fn(),
      loadWorkspace: vi.fn(),
      importWorkspaceFromSpecification: vi.fn(),
    }

    const wrapper = mount(Operation, {
      props: {
        id: 'test-operation',
        path: '/users/{userId}',
        method: 'get',
        clientOptions: [],
        isWebhook: false,
        layout: 'modern',
        server: undefined,
        store: storeWithoutOperation,
        collection: mockCollection,
        document: {},
      },
    })

    // Should not render anything when operation is not available
    expect(wrapper.html()).toBe('<!--v-if-->')
  })
})
