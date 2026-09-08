import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { ResponseObjectSchema, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaProperty from '@/components/Content/Schema/SchemaProperty.vue'

import ParameterListItem from './ParameterListItem.vue'

const baseOptions = {
  hideModels: false,
  orderRequiredPropertiesFirst: false,
  orderSchemaPropertiesBy: 'alpha' as const,
  expandAllSchemaProperties: false,
  schemaLayout: 'legacy' as const,
  schemaKeyboardNav: false,
}

describe('ParameterListItem', () => {
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
          schemaLayout: 'legacy' as const,
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

    /** Anchor ids rendered once the headers group is open. */
    const headerAnchorIds = async (schemaLayout: 'legacy' | 'tree'): Promise<string[]> => {
      const wrapper = mount(ParameterListItem, {
        props: {
          breadcrumb: ['tag/pets/GET/pets', 'responses'],
          collapsableItems: false,
          eventBus: null,
          name: '200',
          options: { ...baseOptions, expandAllSchemaProperties: true, schemaLayout },
          parameter: responseWithHeader,
        },
      })

      const disclosure = wrapper.find('button')

      if (disclosure.exists()) {
        await disclosure.trigger('click')
        await wrapper.vm.$nextTick()
      }

      return wrapper
        .findAll('[id]')
        .map((element) => element.attributes('id') ?? '')
        .filter((id) => id.includes('X-Rate-Limit'))
    }

    it('keeps the legacy anchor id for a response header', async () => {
      // The doubled `headers` segment is what legacy has always emitted, and
      // readers hold links to it, so the tree work must not move it.
      await expect(headerAnchorIds('legacy')).resolves.toEqual([
        'tag/pets/GET/pets.responses.headers.headers.X-Rate-Limit',
      ])
    })

    it('qualifies the anchor id by status code in the tree layout', async () => {
      // Every status shares one `responses` breadcrumb, so without the status
      // the header groups of 200 and 404 collide on one expansion node.
      await expect(headerAnchorIds('tree')).resolves.toEqual(['tag/pets/GET/pets.responses.200.headers.X-Rate-Limit'])
    })
  })
})
