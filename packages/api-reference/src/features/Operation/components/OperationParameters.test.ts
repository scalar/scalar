import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OperationParameters from './OperationParameters.vue'

describe('OperationParameters', () => {
  describe('path parameters', () => {
    it('renders path parameters', async () => {
      const wrapper = mount(OperationParameters, {
        props: {
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
    it('renders query parameters', async () => {
      const wrapper = mount(OperationParameters, {
        props: {
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
  })

  describe('header parameters', () => {
    it('renders header parameters', async () => {
      const wrapper = mount(OperationParameters, {
        props: {
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
    it('renders a required cookie parameter', async () => {
      const wrapper = mount(OperationParameters, {
        props: {
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

    it('renders an optional cookie parameter', async () => {
      const wrapper = mount(OperationParameters, {
        props: {
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
    it('renders request body', async () => {
      const wrapper = mount(OperationParameters, {
        props: {
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

    // TODO: Not implemented yet
    it.skip('renders request body without readOnly properties', async () => {
      const wrapper = mount(OperationParameters, {
        props: {
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

      expect(wrapper.text()).toContain('Body')
      expect(wrapper.text()).toContain('username')
      expect(wrapper.text()).toContain('password')
    })
  })
})
