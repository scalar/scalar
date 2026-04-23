import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import OperationParameters from './OperationParameters.vue'

describe('OperationParameters', () => {
  const defaultSchemaOptions = {
    hideModels: false,
    orderRequiredPropertiesFirst: false,
    orderSchemaPropertiesBy: 'alpha' as const,
  }

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
    it('renders query parameters', () => {
      const wrapper = mount(OperationParameters, {
        props: {
          eventBus: null,
          options: defaultSchemaOptions,
          parameters: [
            {
              in: 'query',
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
