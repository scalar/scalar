import type { ClientOptionGroup, CodeExampleProps } from '@scalar/blocks/code-example'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { mount, shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, vShow, withDirectives } from 'vue'

import RequestCodeSnippet from './RequestCodeSnippet.vue'

/** Minimal event bus mock - only the emit method is used by the component */
const createEventBus = () =>
  ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }) as unknown as WorkspaceEventBus

type Props = CodeExampleProps & { eventBus: WorkspaceEventBus }

/** Creates props with sensible defaults, allowing overrides */
const createProps = (overrides: Partial<Props> = {}): Props => ({
  clientOptions: [] as ClientOptionGroup[],
  eventBus: createEventBus(),
  operation: { operationId: 'test' } as OperationObject,
  method: 'get',
  path: '/test',
  securitySchemes: [],
  globalCookies: [],
  integration: 'client',
  ...overrides,
})

describe('RequestCodeSnippet', () => {
  it('follows the selected request example and shows missing samples as a status', async () => {
    const wrapper = mount(RequestCodeSnippet, {
      props: createProps({
        selectedClient: 'custom/python',
        selectedExample: 'first',
        operation: {
          requestBody: {
            content: {
              'application/json': {
                examples: {
                  first: { value: { name: 'First' } },
                  second: { value: { name: 'Second' } },
                  missing: { value: {} },
                },
              },
            },
          },
          'x-codeSamples': [
            { lang: 'python', example: 'first', source: 'create("First")' },
            { lang: 'python', example: 'second', source: 'create("Second")' },
          ],
        },
      }),
    })

    await wrapper.get('button[aria-expanded]').trigger('click')
    expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).props('content')).toBe('create("First")')

    await wrapper.setProps({ selectedExample: 'second' })
    expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).props('content')).toBe('create("Second")')
    expect(wrapper.findComponent({ name: 'ScalarCombobox' }).props('modelValue').id).toBe('custom/python')

    await wrapper.setProps({ selectedExample: 'missing' })
    expect(wrapper.get('[role="status"]').text()).toBe('No code sample available for this example.')
    expect(wrapper.findComponent({ name: 'ScalarCodeBlock' }).exists()).toBe(false)
    wrapper.unmount()
  })

  describe('visibility', () => {
    it('is visible when client options are available', () => {
      const clientOptions: ClientOptionGroup[] = [
        {
          label: 'Shell',
          key: 'shell',
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

      const wrapper = shallowMount(RequestCodeSnippet, {
        props: createProps({ clientOptions }),
      })

      expect(wrapper.find('collapsible-section-stub').isVisible()).toBe(true)
    })

    it('is visible when operation has x-codeSamples', () => {
      const operation = {
        operationId: 'test',
        'x-codeSamples': [
          {
            lang: 'python',
            label: 'Custom Python',
            source: 'print("hello")',
          },
        ],
      } as OperationObject

      const wrapper = shallowMount(RequestCodeSnippet, {
        props: createProps({ operation }),
      })

      expect(wrapper.find('collapsible-section-stub').isVisible()).toBe(true)
    })

    it('is visible when operation has x-custom-examples', () => {
      const operation = {
        operationId: 'test',
        'x-custom-examples': [
          {
            lang: 'javascript',
            source: 'fetch("/api")',
          },
        ],
      } as OperationObject

      const wrapper = shallowMount(RequestCodeSnippet, {
        props: createProps({ operation }),
      })

      expect(wrapper.find('collapsible-section-stub').isVisible()).toBe(true)
    })

    it('is hidden when no clients and no custom samples exist', () => {
      const wrapper = shallowMount(RequestCodeSnippet, {
        props: createProps(),
      })

      expect(wrapper.find('collapsible-section-stub').exists()).toBe(false)
    })

    /**
     * The parent (RequestBlock) puts its own `v-show` on this component. Two v-shows
     * write the same root `style.display`, and the parent's truthy one wins, so a
     * `v-show` here would leave an empty "Code Snippet" section on screen.
     *
     * @see https://github.com/scalar/scalar/issues/7986
     */
    it('stays hidden even when a parent v-show is truthy', () => {
      const Parent = defineComponent({
        render: () => withDirectives(h(RequestCodeSnippet, createProps()), [[vShow, true]]),
      })

      const wrapper = mount(Parent)

      expect(wrapper.text()).not.toContain('Code Snippet')
    })
  })
})
