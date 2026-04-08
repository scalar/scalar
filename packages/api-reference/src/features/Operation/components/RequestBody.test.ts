import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RequestBody from './RequestBody.vue'

describe('RequestBody', () => {
  it('renders request body with schema properties', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: {
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
        },
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
        options: {
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
        },
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
        options: {
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
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

    expect(wrapper.text()).toContain('CreateUserRequest')
  })

  it('does not display schema model name when not available', () => {
    const wrapper = mount(RequestBody, {
      props: {
        eventBus: null,
        options: {
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
        },
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
        options: {
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
        },
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
        options: {
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
        },
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
        options: {
          orderRequiredPropertiesFirst: false,
          orderSchemaPropertiesBy: 'alpha',
        },
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
})
