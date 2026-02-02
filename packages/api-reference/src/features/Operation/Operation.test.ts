import { enableConsoleError, enableConsoleWarn } from '@scalar/helpers/testing/console-spies'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { OpenAPIDocumentSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import Operation from './Operation.vue'

type ExtractComponentProps<TComponent> = TComponent extends new () => { $props: infer P } ? P : never

const eventBus = createWorkspaceEventBus()
const workspaceStore = createWorkspaceStore()

/**
 * Helper function to mount the Operation component with default configuration.
 * Allows overriding specific props for testing different scenarios.
 */
const mountOperationWithConfig = (
  overrides: {
    path?: string
    method?: string
    pathValue?: any
    server?: any
    options?: Partial<ExtractComponentProps<typeof Operation>['options']>
    document?: any
  } = {},
) => {
  const defaultDocument = coerceValue(OpenAPIDocumentSchema, {
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {
      '/users/{userId}': {
        get: {
          operationId: 'getUserById',
          summary: 'Get user by ID',
        },
      },
    },
    components: {
      schemas: {},
    },
  })

  const defaultConfig = apiReferenceConfigurationSchema.parse({
    layout: 'modern',
    theme: 'default',
    hideModels: false,
    showOperationId: false,
    hideTestRequestButton: false,
    expandAllResponses: false,
    orderRequiredPropertiesFirst: false,
    orderSchemaPropertiesBy: 'alpha',
    ...overrides.options,
  })

  const props: ExtractComponentProps<typeof Operation> = {
    id: 'test-operation',
    method: (overrides.method || 'get') as any,
    securitySchemes: {},
    options: defaultConfig,
    document: overrides.document || defaultDocument,
    path: overrides.path || '/users/{userId}',
    pathValue: overrides.pathValue !== undefined ? overrides.pathValue : defaultDocument.paths?.['/users/{userId}'],
    server: overrides.server !== undefined ? overrides.server : null,
    clientOptions: [],
    isCollapsed: false,
    authStore: workspaceStore.auth,
    isWebhook: false,
    selectedClient: 'c/fetch',
    eventBus,
  }

  return mount(Operation, {
    props,
    global: {
      stubs: {
        RouterLink: {
          name: 'RouterLink',
          template: '<a><slot /></a>',
        },
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
      server: null,
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
      server: null,
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
      server: null,
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    const operation = modernLayout.props('operation')

    // Should have one path parameter from webhook
    expect(operation.parameters).toHaveLength(1)
    expect(operation.parameters[0].in).toBe('path')
    expect(operation.parameters[0].name).toBe('webhookId')
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
      server: null,
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
      server: null,
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
      server: null,
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
      server: null,
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
      server: null,
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    expect(modernLayout.exists()).toBe(true)
    const server = modernLayout.props('selectedServer') as { url?: string } | undefined
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
      server: null,
    })

    const modernLayout = wrapper.findComponent({ name: 'ModernLayout' })
    expect(modernLayout.exists()).toBe(true)
    const server = modernLayout.props('selectedServer') as { url?: string } | undefined
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
