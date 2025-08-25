import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { DEFAULT_CLIENT } from '@/v2/blocks/scalar-request-example-block/helpers/find-client'
import type { ClientOptionGroup } from '@/v2/blocks/scalar-request-example-block/types'

import ClientSelector from './ClientSelector.vue'

describe('ClientLibraries', () => {
  const mockClientOptions: ClientOptionGroup[] = [
    {
      label: 'Shell',
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
      expect(vm.selectedClientOption.id).toBe(DEFAULT_CLIENT)
    })

    it('uses provided selectedClient when available', () => {
      const customClient = 'node/undici'

      const wrapper = mount(ClientSelector, {
        props: {
          clientOptions: mockClientOptions,
          xSelectedClient: customClient,
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

    it('handles undefined selectedClient gracefully', () => {
      const wrapper = mount(ClientSelector, {
        props: {
          clientOptions: mockClientOptions,
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
  })
})
