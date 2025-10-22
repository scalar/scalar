import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createStoreEvents } from '@/store/events'

import AddressBar from './AddressBar.vue'

const bus = createStoreEvents()

describe('AddressBar', () => {
  const makeWrapper = (overrides?: Partial<Record<string, any>>) => {
    const props = {
      path: '/pets',
      method: 'get' as const,
      server: overrides?.server,
      servers: overrides?.servers ?? [],
      environment: {},
      envVariables: [],
      history: [],
      layout: overrides?.layout ?? 'web',
      percentage: overrides?.percentage ?? 100,
      events: bus,
    }

    return mount(AddressBar, {
      props: props as any,
      global: {
        stubs: {
          // Keep button semantics for focus/click and disabled state
          ScalarButton: {
            name: 'ScalarButton',
            props: ['disabled'],
            template: '<button type="button" :disabled="disabled"><slot /></button>',
          },
          ScalarIcon: true,
          // Minimal child components used purely for structural presence
          ServerDropdown: {
            name: 'ServerDropdown',
            props: ['layout', 'server', 'servers', 'target'],
            template: '<div class="server-dropdown"></div>',
          },
          AddressBarHistory: {
            name: 'AddressBarHistory',
            props: ['history', 'target'],
            template: '<div class="address-bar-history"></div>',
          },
          // Stub HttpMethod to be able to emit a change easily
          HttpMethod: {
            name: 'HttpMethod',
            props: ['method', 'isEditable', 'isSquare', 'teleport'],
            template: '<button data-test="http-method" @click="$emit(\'change\', \'post\')"></button>',
          },
          // CodeInput needs to support v-model-like update and expose focus()
          CodeInput: {
            name: 'CodeInput',
            props: ['modelValue', 'disabled', 'emitOnBlur', 'envVariables', 'environment', 'placeholder', 'server'],
            emits: ['update:modelValue', 'submit', 'curl'],
            // Expose a focus() method which focuses the input element
            methods: {
              focus(this: any) {
                this.$el?.focus?.()
              },
            },
            template:
              '<input data-test="code-input" :value="modelValue" @input="$emit(\'update:modelValue\', ($event.target).value)" @keyup.enter="$emit(\'submit\')" />',
          },
        },
      },
      attachTo: document.body,
    })
  }

  it('emits update:method when HttpMethod emits change', async () => {
    const wrapper = makeWrapper()
    const trigger = wrapper.find('[data-test="http-method"]')
    await trigger.trigger('click')
    const emitted = wrapper.emitted('update:method')
    expect(emitted?.[0]).toEqual([{ method: 'post' }])
  })

  it('emits update:path when CodeInput updates modelValue', async () => {
    const wrapper = makeWrapper()
    const input = wrapper.find('[data-test="code-input"]')
    await input.setValue('/dogs')
    const emitted = wrapper.emitted('update:path')
    expect(emitted?.[0]).toEqual([{ path: '/dogs' }])
  })

  it('emits importCurl when CodeInput emits curl', async () => {
    const wrapper = makeWrapper()
    const codeInput = wrapper.findComponent({ name: 'CodeInput' })
    await codeInput.vm.$emit('curl', 'curl https://example.com')
    expect(wrapper.emitted('importCurl')?.[0]).toEqual(['curl https://example.com'])
  })

  it('emits execute on CodeInput submit and Send button click', async () => {
    const wrapper = makeWrapper({ percentage: 100 })
    const codeInput = wrapper.findComponent({ name: 'CodeInput' })
    await codeInput.vm.$emit('submit')
    expect(wrapper.emitted('execute')).toBeTruthy()

    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Send'))!
      .trigger('click')
    expect(wrapper.emitted('execute')?.length).toBeGreaterThanOrEqual(2)
  })

  it('disables Send button when percentage is below 100', () => {
    const wrapper = makeWrapper({ percentage: 50 })
    const sendBtn = wrapper.findAll('button').find((b) => b.text().includes('Send'))
    expect(sendBtn?.attributes('disabled')).toBeDefined()
  })

  it('renders ServerDropdown only when servers are provided', () => {
    const withoutServers = makeWrapper({ servers: [] })
    expect(withoutServers.find('.server-dropdown').exists()).toBe(false)

    const servers = [{ url: 'https://api.example.com', variables: {} }]
    const withServers = makeWrapper({ servers, server: servers[0] })
    expect(withServers.find('.server-dropdown').exists()).toBe(true)
  })

  it('focuses CodeInput on focusAddressBar event in web layout', () => {
    const wrapper = makeWrapper({ layout: 'web' })
    bus.focusAddressBar.emit()
    const input = wrapper.find('[data-test="code-input"]').element
    expect(document.activeElement).toBe(input)
  })

  it('focuses Send button on focusAddressBar event in modal layout', () => {
    const wrapper = makeWrapper({ layout: 'modal' })
    bus.focusAddressBar.emit()
    const sendBtn = wrapper.findAll('button').find((b) => b.text().includes('Send'))!.element as HTMLButtonElement
    expect(document.activeElement).toBe(sendBtn)
  })

  it('focuses CodeInput when hotKeys event indicates focusAddressBar', () => {
    const wrapper = makeWrapper({ layout: 'web' })
    bus.hotKeys.emit({ focusAddressBar: new KeyboardEvent('keydown', {}) })
    const input = wrapper.find('[data-test="code-input"]').element
    expect(document.activeElement).toBe(input)
  })
})
