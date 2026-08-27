import { apiReferenceConfigurationSchema } from '@scalar/schemas/api-reference'
import { coerce } from '@scalar/validation'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { OpenAPIDocumentSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import Operation from '@/features/Operation/Operation.vue'

import { provideDocumentOutline } from './use-document-outline'

const eventBus = createWorkspaceEventBus()
const workspaceStore = createWorkspaceStore()

const document = coerceValue(OpenAPIDocumentSchema, {
  openapi: '3.1.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/users/{userId}': {
      get: { operationId: 'getUserById', summary: 'Get user by ID' },
    },
  },
  components: { schemas: {} },
})

const operationProps = {
  id: 'test-operation',
  method: 'get' as const,
  securitySchemes: {},
  options: coerce(apiReferenceConfigurationSchema, {
    layout: 'modern',
    theme: 'default',
  }),
  document,
  path: '/users/{userId}',
  pathValue: document.paths?.['/users/{userId}'],
  server: null,
  clientOptions: [],
  isCollapsed: false,
  authStore: workspaceStore.auth,
  isWebhook: false,
  selectedClient: 'c/fetch',
  selectedExample: '',
  eventBus,
}

const mountOperation = (composed: boolean) =>
  mount(
    defineComponent({
      setup() {
        if (composed) {
          provideDocumentOutline('document')
        }
        return () => h(Operation, operationProps)
      },
    }),
    {
      global: {
        stubs: { RouterLink: { name: 'RouterLink', template: '<a><slot /></a>' } },
      },
    },
  )

describe('document outline on a real Operation', () => {
  it('is the h1 when rendered on its own', () => {
    // What ssg-docs does for a standalone one-operation page — DOC-6034. No
    // configuration: the block assumes it is the page.
    const wrapper = mountOperation(false)

    expect(wrapper.find('h1').text()).toContain('Get user by ID')
    expect(wrapper.find('h3').exists()).toBe(false)
  })

  it('is an h3 when composed into a full reference outline', () => {
    const wrapper = mountOperation(true)

    expect(wrapper.find('h3').text()).toContain('Get user by ID')
    expect(wrapper.find('h1').exists()).toBe(false)
  })
})
