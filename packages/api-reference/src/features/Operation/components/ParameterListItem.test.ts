import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaProperty from '@/components/Content/Schema/SchemaProperty.vue'

import ParameterListItem from './ParameterListItem.vue'

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
        },
        parameter: {
          in: 'query',
          name: 'pet',
          required: false,
          schema: {
            $ref: '#/components/schemas/Pet',
          },
        },
      },
    })

    const schemaProperty = wrapper.findComponent(SchemaProperty)
    expect(schemaProperty.props('hideModelNames')).toBe(false)
  })
})
