import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { ResponseObjectSchema, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaProperty from '@/components/Content/Schema/SchemaProperty.vue'
import { scrollTargetId } from '@/helpers/lazy-bus'

import ParameterListItem from './ParameterListItem.vue'

const baseOptions = {
  hideModels: false,
  orderRequiredPropertiesFirst: false,
  orderSchemaPropertiesBy: 'alpha' as const,
  expandAllSchemaProperties: false,
  schemaKeyboardNav: false,
}

describe('ParameterListItem', () => {
  it('displays both the complete body and stream item schemas', () => {
    const wrapper = mount(ParameterListItem, {
      props: {
        collapsableItems: false,
        eventBus: null,
        name: '200',
        options: baseOptions,
        parameter: coerceValue(ResponseObjectSchema, {
          description: 'Events',
          content: {
            'application/jsonl': {
              schema: { type: 'array', maxItems: 10 },
              itemSchema: {
                type: 'object',
                properties: { message: { type: 'string', description: 'Streamed message' } },
              },
            },
          },
        }),
      },
    })
    expect(wrapper.text()).toContain('Stream item')
    expect(wrapper.text()).toContain('Streamed message')
    expect(wrapper.findComponent(SchemaProperty).props('schema')).toHaveProperty('maxItems', 10)
  })

  it('keeps a compact parameter without details static', () => {
    const wrapper = mount(ParameterListItem, {
      props: {
        collapsableItems: true,
        eventBus: null,
        name: 'limit',
        options: baseOptions,
        parameter: { in: 'query', name: 'limit', required: true },
      },
    })

    expect(wrapper.text()).toContain('limit')
    expect(wrapper.text()).toContain('required')
    expect(wrapper.find('button[aria-expanded]').exists()).toBe(false)
  })

  it('opens a compact parameter description without a schema', async () => {
    const wrapper = mount(ParameterListItem, {
      props: {
        collapsableItems: true,
        eventBus: null,
        name: 'limit',
        options: baseOptions,
        parameter: { in: 'query', name: 'limit', description: 'Maximum results.' },
      },
    })

    const toggle = wrapper.get('button[aria-expanded]')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('Maximum results.')
  })

  it('opens a compact parameter when its anchor is the initial scroll target', () => {
    scrollTargetId.value = 'operation.query.limit'
    try {
      const wrapper = mount(ParameterListItem, {
        props: {
          collapsableItems: true,
          breadcrumb: ['operation', 'query'],
          eventBus: null,
          name: 'limit',
          options: baseOptions,
          parameter: { in: 'query', name: 'limit', schema: { type: 'integer', enum: [10, 20] } },
        },
      })
      const toggle = wrapper.get('button[aria-expanded]')
      expect(wrapper.attributes('id')).toBe('operation.query.limit')
      expect(toggle.attributes('aria-expanded')).toBe('true')
      expect(wrapper.text()).toContain('20')
      wrapper.unmount()
    } finally {
      scrollTargetId.value = ''
    }
  })

  it('keeps scalar response details visible when responses are collapsible', () => {
    const wrapper = mount(ParameterListItem, {
      props: {
        collapsableItems: true,
        eventBus: null,
        name: '204',
        options: baseOptions,
        parameter: { description: 'No content' },
      },
    })
    expect(wrapper.text()).toContain('No content')
    expect(wrapper.find('button[aria-expanded]').exists()).toBe(false)
  })

  it('keeps model names visible when hideModels is enabled', () => {
    const wrapper = mount(ParameterListItem, {
      props: {
        collapsableItems: false,
        eventBus: null,
        name: 'pet',
        options: {
          hideModels: true,
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
          expandAllSchemaProperties: false,
          schemaKeyboardNav: false,
        },
        parameter: {
          in: 'query',
          name: 'pet',
          required: false,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            title: 'Pet',
            properties: {
              name: { type: 'string' },
            },
          }),
        },
      },
    })

    const schemaProperty = wrapper.findComponent(SchemaProperty)
    expect(schemaProperty.props('hideModelNames')).toBe(false)
  })

  // https://github.com/scalar/scalar/issues/9431
  it('keeps the content schema description visible when responses are expanded', () => {
    const wrapper = mount(ParameterListItem, {
      props: {
        collapsableItems: false,
        eventBus: null,
        name: '200',
        options: baseOptions,
        parameter: coerceValue(ResponseObjectSchema, {
          description: 'OK',
          content: {
            'text/csv': {
              schema: {
                type: 'string',
                description: 'Description for CSV response.',
              },
              example: 'brand,value\nBest Brand,123',
            },
          },
        }),
      },
    })

    const text = wrapper.text()
    // The response description and the schema description are both shown.
    expect(text).toContain('OK')
    expect(text).toContain('Description for CSV response.')
  })

  describe('response header anchors', () => {
    const responseWithHeader = coerceValue(ResponseObjectSchema, {
      description: 'OK',
      headers: {
        'X-Rate-Limit': { schema: { type: 'integer' } },
      },
    })

    /** Anchor ids rendered with the headers group open via expand-all. */
    const headerAnchorIds = (): string[] => {
      const wrapper = mount(ParameterListItem, {
        props: {
          breadcrumb: ['tag/pets/GET/pets', 'responses'],
          collapsableItems: false,
          eventBus: null,
          name: '200',
          options: { ...baseOptions, expandAllSchemaProperties: true },
          parameter: responseWithHeader,
        },
      })

      return wrapper
        .findAll('[id]')
        .map((element) => element.attributes('id') ?? '')
        .filter((id) => id.includes('X-Rate-Limit'))
    }

    it('qualifies the anchor id by status code', () => {
      // Every status shares one `responses` breadcrumb, so without the status
      // the header groups of 200 and 404 collide on one expansion node.
      expect(headerAnchorIds()).toEqual(['tag/pets/GET/pets.responses.200.headers.X-Rate-Limit'])
    })
  })
})
