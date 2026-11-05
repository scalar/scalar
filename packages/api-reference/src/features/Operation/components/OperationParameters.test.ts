import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import {
  type ParameterWithSchemaObject,
  type SchemaObject,
  SchemaObjectSchema,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { scrollTargetId } from '@/helpers/lazy-bus'

import OperationParameters from './OperationParameters.vue'

describe('OperationParameters', () => {
  const defaultSchemaOptions = {
    expandAllParameters: true,
    hideModels: false,
    orderRequiredPropertiesFirst: false,
    orderSchemaPropertiesBy: 'alpha' as const,
    expandAllSchemaProperties: false,
    maxVisibleRequestBodyProperties: 12,
    schemaKeyboardNav: false,
  }

  afterEach(() => {
    scrollTargetId.value = ''
  })

  const filterParameter = (count: number): ParameterWithSchemaObject & { schema: SchemaObject } => ({
    in: 'query' as const,
    name: 'filters',
    style: 'deepObject' as const,
    explode: true,
    description: 'Narrow the list.',
    schema: coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: Object.fromEntries(
        Array.from({ length: count }, (_, index) => [
          `field${index}`,
          { type: 'string', description: `Field ${index}`, enum: ['open', 'done'] },
        ]),
      ),
    }),
  })

  it.each([true, false])('keeps five flattened fields visible with expandAllParameters=%s', (expandAllParameters) => {
    const wrapper = mount(OperationParameters, {
      props: {
        eventBus: null,
        options: { ...defaultSchemaOptions, expandAllParameters },
        parameters: [filterParameter(5)],
      },
    })
    for (const index of [0, 1, 2, 3, 4]) {
      expect(wrapper.text()).toContain(`filters[field${index}]`)
    }
    expect(wrapper.findAll('button').some((button) => button.text().startsWith('filtersobject'))).toBe(false)
  })

  it.each([true, false])('groups six fields and preserves detail expansion=%s', async (expandAllParameters) => {
    const wrapper = mount(OperationParameters, {
      props: {
        eventBus: null,
        options: { ...defaultSchemaOptions, expandAllParameters },
        parameters: [filterParameter(6), { in: 'query', name: 'page', schema: { type: 'integer' } }],
      },
    })
    const group = wrapper.get('button[aria-expanded]')
    expect(group.attributes('aria-expanded')).toBe('false')
    expect(group.text()).toContain('filters')
    expect(group.text()).toContain('object')
    expect(group.text()).toContain('Narrow the list.')
    expect(wrapper.text()).toContain('page')
    expect(wrapper.text()).not.toContain('filters[field0]')
    await group.trigger('click')
    for (const index of [0, 1, 2, 3, 4, 5]) {
      expect(wrapper.text()).toContain(`filters[field${index}]`)
    }
    if (expandAllParameters) {
      expect(wrapper.text()).toContain('done')
    } else {
      expect(wrapper.text()).not.toContain('done')
      const child = wrapper.findAll('button').find((button) => button.text().includes('filters[field0]'))!
      await child.trigger('click')
      expect(wrapper.text()).toContain('done')
    }
    await group.trigger('click')
    expect(wrapper.text()).not.toContain('filters[field0]')
  })

  it('counts resolved nested fields and opens a group for an existing field link', () => {
    scrollTargetId.value = 'operation.query.filters[range][field5]'
    const wrapper = mount(OperationParameters, {
      props: {
        eventBus: null,
        breadcrumb: ['operation'],
        options: defaultSchemaOptions,
        parameters: [
          {
            ...filterParameter(0),
            schema: {
              $ref: '#/components/schemas/Filter',
              '$ref-value': coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: { range: filterParameter(6).schema },
              }),
            },
          },
        ],
      },
    })
    expect(wrapper.get('button[aria-expanded]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('filters[range][field5]')
    expect(wrapper.find('[id="operation.query.filters[range][field5]"]').exists()).toBe(true)
  })

  it('opens an already mounted group for a field link and keeps it open after navigation', async () => {
    const wrapper = mount(OperationParameters, {
      props: {
        eventBus: null,
        breadcrumb: ['operation'],
        options: defaultSchemaOptions,
        parameters: [filterParameter(6)],
      },
    })
    expect(wrapper.get('button[aria-expanded]').attributes('aria-expanded')).toBe('false')
    scrollTargetId.value = 'operation.query.filters[field5]'
    await nextTick()
    expect(wrapper.text()).toContain('filters[field5]')
    scrollTargetId.value = ''
    await nextTick()
    expect(wrapper.get('button[aria-expanded]').attributes('aria-expanded')).toBe('true')
    await wrapper.get('button[aria-expanded]').trigger('click')
    expect(wrapper.text()).not.toContain('filters[field5]')
  })

  it.each(['path', 'query', 'header', 'cookie'] as const)(
    'opens and closes scalar %s parameter details when expansion is disabled',
    async (location) => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: { ...defaultSchemaOptions, expandAllParameters: false },
          parameters: [
            {
              in: location,
              name: 'limit',
              required: true,
              schema: { type: 'integer', enum: [10, 20] },
            },
          ],
        },
      })
      const toggle = wrapper.get('button[aria-expanded]')
      expect(toggle.attributes('aria-expanded')).toBe('false')
      expect(toggle.text()).toContain('limit')
      expect(toggle.text()).toContain('integer')
      expect(toggle.text()).toContain('required')
      expect(wrapper.text()).not.toContain('20')
      await toggle.trigger('click')
      expect(toggle.attributes('aria-expanded')).toBe('true')
      expect(wrapper.text()).toContain('20')
      await toggle.trigger('click')
      expect(toggle.attributes('aria-expanded')).toBe('false')
      expect(wrapper.text()).not.toContain('20')
    },
  )

  it('keeps details visible when parameter expansion is enabled', () => {
    const wrapper = mount(OperationParameters, {
      props: {
        eventBus: null,
        options: defaultSchemaOptions,
        parameters: [{ in: 'query', name: 'limit', schema: { type: 'integer', enum: [10, 20] } }],
      },
    })
    expect(wrapper.text()).toContain('20')
    expect(wrapper.find('button[aria-expanded]').exists()).toBe(false)
  })

  it('renders a querystring parameter content schema without crashing', () => {
    const wrapper = mount(OperationParameters, {
      props: {
        eventBus: null,
        options: defaultSchemaOptions,
        parameters: [
          {
            name: 'metadata',
            in: 'querystring',
            required: true,
            description: 'The entire query string.',
            content: {
              'application/json': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'object',
                  properties: { term: { type: 'string' } },
                }),
              },
            },
          },
        ],
      },
    })
    expect(wrapper.text()).toContain('Query Parameters')
    expect(wrapper.text()).toContain('metadata')
    expect(wrapper.text()).toContain('The entire query string.')
    expect(wrapper.text()).toContain('term')
  })

  describe('path parameters', () => {
    it('renders path parameters', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: 'path',
              name: 'userId',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: true,
              deprecated: false,
            },
          ],
        },
      })

      expect(wrapper.text()).toContain('Path Parameters')
      expect(wrapper.text()).toContain('userId')
      expect(wrapper.text()).toContain('required')
    })
  })

  describe('query parameters', () => {
    it.each(['query', 'querystring'] as const)('renders %s parameters', (location) => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: location,
              name: 'search',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
            },
          ],
        },
      })

      expect(wrapper.text()).toContain('Query Parameters')
      expect(wrapper.text()).toContain('search')
    })

    it('renders deepObject query parameters as flattened bracket names', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: 'query',
              name: 'page',
              style: 'deepObject',
              explode: true,
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  number: {
                    type: 'integer',
                    minimum: 1,
                    default: 1,
                    description: 'Page number',
                  },
                  size: {
                    type: 'integer',
                    minimum: 1,
                    default: 15,
                    description: 'Page size',
                  },
                },
                required: ['number'],
              }),
              required: false,
              deprecated: false,
            },
          ],
        },
      })

      expect(wrapper.text()).toContain('Query Parameters')
      expect(wrapper.text()).toContain('page[number]')
      expect(wrapper.text()).toContain('page[size]')
      expect(wrapper.text()).toContain('Page number')
      expect(wrapper.text()).toContain('Page size')
      expect(wrapper.text()).not.toContain('pageobject')
    })

    it('renders nested deepObject query properties with recursive bracket names', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: 'query',
              name: 'filter',
              style: 'deepObject',
              explode: true,
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  pagination: {
                    type: 'object',
                    properties: {
                      number: {
                        type: 'integer',
                      },
                    },
                  },
                },
              }),
              required: false,
              deprecated: false,
            },
          ],
        },
      })

      expect(wrapper.text()).toContain('filter[pagination][number]')
    })

    it('does not re-add the top-level deepObject parameter when a nested object has empty properties', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: 'query',
              name: 'filter',
              style: 'deepObject',
              explode: true,
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  pagination: {
                    type: 'object',
                    properties: {},
                  },
                  status: {
                    type: 'string',
                  },
                },
              }),
              required: false,
              deprecated: false,
            },
          ],
        },
      })

      const queryParameterNames = wrapper
        .findAllComponents({ name: 'ParameterListItem' })
        .map((item) => item.props('name'))

      expect(queryParameterNames).toStrictEqual(['filter[pagination]', 'filter[status]'])
    })
  })

  describe('header parameters', () => {
    it('renders header parameters', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: 'header',
              name: 'Authorization',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: true,
              deprecated: false,
            },
          ],
        },
      })

      expect(wrapper.text()).toContain('Headers')
      expect(wrapper.text()).toContain('Authorization')
      expect(wrapper.text()).toContain('required')
    })
  })

  describe('cookie parameters', () => {
    it('renders a required cookie parameter', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: 'cookie',
              name: 'debug',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'integer',
                enum: [0, 1],
                default: 0,
              }),
              deprecated: false,
              required: true,
            },
          ],
        },
      })

      expect(wrapper.text()).toContain('Cookies')
      expect(wrapper.text()).toContain('debug')
      expect(wrapper.text()).toContain('required')
    })

    it('renders an optional cookie parameter', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: 'cookie',
              name: 'csrftoken',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
                default: 'the-example-token',
              }),
              deprecated: true,
              required: false,
            },
          ],
        },
      })

      expect(wrapper.text()).toContain('Cookies')
      expect(wrapper.text()).toContain('csrftoken')
      expect(wrapper.text()).toContain('the-example-token')
    })
  })

  describe('request body', () => {
    it('renders request body', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          options: defaultSchemaOptions,
          eventBus: null,
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
      })

      expect(wrapper.text()).toContain('Body')
      expect(wrapper.text()).toContain('name')
      expect(wrapper.text()).toContain('age')
    })

    it('renders request body without readOnly properties', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          requestBody: {
            content: {
              'application/json': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'object',
                  properties: {
                    regularProperty: {
                      type: 'string',
                    },
                    readOnlyProperty: {
                      type: 'string',
                      readOnly: true,
                    },
                    writeOnlyProperty: {
                      type: 'string',
                      writeOnly: true,
                    },
                  },
                }),
              },
            },
          },
        },
      })

      expect(wrapper.text()).toContain('Body')
      expect(wrapper.text()).toContain('regularProperty')
      expect(wrapper.text()).not.toContain('readOnlyProperty')
      expect(wrapper.text()).toContain('writeOnlyProperty')
    })
  })

  describe('form data', () => {
    it('renders form data parameters', async () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          requestBody: {
            content: {
              'application/x-www-form-urlencoded': {
                schema: coerceValue(SchemaObjectSchema, {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                  },
                }),
              },
            },
          },
        },
      })

      await nextTick()

      expect(wrapper.text()).toContain('Body')
      expect(wrapper.text()).toContain('username')
      expect(wrapper.text()).toContain('password')
    })
  })

  describe('parameter filtering', () => {
    it('filters out parameters with x-internal flag set to true', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: 'query',
              name: 'param1',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
            },
            {
              in: 'query',
              name: 'param2',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
              'x-internal': true,
            },
            {
              in: 'query',
              name: 'param3',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
            },
          ],
        },
      })

      expect(wrapper.text()).toContain('param1')
      expect(wrapper.text()).not.toContain('param2')
      expect(wrapper.text()).toContain('param3')
    })

    it('filters out parameters with x-scalar-ignore flag set to true', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: 'query',
              name: 'param1',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
            },
            {
              in: 'query',
              name: 'param2',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
              'x-scalar-ignore': true,
            },
            {
              in: 'query',
              name: 'param3',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
            },
          ],
        },
      })

      expect(wrapper.text()).toContain('param1')
      expect(wrapper.text()).not.toContain('param2')
      expect(wrapper.text()).toContain('param3')
    })

    it('filters out parameters with both ignore flags', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: 'query',
              name: 'param1',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
            },
            {
              in: 'query',
              name: 'param2',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
              'x-internal': true,
              'x-scalar-ignore': true,
            },
            {
              in: 'query',
              name: 'param3',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
              'x-internal': true,
            },
            {
              in: 'query',
              name: 'param4',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
              'x-scalar-ignore': true,
            },
            {
              in: 'query',
              name: 'param5',
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
              required: false,
              deprecated: false,
            },
          ],
        },
      })

      expect(wrapper.text()).toContain('param1')
      expect(wrapper.text()).not.toContain('param2')
      expect(wrapper.text()).not.toContain('param3')
      expect(wrapper.text()).not.toContain('param4')
      expect(wrapper.text()).toContain('param5')
    })
  })
})
