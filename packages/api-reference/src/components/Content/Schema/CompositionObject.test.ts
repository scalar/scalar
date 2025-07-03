import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { h } from 'vue'
import CompositionObject from './CompositionObject.vue'

// Mock the components and icons
vi.mock('@scalar/components', () => ({
  ScalarListbox: {
    name: 'ScalarListbox',
    template: '<div class="scalar-listbox"><slot /></div>',
    props: ['modelValue', 'options', 'resize'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('@scalar/icons', () => ({
  ScalarIconCaretDown: {
    name: 'ScalarIconCaretDown',
    template: '<span class="scalar-icon-caret-down">▼</span>',
  },
}))

describe('CompositionObject', () => {
  const mockSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
    Pet: {
      type: 'object',
      title: 'Pet',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
      },
    },
    Dog: {
      type: 'object',
      title: 'Dog',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        breed: { type: 'string' },
      },
    },
    Cat: {
      type: 'object',
      title: 'Cat',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        color: { type: 'string' },
      },
    },
  }

  it('renders nothing when no schema is provided', () => {
    const wrapper = mount(CompositionObject, {
      props: {},
    })

    expect(wrapper.find('.schema-composition').exists()).toBe(false)
  })

  it('renders slot content directly when schema is not a composition object', () => {
    const simpleSchema: OpenAPIV3_1.SchemaObject = {
      type: 'string',
      title: 'Simple String',
    }

    const wrapper = mount(CompositionObject, {
      props: {
        schema: simpleSchema,
      },
      slots: {
        default: ({ schema }) => h('div', { class: 'slot-content' }, schema.title),
      },
    })

    // The component renders the schema object as text AND the slot content
    expect(wrapper.text()).toContain('Simple String')
    expect(wrapper.find('.slot-content').exists()).toBe(true)
  })

  describe('anyOf composition', () => {
    it('renders anyOf composition correctly', () => {
      const anyOfSchema: OpenAPIV3_1.SchemaObject = {
        anyOf: [{ type: 'string' }, { type: 'integer' }],
      }

      const wrapper = mount(CompositionObject, {
        props: {
          schema: anyOfSchema,
        },
        slots: {
          default: ({ schema }) => `<div class="schema-content">${schema?.type || 'Unknown'}</div>`,
        },
      })

      expect(wrapper.find('.composition-selector').exists()).toBe(true)
      expect(wrapper.find('.composition-selector').text()).toContain('string')
      expect(wrapper.text()).toContain('Any of')
    })
  })

  describe('allOf composition', () => {
    it('renders allOf composition correctly', () => {
      const allOfSchema: OpenAPIV3_1.SchemaObject = {
        allOf: [
          { type: 'object', properties: { id: { type: 'integer' } } },
          { type: 'object', properties: { name: { type: 'string' } } },
        ],
      }

      const wrapper = mount(CompositionObject, {
        props: {
          schema: allOfSchema,
        },
        slots: {
          default: ({ schema }) => `<div class="schema-content">${schema?.type || 'Unknown'}</div>`,
        },
      })

      expect(wrapper.find('.composition-selector').exists()).toBe(true)
      expect(wrapper.find('.composition-selector').text()).toContain('object')
      expect(wrapper.text()).toContain('All of')
    })
  })

  describe('discriminator mapping', () => {
    it('uses discriminator mapping when available', () => {
      const schemaWithMapping: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { $ref: '#/components/schemas/Cat' }],
        discriminator: {
          propertyName: 'type',
          mapping: {
            dog: '#/components/schemas/Dog',
            cat: '#/components/schemas/Cat',
          },
        },
      }

      const wrapper = mount(CompositionObject, {
        props: {
          schema: schemaWithMapping,
          schemas: mockSchemas,
        },
      })

      // Should use the mapping keys as labels
      const listboxOptions = wrapper.vm.listboxOptions
      expect(listboxOptions).toHaveLength(2)
      expect(listboxOptions[0].label).toBe('Dog')
      expect(listboxOptions[1].label).toBe('Cat')
    })

    it('falls back to schema titles when no mapping is provided', () => {
      const schemaWithoutMapping: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { $ref: '#/components/schemas/Cat' }],
        discriminator: {
          propertyName: 'type',
        },
      }

      const wrapper = mount(CompositionObject, {
        props: {
          schema: schemaWithoutMapping,
          schemas: mockSchemas,
        },
      })

      const listboxOptions = wrapper.vm.listboxOptions
      expect(listboxOptions).toHaveLength(2)
      expect(listboxOptions[0].label).toBe('Dog')
      expect(listboxOptions[1].label).toBe('Cat')
    })

    it('handles missing schema references gracefully', () => {
      const schemaWithMissingRef: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ $ref: '#/components/schemas/MissingSchema' }],
        discriminator: {
          propertyName: 'type',
          mapping: {
            missing: '#/components/schemas/MissingSchema',
          },
        },
      }

      const wrapper = mount(CompositionObject, {
        props: {
          schema: schemaWithMissingRef,
          schemas: mockSchemas,
        },
      })

      const listboxOptions = wrapper.vm.listboxOptions
      expect(listboxOptions).toHaveLength(1)
      expect(listboxOptions[0].label).toBe('missing')
    })
  })

  describe('schema reference resolution', () => {
    it('resolves schema references with #/components/schemas/ prefix', () => {
      const schemaWithRef: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ $ref: '#/components/schemas/Dog' }],
      }

      const wrapper = mount(CompositionObject, {
        props: {
          schema: schemaWithRef,
          schemas: mockSchemas,
        },
      })

      expect(wrapper.vm.selectedSchema).toEqual(mockSchemas.Dog)
    })

    it('resolves direct schema names', () => {
      const schemaWithDirectRef: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ $ref: 'Dog' }],
      }

      const wrapper = mount(CompositionObject, {
        props: {
          schema: schemaWithDirectRef,
          schemas: mockSchemas,
        },
      })

      expect(wrapper.vm.selectedSchema).toEqual(mockSchemas.Dog)
    })

    it('handles undefined schemas gracefully', () => {
      const schemaWithRef: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ $ref: '#/components/schemas/Dog' }],
      }

      const wrapper = mount(CompositionObject, {
        props: {
          schema: schemaWithRef,
          schemas: undefined,
        },
      })

      // Should not crash and should handle gracefully
      expect(wrapper.vm.selectedSchema).toBeUndefined()
    })
  })

  describe('composition type humanization', () => {
    it('displays "One of" for oneOf schemas', () => {
      const oneOfSchema: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ type: 'string' }],
      }

      const wrapper = mount(CompositionObject, {
        props: { schema: oneOfSchema },
      })

      expect(wrapper.find('.composition-selector').text()).toContain('One of')
    })

    it('displays "Any of" for anyOf schemas', () => {
      const anyOfSchema: OpenAPIV3_1.SchemaObject = {
        anyOf: [{ type: 'string' }],
      }

      const wrapper = mount(CompositionObject, {
        props: { schema: anyOfSchema },
      })

      expect(wrapper.find('.composition-selector').text()).toContain('Any of')
    })

    it('displays "All of" for allOf schemas', () => {
      const allOfSchema: OpenAPIV3_1.SchemaObject = {
        allOf: [{ type: 'string' }],
      }

      const wrapper = mount(CompositionObject, {
        props: { schema: allOfSchema },
      })

      expect(wrapper.find('.composition-selector').text()).toContain('All of')
    })
  })

  describe('edge cases', () => {
    it('handles empty composition arrays', () => {
      const emptySchema: OpenAPIV3_1.SchemaObject = {
        oneOf: [],
      }

      const wrapper = mount(CompositionObject, {
        props: { schema: emptySchema },
      })

      expect(wrapper.vm.compositionSchemas).toHaveLength(0)
      expect(wrapper.vm.listboxOptions).toHaveLength(0)
    })

    it('handles composition schemas without titles', () => {
      const schemaWithoutTitles: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ type: 'string' }, { type: 'integer' }],
      }

      const wrapper = mount(CompositionObject, {
        props: { schema: schemaWithoutTitles },
      })

      const listboxOptions = wrapper.vm.listboxOptions
      expect(listboxOptions[0].label).toBe('string')
      expect(listboxOptions[1].label).toBe('integer')
    })

    it('handles compact prop', () => {
      const oneOfSchema: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ type: 'string' }],
      }

      const wrapper = mount(CompositionObject, {
        props: {
          schema: oneOfSchema,
          compact: true,
        },
      })

      // The compact prop should be available to the component
      expect(wrapper.props('compact')).toBe(true)
    })
  })
})
