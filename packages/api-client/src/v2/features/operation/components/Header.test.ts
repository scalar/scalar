import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { ClientLayout } from '@/hooks'
import type { EnvVariable } from '@/store'
import { createStoreEvents } from '@/store/events'
import type { History } from '@/v2/blocks/scalar-address-bar-block'

import Header from './Header.vue'

/** Helper to create default props for the Header component */
function createDefaultProps(
  overrides: Partial<{
    path: string
    method: HttpMethod
    layout: ClientLayout
    showSidebar: boolean
    hideClientButton: boolean
    integration: string | null
    documentUrl: string
    source: 'gitbook' | 'api-reference'
    server: ServerObject | undefined
    servers: ServerObject[]
    history: History[]
    requestLoadingPercentage: number
    events: ReturnType<typeof createStoreEvents>
    environment: Environment
    envVariables: EnvVariable[]
  }> = {},
) {
  const mockEvents = createStoreEvents()

  return {
    path: '/api/users',
    method: 'get' as const,
    layout: 'web' as const,
    showSidebar: true,
    hideClientButton: false,
    integration: null,
    documentUrl: '',
    source: 'api-reference' as const,
    server: undefined,
    servers: [],
    history: [],
    requestLoadingPercentage: undefined,
    events: mockEvents,
    environment: {
      uid: 'env-1' as any,
      name: 'Test Environment',
      color: 'blue',
      value: '',
      isDefault: true,
    } satisfies Environment,
    envVariables: [],
    ...overrides,
  }
}

describe('Header Component', () => {
  describe('rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps(),
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('renders the AddressBar component', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps(),
      })

      const addressBar = wrapper.findComponent({ name: 'AddressBar' })
      expect(addressBar.exists()).toBe(true)
    })
  })

  describe('sidebar visibility', () => {
    it('shows sidebar toggle space when showSidebar is true', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          showSidebar: true,
        }),
      })

      const sidebarSpace = wrapper.find('.size-8')
      expect(sidebarSpace.exists()).toBe(true)
    })

    it('hides sidebar toggle space when showSidebar is false', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          showSidebar: false,
        }),
      })

      const sidebarSpace = wrapper.find('.size-8')
      expect(sidebarSpace.exists()).toBe(false)
    })

    it('hides sidebar toggle space in modal layout even when showSidebar is true', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          showSidebar: true,
          layout: 'modal',
        }),
      })

      const sidebarSpace = wrapper.find('.size-8')
      expect(sidebarSpace.classes()).toContain('hidden')
    })

    it('shows sidebar toggle space in default layout when showSidebar is true', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          showSidebar: true,
          layout: 'web',
        }),
      })

      const sidebarSpace = wrapper.find('.size-8')
      expect(sidebarSpace.classes()).not.toContain('hidden')
    })
  })

  describe('OpenApiClientButton visibility', () => {
    it('shows OpenApiClientButton in modal layout with documentUrl', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          layout: 'modal',
          documentUrl: 'https://example.com/openapi.json',
        }),
      })

      const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
      expect(clientButton.exists()).toBe(true)
    })

    it('hides OpenApiClientButton when layout is not modal', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          layout: 'web',
          documentUrl: 'https://example.com/openapi.json',
        }),
      })

      const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
      expect(clientButton.exists()).toBe(false)
    })

    it('hides OpenApiClientButton when documentUrl is missing', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          layout: 'modal',
          documentUrl: '',
        }),
      })

      const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
      expect(clientButton.exists()).toBe(false)
    })

    it('hides OpenApiClientButton when hideClientButton is true', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          layout: 'modal',
          documentUrl: 'https://example.com/openapi.json',
          hideClientButton: true,
        }),
      })

      const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
      expect(clientButton.exists()).toBe(false)
    })

    it('passes correct props to OpenApiClientButton', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          layout: 'modal',
          documentUrl: 'https://example.com/openapi.json',
          integration: 'gitbook',
          source: 'gitbook',
        }),
      })

      const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
      expect(clientButton.props('url')).toBe('https://example.com/openapi.json')
      expect(clientButton.props('integration')).toBe('gitbook')
      expect(clientButton.props('source')).toBe('gitbook')
      expect(clientButton.props('buttonSource')).toBe('modal')
    })

    it('uses default source when not provided', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          layout: 'modal',
          documentUrl: 'https://example.com/openapi.json',
          source: undefined,
        }),
      })

      const clientButton = wrapper.findComponent({ name: 'OpenApiClientButton' })
      expect(clientButton.props('source')).toBe('api-reference')
    })
  })

  describe('close button visibility', () => {
    it('shows close buttons only in modal layout', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          layout: 'modal',
        }),
      })

      const closeButtons = wrapper.findAll('button')
      const modalCloseButtons = closeButtons.filter((button) => button.text().includes('Close Client'))

      expect(modalCloseButtons.length).toBeGreaterThan(0)
    })

    it('hides close buttons in non-modal layouts', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          layout: 'web',
        }),
      })

      const closeButtons = wrapper.findAll('button')
      const modalCloseButtons = closeButtons.filter((button) => button.text().includes('Close Client'))

      expect(modalCloseButtons.length).toBe(0)
    })

    it('renders both close buttons in modal layout (standard and gitbook)', () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          layout: 'modal',
        }),
      })

      const closeButtons = wrapper.findAll('button')
      const modalCloseButtons = closeButtons.filter((button) => button.text().includes('Close Client'))

      // There should be two close buttons: one standard, one for GitBook
      expect(modalCloseButtons.length).toBe(2)
    })
  })

  describe('event emissions', () => {
    it('emits hideModal when standard close button is clicked', async () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          layout: 'modal',
        }),
      })

      const closeButton = wrapper.find('.app-exit-button')
      await closeButton.trigger('click')

      expect(wrapper.emitted('hideModal')).toBeTruthy()
      expect(wrapper.emitted('hideModal')?.length).toBe(1)
    })

    it('emits hideModal when GitBook close button is clicked', async () => {
      const wrapper = mount(Header, {
        props: createDefaultProps({
          layout: 'modal',
        }),
      })

      const gitbookCloseButton = wrapper.find('.gitbook-show')
      await gitbookCloseButton.trigger('click')

      expect(wrapper.emitted('hideModal')).toBeTruthy()
      expect(wrapper.emitted('hideModal')?.length).toBe(1)
    })

    it('forwards importCurl event from AddressBar', async () => {
      const wrapper = mount(Header, {
        props: createDefaultProps(),
      })

      const addressBar = wrapper.findComponent({ name: 'AddressBar' })
      await addressBar.vm.$emit('importCurl', 'curl -X GET https://example.com')

      expect(wrapper.emitted('importCurl')).toBeTruthy()
      expect(wrapper.emitted('importCurl')?.[0]).toEqual(['curl -X GET https://example.com'])
    })

    it('forwards update:method event from AddressBar', async () => {
      const wrapper = mount(Header, {
        props: createDefaultProps(),
      })

      const addressBar = wrapper.findComponent({ name: 'AddressBar' })
      const payload = { method: 'POST' as HttpMethod }
      await addressBar.vm.$emit('update:method', payload)

      expect(wrapper.emitted('update:method')).toBeTruthy()
      expect(wrapper.emitted('update:method')?.[0]).toEqual([payload])
    })

    it('forwards update:path event from AddressBar', async () => {
      const wrapper = mount(Header, {
        props: createDefaultProps(),
      })

      const addressBar = wrapper.findComponent({ name: 'AddressBar' })
      const payload = { path: '/api/new-path' }
      await addressBar.vm.$emit('update:path', payload)

      expect(wrapper.emitted('update:path')).toBeTruthy()
      expect(wrapper.emitted('update:path')?.[0]).toEqual([payload])
    })

    it('forwards execute event from AddressBar', async () => {
      const wrapper = mount(Header, {
        props: createDefaultProps(),
      })

      const addressBar = wrapper.findComponent({ name: 'AddressBar' })
      await addressBar.vm.$emit('execute')

      expect(wrapper.emitted('execute')).toBeTruthy()
      expect(wrapper.emitted('execute')?.length).toBe(1)
    })

    it('forwards update:selectedServer event from AddressBar', async () => {
      const wrapper = mount(Header, {
        props: createDefaultProps(),
      })

      const addressBar = wrapper.findComponent({ name: 'AddressBar' })
      const payload = { id: 'server-123' }
      await addressBar.vm.$emit('update:selectedServer', payload)

      expect(wrapper.emitted('update:selectedServer')).toBeTruthy()
      expect(wrapper.emitted('update:selectedServer')?.[0]).toEqual([payload])
    })

    it('forwards update:variable event from AddressBar', async () => {
      const wrapper = mount(Header, {
        props: createDefaultProps(),
      })

      const addressBar = wrapper.findComponent({ name: 'AddressBar' })
      const payload = { key: 'API_KEY', value: 'secret-key' }
      await addressBar.vm.$emit('update:variable', payload)

      expect(wrapper.emitted('update:variable')).toBeTruthy()
      expect(wrapper.emitted('update:variable')?.[0]).toEqual([payload])
    })

    it('forwards add:server event from AddressBar', async () => {
      const wrapper = mount(Header, {
        props: createDefaultProps(),
      })

      const addressBar = wrapper.findComponent({ name: 'AddressBar' })
      await addressBar.vm.$emit('add:server')

      expect(wrapper.emitted('add:server')).toBeTruthy()
      expect(wrapper.emitted('add:server')?.length).toBe(1)
    })
  })
})
