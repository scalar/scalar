import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { OpenAPIDocumentSchema, type SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Model from './Model.vue'

describe('Model', () => {
  const mockDocument = coerceValue(OpenAPIDocumentSchema, {
    openapi: '3.1.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'User name',
            },
          },
          required: ['id'],
        },
        Pet: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Pet ID',
            },
            name: {
              type: 'string',
              description: 'Pet name',
            },
          },
        },
      },
    },
  })

  const mockConfigClassic = {
    layout: 'classic' as const,
    orderRequiredPropertiesFirst: undefined,
    orderSchemaPropertiesBy: undefined,
  }

  const mockConfigModern = {
    layout: 'modern' as const,
    orderRequiredPropertiesFirst: undefined,
    orderSchemaPropertiesBy: undefined,
  }

  describe('layout rendering', () => {
    it('renders ClassicLayout when config.layout is classic', () => {
      const wrapper = mount(Model, {
        props: {
          id: 'user',
          name: 'User',
          eventBus: null,
          schema: mockDocument.components?.schemas?.User as SchemaObject,
          isCollapsed: false,
          options: mockConfigClassic,
        },
      })

      // Check that the component renders and contains "Models" text
      expect(wrapper.text()).toContain('User')

      // Check that it contains schema names
      expect(wrapper.text()).toContain('User')
      expect(wrapper.findComponent({ name: 'ClassicLayout' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'ModernLayout' }).exists()).toBe(false)
    })

    it('renders ModernLayout when config.layout is modern', () => {
      const wrapper = mount(Model, {
        props: {
          id: 'user',
          name: 'User',
          eventBus: null,
          schema: mockDocument.components?.schemas?.User as SchemaObject,
          isCollapsed: false,
          options: mockConfigModern,
        },
      })

      // Check that the component renders and contains "Models" text
      expect(wrapper.text()).toContain('User')

      // Check that it contains schema names
      expect(wrapper.text()).toContain('User')
      expect(wrapper.findComponent({ name: 'ClassicLayout' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'ModernLayout' }).exists()).toBe(true)
    })

    it('Hides content when isCollapsed is true', () => {
      const wrapper = mount(Model, {
        props: {
          id: 'user',
          name: 'User',
          eventBus: null,
          schema: mockDocument.components?.schemas?.User as SchemaObject,
          isCollapsed: true,
          options: mockConfigModern,
        },
      })

      expect(wrapper.findComponent({ name: 'CompactSection' }).props('modelValue')).toBe(false)
      expect(wrapper.findComponent({ name: 'CompactSection' }).text()).not.toContain('id')
      expect(wrapper.findComponent({ name: 'CompactSection' }).text()).not.toContain('name')
    })

    it('Shows content when isCollapsed is false', () => {
      const wrapper = mount(Model, {
        props: {
          id: 'user',
          name: 'User',
          eventBus: null,
          schema: mockDocument.components?.schemas?.User as SchemaObject,
          isCollapsed: false,
          options: mockConfigModern,
        },
      })

      expect(wrapper.findComponent({ name: 'CompactSection' }).props('modelValue')).toBe(true)
      expect(wrapper.findComponent({ name: 'CompactSection' }).text()).toContain('id')
      expect(wrapper.findComponent({ name: 'CompactSection' }).text()).toContain('name')
    })
  })
})
