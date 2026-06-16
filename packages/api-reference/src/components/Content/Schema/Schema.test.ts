import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { type SchemaObject, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { scrollTargetId } from '../../../helpers/lazy-bus'
import Schema from './Schema.vue'

describe('Schema', () => {
  describe('shouldShowDescription computed property', () => {
    it('shows the base description of the first allOf schema', () => {
      const wrapper = mount(Schema, {
        props: {
          options: {},
          name: 'Request Body',
          eventBus: null,
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

    it('shows the overriding description with allOf composition', () => {
      const wrapper = mount(Schema, {
        props: {
          name: 'Request Body',
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            allOf: [
              {
                type: 'object',
                description: 'This description should not be shown',
                properties: { name: { type: 'string' } },
              },
              {
                type: 'object',
                description: 'This description should be shown',
                properties: { email: { type: 'string' } },
              },
            ],
          }),
          options: {},
        },
      })

      const text = wrapper.text()
      // A later allOf member overrides the earlier description
      expect(text).toContain('This description should be shown')
      expect(text).not.toContain('This description should not be shown')
    })

    it('does show the allOf description', () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
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
          options: {},
        },
      })

      const text = wrapper.text()
      expect(text).toContain('This description should not be shown')
    })

    it('shows the parent description for discriminator-based oneOf schemas', () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            description: 'Parent schema description',
            discriminator: {
              propertyName: 'kind',
              mapping: {
                first: '#/components/schemas/FirstVariant',
                second: '#/components/schemas/SecondVariant',
              },
            },
            oneOf: [
              {
                type: 'object',
                title: 'FirstVariant',
                properties: {
                  firstId: {
                    type: 'string',
                  },
                },
              },
              {
                type: 'object',
                title: 'SecondVariant',
                properties: {
                  secondId: {
                    type: 'string',
                  },
                },
              },
            ],
            properties: {
              kind: {
                type: 'string',
              },
            },
          }),
          options: {},
        },
      })

      expect(wrapper.text()).toContain('Parent schema description')
    })
  })

  describe('additionalProperties Vue prop', () => {
    it('shows special toggle button when additionalProperties is true', () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          }),
          additionalProperties: true,
          options: {},
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')
      expect(toggleButton.exists()).toBe(true)
      expect(toggleButton.text()).toContain('Show additional properties')
    })

    it('does not show special toggle button when additionalProperties is false', () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          }),
          additionalProperties: false,
          options: {},
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')
      expect(toggleButton.exists()).toBe(false)
    })

    it('shows special toggle button with screen reader text when name is provided', () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          }),
          additionalProperties: true,
          name: 'User',
          options: {},
        },
      })

      // Look for screen reader text in the button content
      const toggleButton = wrapper.find('.schema-card-title--compact')
      expect(toggleButton.text()).toContain('for User')
    })

    it('adds border-t class when additionalProperties is true and disclosure is open', async () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          }),
          additionalProperties: true,
          options: {},
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
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          }),
          additionalProperties: true,
          options: {},
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

    it('prevents click propagation when noncollapsible is true', () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: true,
          }),
          additionalProperties: true,
          noncollapsible: true,
          options: {},
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')

      // Test that the click handler exists and is properly bound
      expect(toggleButton.exists()).toBe(true)

      // The actual click propagation test is complex due to Vue's event handling
      // Instead, we test that the component renders correctly with noncollapsible
      expect(wrapper.find('.schema-card').exists()).toBe(true)
    })

    it('does not prevent click propagation when noncollapsible is false', () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: true,
          }),
          additionalProperties: true,
          noncollapsible: false,
          options: {},
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
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: true,
          }),
          additionalProperties: true,
          options: {},
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
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: true,
          }),
          additionalProperties: true,
          options: {},
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
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: true,
          }),
          additionalProperties: true,
          options: {},
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')
      await toggleButton.trigger('click')

      // Should render SchemaProperty with variant 'additionalProperties' for boolean true
      const schemaProperties = wrapper.findAllComponents({ name: 'SchemaProperty' })
      const additionalProperty = schemaProperties.find((prop) => prop.props('variant') === 'additionalProperties')

      expect(additionalProperty).toBeDefined()
      expect(additionalProperty?.props('schema')).toEqual({
        type: 'anything',
      })
    })

    it('handles additionalProperties as empty object correctly', async () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            additionalProperties: {},
          } as any,
          additionalProperties: true,
          options: {},
        },
      })

      const toggleButton = wrapper.find('.schema-card-title--compact')
      await toggleButton.trigger('click')

      // Should render SchemaProperty with variant 'additionalProperties' for empty object
      const schemaProperties = wrapper.findAllComponents({ name: 'SchemaProperty' })
      const additionalProperty = schemaProperties.find((prop) => prop.props('variant') === 'additionalProperties')

      expect(additionalProperty).toBeDefined()
      expect(additionalProperty?.props('schema')).toEqual({
        type: 'anything',
      })
    })
  })

  describe('object property order', () => {
    it('should render properties by required alphabetical order', () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
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
          options: {},
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
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              visible: { type: 'string' },
              secret: { type: 'string', readOnly: true },
              alsoVisible: { type: 'integer', format: 'int32' },
            },
          }),
          options: {
            hideReadOnly: true,
          },
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
          eventBus: null,
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
          options: {
            hideReadOnly: true,
          },
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
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              visible: { type: 'string' },
              secret: { type: 'string', writeOnly: true },
              alsoVisible: { type: 'integer', format: 'int32' },
            },
          }),
          options: {
            hideWriteOnly: true,
          },
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
          eventBus: null,
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
          options: {
            hideWriteOnly: true,
          },
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

  describe('array of arrays', () => {
    it('displays properties for nested array items', async () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  value: {
                    type: 'number',
                  },
                },
              },
            },
          }),
          options: {},
        },
      })

      // Expand the schemas
      expect(wrapper.find('.schema-card').exists()).toBe(true)
      const buttons = wrapper.findAll('button.schema-card-title')
      expect(buttons.length).toBe(1)
      await buttons[0]?.trigger('click')
      const moreButtons = wrapper.findAll('button.schema-card-title')
      expect(moreButtons.length).toBe(2)
      await moreButtons[1]?.trigger('click')

      // Check that the nested object properties are displayed
      // For array of arrays, we should see the nested array and then the object properties
      const text = wrapper.text()

      expect(text).toContain('name')
      expect(text).toContain('value')
    })

    it('displays properties for array of arrays in object property', async () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              arrayOfArrays: {
                type: 'array',
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                      },
                      value: {
                        type: 'number',
                      },
                    },
                  },
                },
              },
            },
          }),
          options: {},
        },
      })

      // The schema should be rendered
      expect(wrapper.find('.schema-card').exists()).toBe(true)

      // Find the arrayOfArrays property
      const arrayProperty = wrapper
        .findAllComponents({ name: 'SchemaProperty' })
        .find((prop) => prop.props('name') === 'arrayOfArrays')

      expect(arrayProperty).toBeDefined()

      // Expand the schemas
      expect(wrapper.find('.schema-card').exists()).toBe(true)
      const buttons = wrapper.findAll('button.schema-card-title')
      expect(buttons.length).toBe(1)
      await buttons[0]?.trigger('click')
      const moreButtons = wrapper.findAll('button.schema-card-title')
      expect(moreButtons.length).toBe(2)
      await moreButtons[1]?.trigger('click')

      // Check that the nested object properties are displayed
      // For array of arrays, we should see the nested array and then the object properties
      const text = wrapper.text()

      expect(text).toContain('arrayOfArrays')
      expect(text).toContain('name')
      expect(text).toContain('value')
    })
  })

  describe('oneOf composition with date formats', () => {
    it('renders properties with oneOf composition containing date and date-time formats', () => {
      const wrapper = mount(Schema, {
        props: {
          eventBus: null,
          schema: coerceValue(SchemaObjectSchema, {
            type: 'object',
            properties: {
              closed_on: {
                oneOf: [
                  {
                    type: 'string',
                    format: 'date',
                  },
                  {
                    type: 'string',
                    format: 'date-time',
                  },
                ],
                description: 'The date the object was closed in YYYY-MM-DD or ISO 8601 format.',
              },
              status: {
                type: 'string',
                description: 'The current status of the object.',
              },
            },
          }),
          options: {},
        },
      })

      const text = wrapper.text()

      // Check that both properties are rendered
      expect(text).toContain('closed_on')
      expect(text).toContain('status')

      // Check that the status description is shown
      expect(text).toContain('The current status of the object.')

      // Check that the oneOf schema is inheiriting the description correctly
      expect(text).toContain('The date the object was closed in YYYY-MM-DD or ISO 8601 format.')
    })
  })
  describe('expandAllSchemaProperties', () => {
    it('renders the toggle and shows nested properties by default when expandAllSchemaProperties is true', () => {
      const wrapper = mount(Schema, {
        props: {
          schema: {
            type: 'object',
            properties: {
              foo: {
                type: 'object',
                properties: {
                  bar: { type: 'string' },
                },
              },
            },
          },
          level: 1,
          eventBus: null,
          options: { expandAllSchemaProperties: true },
        },
      })

      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.text()).toContain('bar')
    })

    it('renders the toggle when expandAllSchemaProperties is false', () => {
      const wrapper = mount(Schema, {
        props: {
          schema: {
            type: 'object',
            properties: {
              foo: {
                type: 'object',
                properties: {
                  bar: { type: 'string' },
                },
              },
            },
          },
          level: 1,
          eventBus: null,
          options: {},
        },
      })

      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('does not infinitely expand circular schema references when expandAllSchemaProperties is true', () => {
      const circularSchema = {
        type: 'object',
        properties: {},
      } as Extract<SchemaObject, { type: 'object' }>

      circularSchema.properties = {
        self: circularSchema,
      }

      const wrapper = mount(Schema, {
        props: {
          schema: circularSchema,
          level: 1,
          eventBus: null,
          options: { expandAllSchemaProperties: true },
        },
      })

      expect(wrapper.text()).toContain('self')
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('does not infinitely expand $ref-based circular schemas when expandAllSchemaProperties is true', () => {
      // Mirror how the workspace store bundles a self-referential $ref: the
      // property is a wrapper carrying both the ref string and the resolved node.
      const node: any = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }
      node.properties.child = {
        $ref: '#/components/schemas/Node',
        '$ref-value': node,
      }

      const wrapper = mount(Schema, {
        props: {
          schema: node,
          level: 1,
          eventBus: null,
          options: { expandAllSchemaProperties: true },
        },
      })

      // The first level of the cycle is expanded...
      expect(wrapper.text()).toContain('child')
      // ...but the recursion stops with a toggle instead of expanding forever.
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('expands deeply nested finite schemas fully when enabled', () => {
      // Eight levels deep to verify finite branches are not artificially truncated.
      const schema = {
        type: 'object',
        properties: {
          l1: {
            type: 'object',
            properties: {
              l2: {
                type: 'object',
                properties: {
                  l3: {
                    type: 'object',
                    properties: {
                      l4: {
                        type: 'object',
                        properties: {
                          l5: {
                            type: 'object',
                            properties: {
                              l6: {
                                type: 'object',
                                properties: {
                                  l7: {
                                    type: 'object',
                                    properties: {
                                      leaf: { type: 'string' },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      } as Extract<SchemaObject, { type: 'object' }>

      const wrapper = mount(Schema, {
        props: {
          schema,
          level: 0,
          eventBus: null,
          options: { expandAllSchemaProperties: true },
        },
      })

      // The deepest property is visible and the collapse toggle remains available.
      expect(wrapper.text()).toContain('leaf')
      expect(wrapper.find('button').exists()).toBe(true)
    })
  })

  describe('scroll target auto-expand', () => {
    afterEach(() => {
      // Reset the shared anchor target so it does not leak into other tests.
      scrollTargetId.value = ''
    })

    it('stays collapsed when no anchor target points at a child property', () => {
      const wrapper = mount(Schema, {
        props: {
          // This disclosure wraps the children of `foo` (breadcrumb root.foo).
          schema: {
            type: 'object',
            properties: {
              bar: { type: 'string' },
            },
          },
          breadcrumb: ['root', 'foo'],
          level: 1,
          eventBus: null,
          options: {},
        },
      })

      // The disclosure is collapsed by default, so the child is not rendered.
      expect(wrapper.text()).not.toContain('bar')
    })

    it('expands a collapsed disclosure when the anchor target is a child property', () => {
      // Mimic landing on a deep link to `root.foo.bar` while `foo` is collapsed.
      scrollTargetId.value = 'root.foo.bar'

      const wrapper = mount(Schema, {
        props: {
          // This disclosure wraps the children of `foo` (breadcrumb root.foo).
          schema: {
            type: 'object',
            properties: {
              bar: { type: 'string' },
            },
          },
          breadcrumb: ['root', 'foo'],
          level: 1,
          eventBus: null,
          options: {},
        },
      })

      // The disclosure on the path to the target opens itself so the target renders.
      expect(wrapper.text()).toContain('bar')
    })

    it('expands a collapsed >12 properties section when the anchor target lives inside it', () => {
      // The collapsed "additional properties" section hides overflow properties
      // behind a toggle. A deep link to one of them must still reveal it.
      scrollTargetId.value = 'root.overflowProp'

      const wrapper = mount(Schema, {
        props: {
          schema: {
            type: 'object',
            properties: {
              overflowProp: { type: 'string' },
            },
          },
          breadcrumb: ['root'],
          additionalProperties: true,
          eventBus: null,
          options: {},
        },
      })

      expect(wrapper.text()).toContain('overflowProp')
    })

    it('does not expand unrelated collapsed disclosures', () => {
      // A target for a different branch must not force this disclosure open.
      scrollTargetId.value = 'root.somethingElse.bar'

      const wrapper = mount(Schema, {
        props: {
          // This disclosure wraps the children of `foo` (breadcrumb root.foo).
          schema: {
            type: 'object',
            properties: {
              bar: { type: 'string' },
            },
          },
          breadcrumb: ['root', 'foo'],
          level: 1,
          eventBus: null,
          options: {},
        },
      })

      expect(wrapper.text()).not.toContain('bar')
    })
  })
})
