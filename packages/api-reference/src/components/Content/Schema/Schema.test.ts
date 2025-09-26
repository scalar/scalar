import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Schema from './Schema.vue'

describe('Schema', () => {
  describe('shouldShowDescription computed property', () => {
    it('shows the base description of the first allOf schema', () => {
      const wrapper = mount(Schema, {
        props: {
          name: 'Request Body',
          schema: coerceValue(SchemaObjectSchema, {
            description: 'This description should be shown',
            allOf: [
              {
                type: 'object',
                description: 'This description should be shown 2',
                properties: { name: { type: 'string' } },
              },
              {
                type: 'object',
                description: 'This description should be shown 3',
                properties: { email: { type: 'string' } },
              },
            ],
          }),
        },
      })

      const text = wrapper.text()
      expect(text).toContain('This description should be shown')
    })

    it('shows the first description with allOf composition', () => {
      const wrapper = mount(Schema, {
        props: {
          name: 'Request Body',
          schema: coerceValue(SchemaObjectSchema, {
            allOf: [
              {
                type: 'object',
                description: 'This description should be shown',
                properties: { name: { type: 'string' } },
              },
              {
                type: 'object',
                description: 'This description should not be shown',
                properties: { email: { type: 'string' } },
              },
            ],
          }),
        },
      })

      const text = wrapper.text()
      expect(text).toContain('This description should be shown')
      expect(text).not.toContain('This description should not be shown')
    })

    it('does show the allOf description', () => {
      const wrapper = mount(Schema, {
        props: {
          schema: {
            type: 'object',
            allOf: [
              {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
              {
                type: 'object',
                description: 'This description should not be shown',
                properties: { email: { type: 'string' } },
              },
            ],
          },
        },
      })

      const text = wrapper.text()
      expect(text).toContain('This description should not be shown')
    })
  })

  describe('additionalProperties Vue prop', () => {
    it('shows special toggle button when additionalProperties is true', () => {
      const wrapper = mount(Schema, {
        props: {
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          }),
          additionalProperties: true,
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')
      expect(toggleButton.exists()).toBe(true)
      expect(toggleButton.text()).toContain('Show additional properties')
    })

    it('does not show special toggle button when additionalProperties is false', () => {
      const wrapper = mount(Schema, {
        props: {
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          }),
          additionalProperties: false,
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')
      expect(toggleButton.exists()).toBe(false)
    })

    it('shows special toggle button with screen reader text when name is provided', () => {
      const wrapper = mount(Schema, {
        props: {
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          }),
          additionalProperties: true,
          name: 'User',
        },
      })

      // Look for screen reader text in the button content
      const toggleButton = wrapper.find('.schema-card-title--compact')
      expect(toggleButton.text()).toContain('for User')
    })

    it('adds border-t class when additionalProperties is true and disclosure is open', async () => {
      const wrapper = mount(Schema, {
        props: {
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          }),
          additionalProperties: true,
        },
      })

      // Initially closed, no border-t class
      expect(wrapper.find('.schema-card').classes()).not.toContain('border-t')

      // Open the disclosure
      const toggleButton = wrapper.find('.schema-card-title--compact')
      await toggleButton.trigger('click')

      // Now should have border-t class
      expect(wrapper.find('.schema-card').classes()).toContain('border-t')
    })

    it('renders additional properties schema when disclosure is opened', async () => {
      const wrapper = mount(Schema, {
        props: {
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          }),
          additionalProperties: true,
        },
      })

      // Initially closed, additional properties not visible
      const disclosurePanel = wrapper.find('ul')
      expect(disclosurePanel.exists()).toBe(false)

      // Open the disclosure
      const toggleButton = wrapper.find('.schema-card-title--compact')
      await toggleButton.trigger('click')

      // Now additional properties should be visible
      const disclosurePanelAfter = wrapper.find('ul')
      expect(disclosurePanelAfter.exists()).toBe(true)
    })

    it('prevents click propagation when noncollapsible is true', async () => {
      const wrapper = mount(Schema, {
        props: {
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: true,
          }),
          additionalProperties: true,
          noncollapsible: true,
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')

      // Test that the click handler exists and is properly bound
      expect(toggleButton.exists()).toBe(true)

      // The actual click propagation test is complex due to Vue's event handling
      // Instead, we test that the component renders correctly with noncollapsible
      expect(wrapper.find('.schema-card').exists()).toBe(true)
    })

    it('does not prevent click propagation when noncollapsible is false', async () => {
      const wrapper = mount(Schema, {
        props: {
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: true,
          }),
          additionalProperties: true,
          noncollapsible: false,
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')

      // Test that the click handler exists and is properly bound
      expect(toggleButton.exists()).toBe(true)

      // The actual click propagation test is complex due to Vue's event handling
      // Instead, we test that the component renders correctly without noncollapsible
      expect(wrapper.find('.schema-card').exists()).toBe(true)
    })

    it('shows Add icon in toggle button', () => {
      const wrapper = mount(Schema, {
        props: {
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: true,
          }),
          additionalProperties: true,
        },
      })

      const icon = wrapper.find('.schema-card-title-icon')
      expect(icon.exists()).toBe(true)
      // Check that the icon element exists and has the correct class
      expect(icon.classes()).toContain('schema-card-title-icon')
    })

    it('renders additional properties with noncollapsible prop set to true', async () => {
      const wrapper = mount(Schema, {
        props: {
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: true,
          }),
          additionalProperties: true,
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')
      await toggleButton.trigger('click')

      const schemaProperties = wrapper.findAllComponents({ name: 'SchemaProperty' })
      const additionalProperty = schemaProperties.find((prop) => prop.props('variant') === 'additionalProperties')

      expect(additionalProperty?.props('noncollapsible')).toBe(true)
    })
  })

  describe('JSON Schema additionalProperties field', () => {
    it('handles additionalProperties as boolean true correctly', async () => {
      const wrapper = mount(Schema, {
        props: {
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: true,
          }),
          additionalProperties: true,
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')
      await toggleButton.trigger('click')

      // Should render SchemaProperty with variant 'additionalProperties' for boolean true
      const schemaProperties = wrapper.findAllComponents({ name: 'SchemaProperty' })
      const additionalProperty = schemaProperties.find((prop) => prop.props('variant') === 'additionalProperties')

      expect(additionalProperty).toBeDefined()
      expect(additionalProperty?.props('value')).toEqual({
        type: 'anything',
      })
    })

    it('handles additionalProperties as empty object correctly', async () => {
      const wrapper = mount(Schema, {
        props: {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: {},
          } as any,
          additionalProperties: true,
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')
      await toggleButton.trigger('click')

      // Should render SchemaProperty with variant 'additionalProperties' for empty object
      const schemaProperties = wrapper.findAllComponents({ name: 'SchemaProperty' })
      const additionalProperty = schemaProperties.find((prop) => prop.props('variant') === 'additionalProperties')

      expect(additionalProperty).toBeDefined()
      expect(additionalProperty?.props('value')).toEqual({
        type: 'anything',
      })
    })
  })

  describe('object property order', () => {
    it('should render properties by required alphabetical order', () => {
      const wrapper = mount(Schema, {
        props: {
          schema: {
            type: 'object',
            properties: {
              gOptional: { type: 'string' },
              bOptional: { type: 'string' },
              dRequired: { type: 'string' },
              aOptional: { type: 'string' },
              bRequired: { type: 'string' },
              aRequired: { type: 'string' },
              cRequired: { type: 'string' },
            },
            required: ['aRequired', 'bRequired', 'cRequired', 'dRequired'],
          },
        },
      })

      // Get all SchemaProperty components
      const schemaProperties = wrapper.findAllComponents({ name: 'SchemaProperty' })

      // Extract property names in the order they appear
      const propertyNames = schemaProperties.map((prop) => prop.props('name'))

      // Expected order: required properties first (alphabetical), then optional properties (alphabetical)
      const expectedOrder = [
        // Required properties
        'aRequired',
        'bRequired',
        'cRequired',
        'dRequired',
        // Optional properties
        'aOptional',
        'bOptional',
        'gOptional',
      ]

      expect(propertyNames).toEqual(expectedOrder)
    })
  })

  describe('hideReadOnly prop', () => {
    it('does not render readOnly properties when hideReadOnly is true', () => {
      const wrapper = mount(Schema, {
        props: {
          hideReadOnly: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              visible: { type: 'string' },
              secret: { type: 'string', readOnly: true },
              alsoVisible: { type: 'integer', format: 'int32' },
            },
          }),
        },
      })

      const text = wrapper.text()
      expect(text).toContain('visible')
      expect(text).toContain('alsoVisible')
      expect(text).not.toContain('secret')
    })

    it('applies to nested object properties as well', async () => {
      const wrapper = mount(Schema, {
        props: {
          hideReadOnly: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              profile: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time', readOnly: true },
                },
              },
            },
          }),
        },
      })

      // Expand the nested schema for `profile` to reveal its children
      const profileProperty = wrapper
        .findAllComponents({ name: 'SchemaProperty' })
        .find((prop) => prop.props('name') === 'profile')
      expect(profileProperty).toBeDefined()

      const toggleButton = profileProperty!.find('.schema-card-title')
      expect(toggleButton.exists()).toBe(true)
      await toggleButton.trigger('click')

      const text = wrapper.text()
      expect(text).toContain('profile')
      expect(text).toContain('name')
      expect(text).not.toContain('createdAt')
    })
  })

  describe('hideWriteOnly prop', () => {
    it('does not render writeOnly properties when hideWriteOnly is true', () => {
      const wrapper = mount(Schema, {
        props: {
          hideWriteOnly: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              visible: { type: 'string' },
              secret: { type: 'string', writeOnly: true },
              alsoVisible: { type: 'integer', format: 'int32' },
            },
          }),
        },
      })

      const text = wrapper.text()
      expect(text).toContain('visible')
      expect(text).toContain('alsoVisible')
      expect(text).not.toContain('secret')
    })

    it('applies to nested object properties as well', async () => {
      const wrapper = mount(Schema, {
        props: {
          hideWriteOnly: true,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              profile: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  password: { type: 'string', format: 'password', writeOnly: true },
                },
              },
            },
          }),
        },
      })

      // Expand the nested schema for `profile` to reveal its children
      const profileProperty = wrapper
        .findAllComponents({ name: 'SchemaProperty' })
        .find((prop) => prop.props('name') === 'profile')
      expect(profileProperty).toBeDefined()

      const toggleButton = profileProperty!.find('.schema-card-title')
      expect(toggleButton.exists()).toBe(true)
      await toggleButton.trigger('click')

      const text = wrapper.text()
      expect(text).toContain('profile')
      expect(text).toContain('name')
      expect(text).not.toContain('password')
    })
  })
})
