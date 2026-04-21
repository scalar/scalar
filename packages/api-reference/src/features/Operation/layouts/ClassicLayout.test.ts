import { ScalarListbox } from '@scalar/components'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'
import { REQUEST_BODY_COMPOSITION_INDEX_SYMBOL } from '@/features/Operation/request-body-composition-index'

import ClassicLayout from './ClassicLayout.vue'

const requiredSecurity: RequiredSecurity = { state: 'none', requirements: [] }

type ExtractComponentProps<TComponent> = TComponent extends new () => { $props: infer Props } ? Props : never

const eventBus = createWorkspaceEventBus()

const selectedServer: ServerObject = {
  url: 'https://api.example.com',
}

const operation: OperationObject = {
  summary: 'Create widget',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: coerceValue(SchemaObjectSchema, {
          anyOf: [
            {
              title: 'Primary',
              type: 'object',
              properties: {
                primaryOnlyField: {
                  type: 'string',
                },
              },
              required: ['primaryOnlyField'],
            },
            {
              title: 'Secondary',
              type: 'object',
              properties: {
                secondaryOnlyField: {
                  type: 'integer',
                },
              },
              required: ['secondaryOnlyField'],
            },
          ],
        }),
      },
    },
  },
}

const nestedOperation: OperationObject = {
  summary: 'Create nested widget',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: coerceValue(SchemaObjectSchema, {
          type: 'object',
          properties: {
            payload: {
              anyOf: [
                {
                  title: 'Nested Primary',
                  type: 'object',
                  properties: {
                    nestedPrimaryOnlyField: {
                      type: 'string',
                    },
                  },
                  required: ['nestedPrimaryOnlyField'],
                },
                {
                  title: 'Nested Secondary',
                  type: 'object',
                  properties: {
                    nestedSecondaryOnlyField: {
                      type: 'integer',
                    },
                  },
                  required: ['nestedSecondaryOnlyField'],
                },
              ],
            },
          },
          required: ['payload'],
        }),
      },
    },
  },
}

const props: ExtractComponentProps<typeof ClassicLayout> = {
  id: 'create-widget',
  clientOptions: [
    {
      label: 'Shell',
      key: 'shell',
      options: [
        {
          clientKey: 'curl',
          id: 'shell/curl',
          label: 'cURL',
          lang: 'curl',
          targetKey: 'shell',
          targetTitle: 'Shell',
          title: 'Shell cURL',
        },
      ],
    },
  ],
  eventBus,
  isCollapsed: false,
  isWebhook: false,
  method: 'post',
  operation,
  options: {
    expandAllResponses: false,
    hideModels: false,
    hideTestRequestButton: true,
    layout: 'classic',
    orderRequiredPropertiesFirst: false,
    orderSchemaPropertiesBy: 'alpha',
    showOperationId: false,
  },
  path: '/widgets',
  requiredSecurity,
  selectedClient: 'shell/curl',
  selectedSecuritySchemes: [],
  selectedServer,
}

const nestedProps: ExtractComponentProps<typeof ClassicLayout> = {
  ...props,
  id: 'create-nested-widget',
  operation: nestedOperation,
}

const getRequestBodyCompositionSelection = (wrapper: ReturnType<typeof mount>) =>
  (
    wrapper.vm.$ as unknown as {
      provides: Record<PropertyKey, unknown>
    }
  ).provides[REQUEST_BODY_COMPOSITION_INDEX_SYMBOL] as
    | {
        value: Record<string, number>
      }
    | undefined

describe('ClassicLayout', () => {
  it('updates shared request body composition state when the root selection changes', async () => {
    const wrapper = mount(ClassicLayout, {
      props,
      global: {
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<a><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(true)

    const compositionSelector = wrapper.findComponent(ScalarListbox)
    const listboxOptions = compositionSelector.props('options')
    await compositionSelector.vm.$emit('update:modelValue', listboxOptions[1])
    await nextTick()
    await nextTick()

    expect(getRequestBodyCompositionSelection(wrapper)?.value).toStrictEqual({
      'requestBody.anyOf': 1,
    })
  })

  it('updates shared request body composition state when a nested selection changes', async () => {
    const wrapper = mount(ClassicLayout, {
      props: nestedProps,
      global: {
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<a><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(true)

    const compositionSelector = wrapper.findComponent(ScalarListbox)
    const listboxOptions = compositionSelector.props('options')
    await compositionSelector.vm.$emit('update:modelValue', listboxOptions[1])
    await nextTick()
    await nextTick()

    expect(getRequestBodyCompositionSelection(wrapper)?.value).toStrictEqual({
      'requestBody.payload.anyOf': 1,
    })
  })
  it('updates the code sample when the body content type is changed', async () => {
    const multiContentProps: ExtractComponentProps<typeof ClassicLayout> = {
      ...props,
      id: 'create-widget-multi-content',
      operation: {
        ...operation,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: { foo: { type: 'string' } },
              }),
            },
            'application/x-www-form-urlencoded': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: { bar: { type: 'string' } },
              }),
            },
          },
        },
      },
    }

    const wrapper = mount(ClassicLayout, {
      props: multiContentProps,
      global: {
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<a><slot /></a>',
          },
        },
      },
    })

    const requestBody = wrapper.findComponent({ name: 'RequestBody' })
    await requestBody.vm.$emit('update:selectedContentType', 'application/x-www-form-urlencoded')
    await nextTick()

    const codeSample = wrapper.findComponent({ name: 'OperationCodeSample' })
    expect(codeSample.props('selectedContentType')).toBe('application/x-www-form-urlencoded')
  })
})
