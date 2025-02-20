import { collectionSchema, serverSchema } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { TransformedOperation } from '@scalar/types'
import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import Operation from './Operation.vue'

/**
 * Helper function to create a TransformedOperation
 *
 * We can use this to test existing components, but we want to move to store-compatible props eventually.
 *
 * @deprecated TODO: We need a helper function to create a store-compatible operation to migrate the tests to it.
 */
function createTransformedOperation(
  requestMethod: TransformedOperation['httpVerb'],
  path: TransformedOperation['path'],
  operation: Partial<OpenAPIV3_1.OperationObject>,
): TransformedOperation {
  return {
    ...operation,
    httpVerb: requestMethod,
    path: path,
    /** @ts-expect-error */
    information: operation,
  }
}

const mockProps = {
  collection: collectionSchema.parse({
    uid: 'collection1',
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
      description: 'A test API for unit testing',
    },
    requests: [],
    servers: ['server1', 'server2', 'server3'],
    security: [{ bearerAuth: ['read:users', 'read:events'] }, { apiKeyQuery: [] }],
    tags: ['tag1uid', 'tag2uid', 'tag3uid'],
  }),
  requests: {},
  requestExamples: {},
  securitySchemes: {},
  server: serverSchema.parse({
    uid: 'server1',
    url: 'https://example.com',
  }),
}

// We temporarily mock this before we move it to a hook
vi.mock('@scalar/api-client/store', () => ({
  useActiveEntities: vi.fn().mockReturnValue({
    activeCollection: {
      value: {
        uid: 'collection1',
        openapi: '3.1.0',
        selectedSecuritySchemeUids: [],
        requests: [],
        servers: ['server1', 'server2', 'server3'],
        security: [{ bearerAuth: ['read:users', 'read:events'] }, { apiKeyQuery: [] }],
        tags: ['tag1uid', 'tag2uid', 'tag3uid'],
      },
    },
    activeServer: {
      value: {
        uid: 'server1',
        url: 'https://example.com',
      },
    },
  }),
}))

// TODO: We need to mock up a store here to test those components.
// Ideally we’d get rid of the inject/provide pattern inside that component,
// to make testing easier. But we’re not there yet.
describe.skip('Operation', () => {
  it('renders the modern layout by default', async () => {
    const operationComponent = mount(Operation, {
      props: {
        operation: createTransformedOperation('GET', '/planets', {
          tags: ['Planets'],
          summary: 'Get all planets',
        }),
        ...mockProps,
        transformedOperation: createTransformedOperation('GET', '/planets', {
          tags: ['Planets'],
          summary: 'Get all planets',
        }),
      },
    })

    expect(operationComponent.findComponent({ name: 'ModernLayout' }).exists()).toBe(true)
    expect(operationComponent.findComponent({ name: 'ClassicLayout' }).exists()).toBe(false)
  })

  it('switches to classic layout', async () => {
    const operationComponent = mount(Operation, {
      props: {
        transformedOperation: createTransformedOperation('GET', '/planets', {
          tags: ['Planets'],
          summary: 'Get all planets',
        }),
        ...mockProps,
      },
    })

    await operationComponent.setProps({ layout: 'classic' })
    expect(operationComponent.findComponent({ name: 'ClassicLayout' }).exists()).toBe(true)
    expect(operationComponent.findComponent({ name: 'ModernLayout' }).exists()).toBe(false)
  })

  it('passes props correctly', async () => {
    const operationComponent = mount(Operation, {
      props: {
        transformedOperation: createTransformedOperation('GET', '/planets', {
          tags: ['Planets'],
          summary: 'Get all planets',
        }),
        ...mockProps,
      },
    })

    await operationComponent.setProps({ layout: 'modern' })

    const modernLayout = operationComponent.findComponent({
      name: 'ModernLayout',
    })
    expect(modernLayout.props('operation')).toEqual(
      expect.objectContaining({
        tags: ['Planets'],
        summary: 'Get all planets',
      }),
    )
  })

  it('renders operation data in HTML', async () => {
    const operationComponent = mount(Operation, {
      props: {
        transformedOperation: createTransformedOperation('GET', '/planets', {
          tags: ['Planets'],
          summary: 'Get all planets',
          description: 'Returns a list of all known planets',
        }),
        ...mockProps,
      },
    })

    const html = operationComponent.html()

    expect(html).toContain('GET')
    expect(html).toContain('/planets')
    // TODO:
    // expect(html).toContain('Get all planets')
    expect(html).toContain('Returns a list of all known planets')
  })

  // TODO: provide is not a function
  it.skip('renders in SSR environment', async () => {
    const operationComponent = mount(Operation, {
      props: {
        transformedOperation: createTransformedOperation('GET', '/planets', {
          tags: ['Planets'],
          summary: 'Get all planets',
        }),
        ...mockProps,
      },
      global: {
        provide: {
          isSSG: false,
          isSSR: true,
        },
      },
    })

    expect(operationComponent).not.toBeUndefined()

    const html = await renderToString(operationComponent.vm.$el)

    expect(html).toBeTruthy()
    expect(html).toContain('Get all planets')
  })
})
