import { Schema } from '@scalar/blocks/schema'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  OpenAPIDocumentSchema,
  type SchemaObject,
  SchemaObjectSchema,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import { provideLocalization } from '@/features/localization'

import RequestBody from './RequestBody.vue'

describe('RequestBody', () => {
  it.each([1, 13])('uses structural types in a request with %s properties', (count) => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: createWorkspaceEventBus(),
        options: {
          hideModels: false,
          hideModelNames: true,
          expandAllSchemaProperties: true,
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
          schemaKeyboardNav: false,
        },
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                title: 'OrderRequest',
                properties: Object.fromEntries(
                  Array.from({ length: count }, (_, index) => [
                    `customer${index}`,
                    { type: 'object', title: 'Customer', properties: { name: { type: 'string' } } },
                  ]),
                ),
              }),
            },
          },
        },
      },
      slots: { title: 'Body' },
    })
    expect(wrapper.find('[data-testid="request-body-schema-name"]').text()).toBe('·object')
    expect(wrapper.text()).toContain('customer0')
    expect(wrapper.text()).not.toContain('OrderRequest')
    expect(wrapper.text()).not.toContain('Customer')
  })

  const defaultRequestOptions = {
    hideModels: false,
    orderRequiredPropertiesFirst: false,
    orderSchemaPropertiesBy: 'alpha' as const,
    expandAllSchemaProperties: false,
    schemaKeyboardNav: false,
  }

  it('renders selected extensions on request body fields', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: { ...defaultRequestOptions, showExtensions: ['x-owner'] },
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: { name: { type: 'string', 'x-owner': 'Directory team' } },
              }),
            },
          },
        },
      },
    })
    expect(wrapper.text()).toContain('"Directory team"')
  })

  it.each([
    [undefined, 12, 'Show 38 more properties'],
    [1, 1, 'Show 49 more properties'],
    [49, 49, 'Show 1 more property'],
    [50, 50, undefined],
    [100, 50, undefined],
    [0, 50, undefined],
  ])('shows the configured number of request properties with limit %s', async (limit, visibleCount, label) => {
    const properties = Object.fromEntries(
      Array.from({ length: 50 }, (_, index) => [
        `property${String(index + 1).padStart(2, '0')}`,
        { type: 'object', properties: { child: { type: 'string' } } },
      ]),
    )
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: { ...defaultRequestOptions, maxVisibleRequestBodyProperties: limit },
        requestBody: {
          content: {
            'application/json': { schema: coerceValue(SchemaObjectSchema, { type: 'object', properties }) },
          },
        },
      },
    })

    // Child names can appear in collapsed previews, so assert actual property rows.
    const propertyNames = (): string[] => wrapper.findAll('.property-name').map((row) => row.text())
    expect(propertyNames()).toStrictEqual(Object.keys(properties).slice(0, visibleCount))
    const reveal = wrapper.findAll('button').find((button) => button.text().startsWith('Show '))
    expect(reveal?.text()).toBe(label ? `${label} for Request Body` : undefined)
    if (reveal) {
      await reveal.trigger('click')
      expect(propertyNames()).toStrictEqual(Object.keys(properties))
      expect(reveal.isVisible()).toBe(false)
    }
    wrapper.unmount()
  })

  it('counts only request properties and preserves required-first ordering', async () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: { ...defaultRequestOptions, maxVisibleRequestBodyProperties: 1, orderRequiredPropertiesFirst: true },
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                required: ['zebra', 'serverId'],
                properties: {
                  alpha: { type: 'string' },
                  serverId: { type: 'string', readOnly: true },
                  zebra: { type: 'string' },
                },
              }),
            },
          },
        },
      },
    })
    expect(wrapper.findAll('.property-name').map((row) => row.text())).toStrictEqual(['zebra'])
    const reveal = wrapper.findAll('button').find((button) => button.text().startsWith('Show 1 more property'))!
    await reveal.trigger('click')
    expect(wrapper.findAll('.property-name').map((row) => row.text())).toStrictEqual(['zebra', 'alpha'])
    wrapper.unmount()
  })

  it('updates the overflow count when the selected content type changes', async () => {
    const schema = (count: number): SchemaObject =>
      coerceValue(SchemaObjectSchema, {
        type: 'object',
        properties: Object.fromEntries(
          Array.from({ length: count }, (_, index) => [`field${index}`, { type: 'string' }]),
        ),
      })
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: { ...defaultRequestOptions, maxVisibleRequestBodyProperties: 1 },
        requestBody: {
          content: {
            'application/json': { schema: schema(3) },
            'application/xml': { schema: schema(2) },
          },
        },
      },
    })
    expect(wrapper.text()).toContain('Show 2 more properties')
    await wrapper.setProps({ selectedContentType: 'application/xml' })
    expect(wrapper.text()).toContain('Show 1 more property')
    expect(wrapper.text()).not.toContain('Show 2 more properties')
    wrapper.unmount()
  })

  it('still expands nested and overflow properties when expandAllSchemaProperties is enabled', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: { ...defaultRequestOptions, maxVisibleRequestBodyProperties: 1, expandAllSchemaProperties: true },
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  first: { type: 'string' },
                  second: { type: 'object', properties: { child: { type: 'string' } } },
                },
              }),
            },
          },
        },
      },
    })
    expect(wrapper.findAll('.property-name').map((row) => row.text())).toStrictEqual(['first', 'second', 'child'])
    wrapper.unmount()
  })

  it.each([
    [1, '1 weitere Eigenschaft anzeigen'],
    [2, '2 weitere Eigenschaften anzeigen'],
  ])('localizes the overflow label for %s hidden properties', (count, label) => {
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocalization({ locale: 'de' })
          return () =>
            h(RequestBody, {
              eventBus: null,
              options: { ...defaultRequestOptions, maxVisibleRequestBodyProperties: 1 },
              requestBody: {
                content: {
                  'application/json': {
                    schema: coerceValue(SchemaObjectSchema, {
                      type: 'object',
                      properties: Object.fromEntries(
                        Array.from({ length: count + 1 }, (_, index) => [`field${index}`, { type: 'string' }]),
                      ),
                    }),
                  },
                },
              },
            })
        },
      }),
    )
    expect(wrapper.findAll('button').some((button) => button.text().startsWith(label))).toBe(true)
    wrapper.unmount()
  })

  it('renders request body with schema properties', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: defaultRequestOptions,
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  age: { type: 'integer' },
                },
              }),
            },
          },
        },
      },
      slots: {
        title: 'Body',
      },
    })

    expect(wrapper.text()).toContain('Body')
    expect(wrapper.text()).toContain('name')
    expect(wrapper.text()).toContain('age')
  })

  it('displays schema model name from title', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: defaultRequestOptions,
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                title: 'Pet',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
          },
        },
      },
      slots: {
        title: 'Body',
      },
    })

    expect(wrapper.text()).toContain('Pet')
  })

  it('displays schema model name from $ref', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: defaultRequestOptions,
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserRequest',
                type: 'object',
                properties: {
                  email: { type: 'string' },
                },
              } as any,
            },
          },
        },
      },
      slots: {
        title: 'Body',
      },
    })

    expect(wrapper.text()).toContain('CreateUserRequest')
  })

  it('does not display schema model name when not available', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: defaultRequestOptions,
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  data: { type: 'string' },
                },
              }),
            },
          },
        },
      },
      slots: {
        title: 'Body',
      },
    })

    expect(wrapper.find('[data-testid="request-body-schema-name"]').exists()).toBe(false)
  })

  it('renders required badge when request body is required', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: defaultRequestOptions,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
          },
        },
      },
      slots: {
        title: 'Body',
      },
    })

    expect(wrapper.text()).toContain('required')
  })

  it('does not render when request body content is empty', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: defaultRequestOptions,
        requestBody: {
          content: {},
        },
      },
      slots: {
        title: 'Body',
      },
    })

    expect(wrapper.find('.request-body').exists()).toBe(false)
  })

  it('renders description when provided', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: defaultRequestOptions,
        requestBody: {
          description: 'The user data to create',
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
          },
        },
      },
      slots: {
        title: 'Body',
      },
    })

    expect(wrapper.text()).toContain('The user data to create')
  })

  it('renders overflow schema descriptions once', () => {
    const properties = Object.fromEntries(
      Array.from({ length: 13 }, (_, index) => [`property${index + 1}`, { type: 'string' }]),
    )

    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: defaultRequestOptions,
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                description: 'The object schema description',
                properties,
              }),
            },
          },
        },
      },
      slots: {
        title: 'Body',
      },
    })

    expect(wrapper.text()).toContain('Show 1 more property')
    expect(wrapper.text().match(/The object schema description/g)).toHaveLength(1)
  })

  it('keeps operation model names visible when hideModels is enabled', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: {
          ...defaultRequestOptions,
          hideModels: true,
        },
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
          },
        },
      },
      slots: {
        title: 'Body',
      },
    })

    const schema = wrapper.findComponent(Schema)
    expect(schema.props('hideModelNames')).toBe(false)
  })

  it('renders the model name as plain text when hideModels is enabled', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: createWorkspaceEventBus(),
        options: {
          ...defaultRequestOptions,
          hideModels: true,
        },
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserRequest',
                type: 'object',
                properties: {
                  email: { type: 'string' },
                },
              } as any,
            },
          },
        },
      },
      slots: {
        title: 'Body',
      },
    })

    const modelName = wrapper.find('[data-testid="request-body-schema-name"]')
    expect(modelName.text()).toContain('CreateUserRequest')
    expect(modelName.find('button').exists()).toBe(false)
  })

  it('renders the model name as plain text when the referenced model is hidden', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: createWorkspaceEventBus(),
        options: defaultRequestOptions,
        document: coerceValue(OpenAPIDocumentSchema, {
          openapi: '3.1.0',
          info: { title: 'Test', version: '1.0.0' },
          components: {
            schemas: { CreateUserRequest: { type: 'object', 'x-internal': true } },
          },
        }),
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserRequest',
                type: 'object',
                properties: {
                  email: { type: 'string' },
                },
              } as any,
            },
          },
        },
      },
      slots: {
        title: 'Body',
      },
    })

    const modelName = wrapper.find('[data-testid="request-body-schema-name"]')
    expect(modelName.text()).toContain('CreateUserRequest')
    expect(modelName.find('button').exists()).toBe(false)
  })
  it('updates selectedContentType via v-model when changing the content type', async () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: defaultRequestOptions,
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, { type: 'object' }),
            },
            'application/x-www-form-urlencoded': {
              schema: coerceValue(SchemaObjectSchema, { type: 'object' }),
            },
          },
        },
        'selectedContentType': 'application/json',
        'onUpdate:selectedContentType': (e: string) => wrapper.setProps({ selectedContentType: e }),
      },
      slots: {
        title: 'Body',
      },
    })

    const select = wrapper.findComponent({ name: 'ContentTypeSelect' })
    expect(select.exists()).toBe(true)

    await select.vm.$emit('update:modelValue', 'application/x-www-form-urlencoded')

    expect(wrapper.props('selectedContentType')).toBe('application/x-www-form-urlencoded')
  })

  // https://github.com/scalar/scalar/issues/7472
  // A discriminator base renders as a single variant selector. When it has more
  // than twelve properties the body is normally split into visible/collapsed
  // blocks, but a discriminator schema must not be split, otherwise each block
  // would render its own duplicate selector.
  it('renders a single variant selector for a discriminator schema with many properties', () => {
    const properties: Record<string, { type: string }> = { $type: { type: 'string' } }
    for (let index = 0; index < 13; index++) {
      properties[`prop${index}`] = { type: 'string' }
    }

    const baseClass = {
      type: 'object',
      discriminator: {
        propertyName: '$type',
        mapping: {
          Base: '#/components/schemas/BaseClass',
          Derived: '#/components/schemas/DerivedClass',
        },
      },
      properties,
    }

    const document = {
      components: {
        schemas: {
          BaseClass: baseClass,
          DerivedClass: {
            allOf: [
              { $ref: '#/components/schemas/BaseClass' },
              { type: 'object', properties: { derivedInt: { type: 'integer' } } },
            ],
          },
        },
      },
    }

    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        // Expand everything so a duplicate selector in the collapsed block would
        // also be rendered (and therefore caught) rather than hidden.
        options: { ...defaultRequestOptions, expandAllSchemaProperties: true },
        document: document as never,
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, baseClass),
            },
          },
        },
      },
      slots: { title: 'Body' },
    })

    expect(wrapper.findAll('.composition-selector')).toHaveLength(1)
  })
})
