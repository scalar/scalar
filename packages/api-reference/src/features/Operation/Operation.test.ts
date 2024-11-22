import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { TransformedOperation } from '@scalar/types'
import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

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
    // @ts-expect-error
    information: operation,
  }
}

describe('Operation', () => {
  it('renders the modern layout by default', async () => {
    const operationComponent = mount(Operation, {
      props: {
        operation: createTransformedOperation('GET', '/planets', {
          tags: ['Planets'],
          summary: 'Get all planets',
        }),
      },
    })

    expect(
      operationComponent.findComponent({ name: 'ModernLayout' }).exists(),
    ).toBe(true)
    expect(
      operationComponent.findComponent({ name: 'ClassicLayout' }).exists(),
    ).toBe(false)
  })

  it('switches to classic layout', async () => {
    const operationComponent = mount(Operation, {
      props: {
        operation: createTransformedOperation('GET', '/planets', {
          tags: ['Planets'],
          summary: 'Get all planets',
        }),
      },
    })

    await operationComponent.setProps({ layout: 'classic' })
    expect(
      operationComponent.findComponent({ name: 'ClassicLayout' }).exists(),
    ).toBe(true)
    expect(
      operationComponent.findComponent({ name: 'ModernLayout' }).exists(),
    ).toBe(false)
  })

  it('passes props correctly', async () => {
    const operationComponent = mount(Operation, {
      props: {
        operation: createTransformedOperation('GET', '/planets', {
          tags: ['Planets'],
          summary: 'Get all planets',
        }),
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
        operation: createTransformedOperation('GET', '/planets', {
          tags: ['Planets'],
          summary: 'Get all planets',
          description: 'Returns a list of all known planets',
        }),
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
        operation: createTransformedOperation('GET', '/planets', {
          tags: ['Planets'],
          summary: 'Get all planets',
        }),
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
