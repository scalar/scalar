import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import { enableConsoleError, enableConsoleWarn } from '@scalar/helpers/testing/console-spies'
import { collectionSchema } from '@scalar/oas-utils/entities/spec'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { OpenAPIDocumentSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockSidebar, createMockStore } from '@/helpers/test-utils'

import Operation from './Operation.vue'

type ExtractComponentProps<TComponent> = TComponent extends new () => { $props: infer P } ? P : never

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
vi.mock('@/v2/blocks/scalar-sidebar-block/hooks/useSidebar', () => ({
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

const mockCollection = collectionSchema.parse({})

const createDocumentWithOperationId = () =>
  coerceValue(OpenAPIDocumentSchema, {
    openapi: '3.1.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {
      '/users/{userId}': {
        get: {
          operationId: 'getUserById',
          summary: 'Get user by ID',
        },
      },
    },
  })

const mountOperationWithConfig = (
  config: Omit<Partial<ExtractComponentProps<typeof Operation>>, 'options'> & {
    options?: Partial<ExtractComponentProps<typeof Operation>['options']>
  },
) => {
  const doc = createDocumentWithOperationId()

  return mount(Operation, {
    props: {
      id: 'test-operation',
      method: 'get',
      path: '/users/{userId}',
      pathValue: doc.paths?.['/users/{userId}'],
      security: doc.security,
      server: undefined,
      getSecurityScheme: () => [],
      ...config,
      xScalarDefaultClient: 'c/libcurl',
      options: {
        layout: 'modern',
        isWebhook: false,
        clientOptions,
        showOperationId: undefined,
        hideTestRequestButton: undefined,
        expandAllResponses: undefined,
        orderRequiredPropertiesFirst: undefined,
        orderSchemaPropertiesBy: undefined,
        ...config.options,
      },
    },
  })
}

describe('Operation', () => {
  beforeEach(() => {
    enableConsoleWarn()
    enableConsoleError()
  })

  const createMockDocument = (): WorkspaceDocument =>
    coerceValue(OpenAPIDocumentSchema, {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'https://root.example.com',
        },
      ],
      paths: {
        '/users/{userId}': {
          servers: [
            {
              url: 'https://path.example.com',
            },
          ],
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
            servers: [
              {
                url: 'https://op.example.com',
              },
            ],
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
    const document = createMockDocument()
    const wrapper = mountOperationWithConfig({
      path: '/users/{userId}',
      method: 'get',
      pathValue: document.paths?.['/users/{userId}'],
      security: document.security,
      server: undefined,
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
    const documentWithOnlyOperationParams = coerceValue(OpenAPIDocumentSchema, {
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
    })

    const wrapper = mountOperationWithConfig({
      path: '/users/{userId}',
      method: 'get',
      pathValue: documentWithOnlyOperationParams.paths?.['/users/{userId}'],
      security: documentWithOnlyOperationParams.security,
      server: undefined,
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    const operation = modernLayout.props('operation')

    // Should have one path parameter
    expect(operation.parameters).toHaveLength(1)
    expect(operation.parameters[0].in).toBe('path')
    expect(operation.parameters[0].name).toBe('userId')
  })

  it('handles webhook path parameters correctly', () => {
    const documentWithWebhooks = coerceValue(OpenAPIDocumentSchema, {
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
    })

    const wrapper = mountOperationWithConfig({
      path: '/webhook/user-updated',
      method: 'post',
      pathValue: documentWithWebhooks.webhooks?.['/webhook/user-updated'],
      security: documentWithWebhooks.security,
      server: undefined,
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    const operation = modernLayout.props('operation')

    // Should have one path parameter from webhook
    expect(operation.parameters).toHaveLength(1)
    expect(operation.parameters[0].in).toBe('path')
    expect(operation.parameters[0].name).toBe('webhookId')
  })

  it('filters out unresolved references from parameters', () => {
    const documentWithRefs = coerceValue(OpenAPIDocumentSchema, {
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
    })

    const wrapper = mountOperationWithConfig({
      path: '/users/{userId}',
      method: 'get',
      pathValue: documentWithRefs.paths?.['/users/{userId}'],
      security: documentWithRefs.security,
      server: undefined,
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    const operation = modernLayout.props('operation')

    // Should only have the resolved parameter, not the $ref
    expect(operation.parameters).toHaveLength(1)
    expect(operation.parameters[0].name).toBe('userId')
    expect(operation.parameters[0].$ref).toBeUndefined()
  })

  it('overrides path parameters with operation parameters of the same name', () => {
    const documentWithOverridingParams = coerceValue(OpenAPIDocumentSchema, {
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
    })

    const wrapper = mountOperationWithConfig({
      path: '/users/{userId}',
      method: 'get',
      pathValue: documentWithOverridingParams.paths?.['/users/{userId}'],
      security: documentWithOverridingParams.security,
      server: undefined,
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
    const document = createMockDocument()
    const wrapper = mountOperationWithConfig({
      path: '/users/{userId}',
      method: 'get',
      pathValue: document.paths?.['/users/{userId}'],
      security: document.security,
      server: undefined,
      options: {
        layout: 'classic',
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
    const documentWithoutOperation = {
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
    }

    const wrapper = mountOperationWithConfig({
      path: '/users/{userId}',
      method: 'get',
      pathValue: documentWithoutOperation.paths?.['/users/{userId}'],
      security: undefined,
      server: undefined,
    })

    // Should not render anything when operation is not available
    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('passes expandAllResponses config to OperationResponses component', () => {
    const documentWithResponses = coerceValue(OpenAPIDocumentSchema, {
      openapi: '3.1.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users/{userId}': {
          get: {
            summary: 'Get user by ID',
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'string',
                      default: 'This is the testing string and it is in the document',
                    },
                  },
                },
              },
              '404': {
                description: 'User not found',
              },
            },
          },
        },
      },
    })

    const wrapper = mountOperationWithConfig({
      path: '/users/{userId}',
      method: 'get',
      pathValue: documentWithResponses.paths?.['/users/{userId}'],
      security: documentWithResponses.security,
      server: undefined,
      options: {
        layout: 'modern',
        expandAllResponses: true,
      },
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    expect(modernLayout.exists()).toBe(true)

    // Find the OperationResponses component within ModernLayout
    const operationResponses = modernLayout.findComponent({ name: 'OperationResponses' })
    expect(operationResponses.text()).toContain('This is the testing string and it is in the document')
  })

  it('passes operation-level server to ModernLayout', () => {
    const doc = createMockDocument()

    const wrapper = mountOperationWithConfig({
      path: '/users/{userId}',
      method: 'get',
      pathValue: doc.paths?.['/users/{userId}'],
      security: doc.security,
      server: undefined,
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    expect(modernLayout.exists()).toBe(true)
    const server = modernLayout.props('server') as { url?: string } | undefined
    expect(server?.url).toBe('https://op.example.com')
  })

  it('falls back to path-level server when operation servers are missing', () => {
    const doc = coerceValue(OpenAPIDocumentSchema, {
      openapi: '3.1.0',
      info: { title: 'Test API', version: '1.0.0' },
      servers: [
        {
          url: 'https://root.example.com',
        },
      ],
      paths: {
        '/users': {
          servers: [
            {
              url: 'https://path.example.com',
            },
          ],
          get: {
            summary: 'List users',
          },
        },
      },
    })

    const wrapper = mountOperationWithConfig({
      path: '/users',
      method: 'get',
      pathValue: doc.paths?.['/users'],
      security: doc.security,
      server: undefined,
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    expect(modernLayout.exists()).toBe(true)
    const server = modernLayout.props('server') as { url?: string } | undefined
    expect(server?.url).toBe('https://path.example.com')
  })

  describe('showOperationId', () => {
    describe('ModernLayout', () => {
      it('shows operationId when showOperationId is true', () => {
        const wrapper = mountOperationWithConfig({ options: { showOperationId: true } })
        const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })

        expect(modernLayout.html()).toContain('getUserById')
      })

      it('does not show operationId by default', () => {
        const wrapper = mountOperationWithConfig({})
        const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })

        expect(modernLayout.html()).not.toContain('getUserById')
      })
    })

    describe('ClassicLayout', () => {
      it('shows operationId when showOperationId is true', () => {
        const wrapper = mountOperationWithConfig({ options: { showOperationId: true, layout: 'classic' } })
        const classicLayout = wrapper.findComponent({ name: 'ClassicLayout' })

        expect(classicLayout.html()).toContain('getUserById')
      })

      it('does not show operationId by default', () => {
        const wrapper = mountOperationWithConfig({ options: { layout: 'classic' } })
        const classicLayout = wrapper.findComponent({ name: 'ClassicLayout' })

        expect(classicLayout.html()).not.toContain('getUserById')
      })
    })
  })
})
