import { type ClientOption, type ClientOptionGroup, DEFAULT_CLIENT } from '@scalar/blocks/code-example'
import { useModal } from '@scalar/components/modal'
import type { AvailableClient } from '@scalar/types/snippetz'
import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

import { GENERATE_SDK_CONTEXT_SYMBOL, type GenerateSdkContext } from '@/features/generate-sdk/use-generate-sdk'

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
    const selectedStates = (wrapper: ReturnType<typeof mount>): (string | undefined)[] =>
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

      expect(heading.text()).toBe('Client Libraries')
    })
  })

  describe('Generate SDK', () => {
    const createContext = (enabled: boolean): GenerateSdkContext => ({
      enabled: computed(() => enabled),
      dialog: useModal(),
      open: vi.fn(),
    })

    const mountWithContext = (context: GenerateSdkContext) =>
      mount(ClientSelector, {
        props: { clientOptions: mockClientOptions, eventBus },
        global: {
          stubs: { 'ScalarIcon': true, 'ScalarCombobox': true },
          provide: { [GENERATE_SDK_CONTEXT_SYMBOL as symbol]: context },
        },
      })

    const findGenerateSdkButton = (wrapper: ReturnType<typeof mount>) =>
      wrapper.findAll('button').find((button) => button.text() === 'Generate SDK')

    it('offers Generate SDK beside the selected client, outside the tabs and their panel', async () => {
      const context = createContext(true)
      const wrapper = mountWithContext(context)
      await flushPromises()

      const button = findGenerateSdkButton(wrapper)
      expect(button?.exists()).toBe(true)

      const tablist = wrapper.get('[role="tablist"]')
      const panel = wrapper.get('[role="tabpanel"]')
      expect(tablist.element.contains(button?.element ?? null)).toBe(false)
      expect(panel.element.contains(button?.element ?? null)).toBe(false)
      expect(panel.text()).toBe('Shell cURL')
      expect(wrapper.get(`#${tablist.attributes('aria-labelledby')}`).text()).toBe('Client Libraries')

      await button?.trigger('click')
      expect(context.open).toHaveBeenCalledTimes(1)
    })

    it('hides Generate SDK when the context is disabled', async () => {
      const wrapper = mountWithContext(createContext(false))
      await flushPromises()

      expect(findGenerateSdkButton(wrapper)).toBeUndefined()
    })
  })

  describe('featuredClients', () => {
    const stubs = {
      'ScalarCodeBlock': true,
      'ScalarMarkdown': true,
      'ScalarIcon': true,
      'ScalarCombobox': true,
    }

    const option = (id: AvailableClient, targetTitle: string): ClientOption => {
      const [targetKey, clientKey] = id.split('/') as [ClientOption['targetKey'], ClientOption['clientKey']]
      return {
        id,
        label: clientKey,
        lang: targetKey,
        title: `${targetTitle} ${clientKey}`,
        targetKey,
        targetTitle,
        clientKey,
      }
    }

    const clientOptions = [
      { label: 'Shell', key: 'shell', options: [option('shell/curl', 'Shell')] },
      {
        label: 'Node.js',
        key: 'node',
        options: [option('node/fetch', 'Node.js'), option('node/undici', 'Node.js')],
      },
      { label: 'PHP', key: 'php', options: [option('php/guzzle', 'PHP')] },
    ] satisfies ClientOptionGroup[]

    const tabLabels = (wrapper: ReturnType<typeof mount>): string[] =>
      wrapper.findAll('[role="tab"]').map((tab) => tab.text())

    it('shows the configured clients as tabs in the configured order', async () => {
      const wrapper = mount(ClientSelector, {
        props: { clientOptions, eventBus, featuredClients: ['node/fetch', 'shell/curl'] },
        global: { stubs },
      })
      await flushPromises()

      expect(tabLabels(wrapper)).toEqual(['Node.js', 'Shell'])
    })

    it('skips configured clients that are not available', async () => {
      const wrapper = mount(ClientSelector, {
        props: { clientOptions, eventBus, featuredClients: ['ruby/native', 'node/fetch'] },
        global: { stubs },
      })
      await flushPromises()

      expect(tabLabels(wrapper)).toEqual(['Node.js'])
    })

    it('renders the selected configured client in its panel', async () => {
      const wrapper = mount(ClientSelector, {
        props: { clientOptions, eventBus, featuredClients: ['node/fetch'], selectedClient: 'node/fetch' },
        global: { stubs },
      })
      await flushPromises()

      expect(wrapper.get('[role="tabpanel"]').text()).toBe('Node.js fetch')
      expect(wrapper.findComponent({ name: 'ClientDropdown' }).props('featuredClients')).toEqual(['node/fetch'])
    })

    it('keeps the selected client in More when no clients are featured', async () => {
      const wrapper = mount(ClientSelector, {
        props: { clientOptions, eventBus, featuredClients: [], selectedClient: 'shell/curl' },
        global: { stubs },
      })
      await flushPromises()

      expect(tabLabels(wrapper)).toEqual([])
      expect(wrapper.get('[role="tabpanel"]').text()).toBe('Shell curl')
    })

    it('updates the tabs and panel when the configured list changes', async () => {
      const wrapper = mount(ClientSelector, {
        props: { clientOptions, eventBus, featuredClients: ['node/fetch'], selectedClient: 'node/fetch' },
        global: { stubs },
      })
      await flushPromises()
      await wrapper.setProps({ featuredClients: ['shell/curl'] })
      await flushPromises()

      expect(tabLabels(wrapper)).toEqual(['Shell'])
      expect(wrapper.get('[role="tabpanel"]').text()).toBe('Node.js fetch')
    })

    it('selects the configured tab and emits its client id', async () => {
      const listener = vi.fn()
      eventBus.on('workspace:update:selected-client', listener)

      const wrapper = mount(ClientSelector, {
        props: {
          clientOptions,
          eventBus,
          featuredClients: ['shell/curl', 'node/fetch'],
          selectedClient: 'shell/curl',
        },
        global: { stubs },
      })
      await flushPromises()

      await wrapper.findAll('[role="tab"]')[1]?.trigger('click')

      expect(listener).toHaveBeenCalledWith('node/fetch')
    })

    it('treats a client outside the configured list as a More client', async () => {
      // node/undici is featured by default but not in this configuration
      const wrapper = mount(ClientSelector, {
        props: { clientOptions, eventBus, featuredClients: ['node/fetch'], selectedClient: 'node/undici' },
        global: { stubs },
      })
      await flushPromises()

      expect(wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('aria-selected'))).toEqual(['false'])
      expect(wrapper.get('[role="tabpanel"]').text()).toBe('Node.js undici')
    })
  })
})
