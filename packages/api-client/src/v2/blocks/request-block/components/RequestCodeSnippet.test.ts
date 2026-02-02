import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import type { ClientOptionGroup } from '@/v2/blocks/operation-code-sample'

import RequestCodeSnippet from './RequestCodeSnippet.vue'

const mockEventBus = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}

const defaultProps = {
  clientOptions: [],
  eventBus: mockEventBus,
  operation: { operationId: 'test' } as OperationObject,
  method: 'get' as const,
  path: '/test',
  securitySchemes: [],
  globalCookies: [],
  integration: 'client' as const,
}

const defaultStubs = {
  CollapsibleSection: {
    template: '<div data-testid="collapsible-section"><slot name="title" /><slot name="actions" /><slot /></div>',
    props: ['defaultOpen'],
  },
  ScalarCombobox: {
    template: '<div><slot /></div>',
    props: ['modelValue', 'options', 'placement'],
    emits: ['update:modelValue'],
  },
  ScalarButton: {
    template: '<button><slot /></button>',
    props: ['variant', 'class'],
  },
  ScalarIconCaretDown: {
    template: '<span></span>',
    props: ['class', 'weight'],
  },
  ScalarCodeBlock: {
    template: '<div data-testid="code-block"></div>',
    props: ['content', 'hideCredentials', 'lang', 'lineNumbers', 'class'],
  },
  ScalarErrorBoundary: {
    template: '<div><slot /></div>',
  },
  DataTable: {
    template: '<div><slot /></div>',
    props: ['columns', 'presentational'],
  },
  DataTableRow: {
    template: '<div><slot /></div>',
  },
}

describe('RequestCodeSnippet', () => {
  it('renders code snippet when client options are available', async () => {
    const clientOptions: ClientOptionGroup[] = [
      {
        label: 'Shell',
        options: [
          {
            id: 'shell/curl',
            lang: 'curl',
            title: 'Shell cURL',
            label: 'cURL',
            targetKey: 'shell',
            targetTitle: 'Shell',
            clientKey: 'curl',
          },
        ],
      },
    ]

    const wrapper = mount(RequestCodeSnippet, {
      props: {
        ...defaultProps,
        clientOptions,
      },
      global: {
        stubs: defaultStubs,
      },
    })

    await nextTick()

    // The CollapsibleSection should be visible when clients are available
    const collapsibleSection = wrapper.find('[data-testid="collapsible-section"]')
    expect(collapsibleSection.exists()).toBe(true)
    // Check that the component is rendered and visible (v-show="true")
    expect(wrapper.html()).toContain('Code Snippet')
    // Verify the element is visible (not hidden by v-show)
    expect(collapsibleSection.isVisible()).toBe(true)
  })

  it('renders code snippet with x-codeSamples when hiddenClients is true', async () => {
    const operation: OperationObject = {
      operationId: 'test',
      'x-codeSamples': [
        {
          lang: 'python',
          label: 'Custom Python Example',
          source: 'import requests\nresponse = requests.get("https://api.example.com/test")',
        },
      ],
    } as OperationObject

    const wrapper = mount(RequestCodeSnippet, {
      props: {
        ...defaultProps,
        clientOptions: [], // Empty array simulates hiddenClients: true
        operation,
      },
      global: {
        stubs: defaultStubs,
      },
    })

    await nextTick()

    // The CollapsibleSection should be visible because custom code samples exist
    const collapsibleSection = wrapper.find('[data-testid="collapsible-section"]')
    expect(collapsibleSection.exists()).toBe(true)
    // Verify the element is visible (not hidden by v-show)
    expect(collapsibleSection.isVisible()).toBe(true)
    expect(wrapper.html()).toContain('Code Snippet')
  })

  it('does not render when hiddenClients is true and no custom samples', async () => {
    const operation: OperationObject = {
      operationId: 'test',
    } as OperationObject

    const wrapper = mount(RequestCodeSnippet, {
      props: {
        ...defaultProps,
        clientOptions: [], // Empty array simulates hiddenClients: true
        operation,
      },
      global: {
        stubs: defaultStubs,
      },
    })

    await nextTick()

    // With v-show="false", the element exists in DOM but is hidden
    // The CollapsibleSection element exists but is not visible
    const collapsibleSection = wrapper.find('[data-testid="collapsible-section"]')
    expect(collapsibleSection.exists()).toBe(true)
    // Verify the element is hidden (v-show="false" sets display: none)
    expect(collapsibleSection.isVisible()).toBe(false)
  })
})
