import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { Schema } from '@/components/Content/Schema'

import RequestBody from './RequestBody.vue'

describe('RequestBody', () => {
  const defaultRequestOptions = {
    hideModels: false,
    orderRequiredPropertiesFirst: false,
    orderSchemaPropertiesBy: 'alpha' as const,
    expandAllSchemaProperties: false,
  }

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

    expect(wrapper.text()).toContain('Show additional properties')
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
