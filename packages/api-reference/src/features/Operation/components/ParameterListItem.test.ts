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
})
