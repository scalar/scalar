import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { OpenApiClientButton } from '@/components'
import { AddressBar } from '@/v2/blocks/scalar-address-bar-block'

import Header from './Header.vue'

describe('Header', () => {
  const eventBus = createWorkspaceEventBus()

  const defaultProps = {
    path: '/pets',
    method: 'get' as const,
    layout: 'web' as const,
    isSidebarOpen: true,
    showSidebar: true,
    hideClientButton: false,
    integration: null as string | null,
    documentUrl: undefined as string | undefined,
    source: 'api-reference' as const,
    server: null,
    servers: [] as any[],
    history: [] as any[],
    requestLoadingPercentage: undefined as number | undefined,
    eventBus,
    environment: {
      variables: [],
      color: '#FF0000',
      description: 'Test Environment',
    } as XScalarEnvironment,
  }

  const render = (overrides: Record<string, any> = {}) => {
    const props = { ...defaultProps, ...overrides }
    return mount(Header, { props })
  }

  it('emits execute when AddressBar emits execute', () => {
    const wrapper = render()
    const addressBar = wrapper.getComponent(AddressBar)
    addressBar.vm.$emit('execute')

    const emitted = wrapper.emitted().execute
    expect(emitted?.length).toBe(1)
  })

  it('renders OpenApiClientButton only in modal layout with documentUrl when not hidden', () => {
    const modalWithUrl = render({ layout: 'modal', documentUrl: 'https://example.com/openapi.json' })
    expect(modalWithUrl.findComponent(OpenApiClientButton).exists()).toBe(true)

    const webLayout = render({ layout: 'web', documentUrl: 'https://example.com/openapi.json' })
    expect(webLayout.findComponent(OpenApiClientButton).exists()).toBe(false)

    const hiddenButton = render({
      layout: 'modal',
      documentUrl: 'https://example.com/openapi.json',
      hideClientButton: true,
    })
    expect(hiddenButton.findComponent(OpenApiClientButton).exists()).toBe(false)
  })

  it('emits ui:close:client-modal on the event bus when close buttons are clicked in modal', async () => {
    const fn = vi.fn()
    eventBus.on('ui:close:client-modal', fn)

    const wrapper = render({ layout: 'modal' })
    const buttons = wrapper.findAll('button')
    for (const btn of buttons) {
      await btn.trigger('click')
    }

    expect(fn).toHaveBeenCalled()
  })

  it('passes method and path props to AddressBar', () => {
    const wrapper = render({ method: 'put', path: '/animals' })
    const addressBar = wrapper.getComponent(AddressBar)
    const props = addressBar.props() as any
    expect(props.method).toBe('put')
    expect(props.path).toBe('/animals')
  })
})
