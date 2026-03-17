import { ScalarListbox } from '@scalar/components'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import ClassicLayout from './ClassicLayout.vue'

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

const props: ExtractComponentProps<typeof ClassicLayout> = {
  id: 'create-widget',
  clientOptions: [
    {
      label: 'Shell',
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
    hideTestRequestButton: true,
    layout: 'classic',
    orderRequiredPropertiesFirst: false,
    orderSchemaPropertiesBy: 'alpha',
    showOperationId: false,
  },
  path: '/widgets',
  selectedClient: 'shell/curl',
  selectedSecuritySchemes: [],
  selectedServer,
}

describe('ClassicLayout', () => {
  it('updates the code sample when the request body composition selection changes', async () => {
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

    const codeBlock = wrapper.findComponent({ name: 'ScalarCodeBlock' })
    const initialContent = codeBlock.props('content')

    expect(codeBlock.exists()).toBe(true)
    expect(typeof initialContent).toBe('string')
    expect(initialContent.includes('primaryOnlyField')).toBe(true)
    expect(initialContent.includes('secondaryOnlyField')).toBe(false)

    const compositionSelector = wrapper.findComponent(ScalarListbox)
    const listboxOptions = compositionSelector.props('options')
    await compositionSelector.vm.$emit('update:modelValue', listboxOptions[1])
    await nextTick()
    await nextTick()

    const updatedContent = wrapper.findComponent({ name: 'ScalarCodeBlock' }).props('content')

    expect(updatedContent.includes('primaryOnlyField')).toBe(false)
    expect(updatedContent.includes('secondaryOnlyField')).toBe(true)
  })
})
