import { type ClientOptionGroup, DEFAULT_CLIENT } from '@scalar/blocks/code-example'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ClientSelector from './ClientSelector.vue'

describe('ClientLibraries', () => {
  const eventBus = createWorkspaceEventBus()
  const mockClientOptions: ClientOptionGroup[] = [
    {
      label: 'Shell',
      key: 'shell',
      options: [
        {
          id: 'shell/curl',
          label: 'cURL',
          lang: 'curl',
          title: 'Shell cURL',
          targetKey: 'shell',
          targetTitle: 'Shell',
          clientKey: 'curl',
        },
        {
          id: 'shell/httpie',
          label: 'HTTPie',
          lang: 'shell',
          title: 'Shell HTTPie',
          targetKey: 'shell',
          targetTitle: 'Shell',
          clientKey: 'httpie',
        },
      ],
    },
    {
      label: 'Node.js',
      key: 'node',
      options: [
        {
          id: 'node/undici',
          label: 'Undici',
          lang: 'node',
          title: 'Node.js Undici',
          targetKey: 'node',
          targetTitle: 'Node.js',
          clientKey: 'undici',
        },
      ],
    },
  ]

  describe('default client selection', () => {
    it('uses DEFAULT_CLIENT when no selectedClient is provided', () => {
      const wrapper = mount(ClientSelector, {
        props: {
          clientOptions: mockClientOptions,
          eventBus,
          // selectedClient is not provided, should default to DEFAULT_CLIENT
        },
        global: {
          stubs: {
            'ScalarCodeBlock': true,
            'ScalarMarkdown': true,
            'ClientSelector': true,
          },
        },
      })

      // The component should render with the default client
      expect(wrapper.exists()).toBe(true)

      // The selectedClientOption computed property should resolve to the default client
      const vm = wrapper.vm
      expect(vm.selectedClientOption?.id).toBe(DEFAULT_CLIENT)
    })

    it('uses provided selectedClient when available', () => {
      const customClient = 'node/undici'

      const wrapper = mount(ClientSelector, {
        props: {
          clientOptions: mockClientOptions,
          eventBus,
          selectedClient: customClient,
        },
        global: {
          stubs: {
            'ScalarCodeBlock': true,
            'ScalarMarkdown': true,
            'ClientSelector': true,
          },
        },
      })

      // The component should render with the custom client
      expect(wrapper.exists()).toBe(true)

      // The selectedClientOption computed property should resolve to the custom client
      const vm = wrapper.vm
      expect(vm.selectedClientOption?.id).toBe(customClient)
    })

    it('ignores a custom sample selection and falls back to the default client', () => {
      const wrapper = mount(ClientSelector, {
        props: {
          clientOptions: mockClientOptions,
          eventBus,
          // A custom sample is operation-specific and not a generic client
          selectedClient: 'custom/python',
        },
        global: {
          stubs: {
            'ScalarCodeBlock': true,
            'ScalarMarkdown': true,
            'ClientSelector': true,
          },
        },
      })

      // The introduction selector only represents generic clients, so a custom
      // sample should not be reflected here
      const vm = wrapper.vm
      expect(vm.selectedClientOption?.id).toBe(DEFAULT_CLIENT)
    })

    it('keeps the last generic client when the global selection switches to a custom sample', async () => {
      const wrapper = mount(ClientSelector, {
        props: {
          clientOptions: mockClientOptions,
          eventBus,
          selectedClient: 'node/undici',
        },
        global: {
          stubs: {
            'ScalarCodeBlock': true,
            'ScalarMarkdown': true,
            'ClientSelector': true,
          },
        },
      })

      const vm = wrapper.vm
      expect(vm.selectedClientOption?.id).toBe('node/undici')

      // Picking a custom example elsewhere updates the global client, but the
      // introduction selector should stay on the previously selected generic one
      await wrapper.setProps({ selectedClient: 'custom/python' })
      expect(vm.selectedClientOption?.id).toBe('node/undici')
    })

    it('handles undefined selectedClient gracefully', () => {
      const wrapper = mount(ClientSelector, {
        props: {
          clientOptions: mockClientOptions,
          eventBus,
          selectedClient: undefined,
        },
        global: {
          stubs: {
            'ScalarCodeBlock': true,
            'ScalarMarkdown': true,
            'ClientSelector': true,
          },
        },
      })

      // The component should render without errors
      expect(wrapper.exists()).toBe(true)

      // The selectedClientOption computed property should resolve to the default client
      const vm = wrapper.vm
      expect(vm.selectedClientOption?.id).toBe(DEFAULT_CLIENT)
    })

    it('keeps the More combobox outside the tablist', () => {
      const wrapper = mount(ClientSelector, {
        props: {
          clientOptions: mockClientOptions,
          eventBus,
        },
        global: {
          stubs: {
            'ScalarCodeBlock': true,
            'ScalarMarkdown': true,
            'ScalarIcon': true,
            'ScalarCombobox': true,
          },
        },
      })

      const tablist = wrapper.find('[role="tablist"]')
      expect(tablist.exists()).toBe(true)
      const buttons = [...tablist.element.querySelectorAll('button')]
      expect(buttons.every((el) => el.getAttribute('role') === 'tab')).toBe(true)
      expect(wrapper.find('.client-libraries-more').exists()).toBe(true)
      expect(tablist.element.contains(wrapper.find('.client-libraries-more').element)).toBe(false)
    })
  })

  describe('selected tab state', () => {
    const stubs = {
      'ScalarCodeBlock': true,
      'ScalarMarkdown': true,
      'ScalarIcon': true,
      'ScalarCombobox': true,
    }

    /** aria-selected of every featured tab, in DOM order */
    const selectedStates = (wrapper: ReturnType<typeof mount>) =>
      wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('aria-selected'))

    it('marks no tab selected while a More client is active', async () => {
      // Headless UI clamps the -1 index onto the first tab on mount; the
      // override has to win over that.
      const wrapper = mount(ClientSelector, {
        props: { clientOptions: mockClientOptions, eventBus, selectedClient: 'shell/httpie' },
        global: { stubs },
      })
      await flushPromises()

      expect(selectedStates(wrapper)).toEqual(['false', 'false'])
    })

    it('reflects the featured client and clears it when switching to More', async () => {
      const wrapper = mount(ClientSelector, {
        props: { clientOptions: mockClientOptions, eventBus, selectedClient: 'node/undici' },
        global: { stubs },
      })
      await flushPromises()

      expect(selectedStates(wrapper)).toEqual(['false', 'true'])

      // Leaving a featured tab makes Headless UI clamp onto the last tab
      await wrapper.setProps({ selectedClient: 'shell/httpie' })
      await flushPromises()

      expect(selectedStates(wrapper)).toEqual(['false', 'false'])
    })

    it('still selects a featured tab by click while a More client is active', async () => {
      // Guards against clamping the index to a valid tab instead: Headless UI
      // only emits a change when the clicked index differs from the prop.
      const listener = vi.fn()
      eventBus.on('workspace:update:selected-client', listener)

      const wrapper = mount(ClientSelector, {
        props: { clientOptions: mockClientOptions, eventBus, selectedClient: 'shell/httpie' },
        global: { stubs },
      })
      await flushPromises()

      await wrapper.findAll('[role="tab"]')[0]?.trigger('click')

      expect(listener).toHaveBeenCalledWith('shell/curl')
    })

    it('labels the More panel with the section heading', async () => {
      const wrapper = mount(ClientSelector, {
        props: { clientOptions: mockClientOptions, eventBus, selectedClient: 'shell/httpie' },
        global: { stubs },
      })
      await flushPromises()

      const panel = wrapper.get('[role="tabpanel"]')
      const heading = wrapper.get(`#${panel.attributes('aria-labelledby')}`)

      expect(heading.classes()).toContain('client-libraries-heading')
    })
  })
})
