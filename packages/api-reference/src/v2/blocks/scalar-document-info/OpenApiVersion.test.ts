import { OPENAPI_VERSION_SYMBOL } from '@/features/download-links'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { provide, ref } from 'vue'
import OpenApiVersion from './OpenApiVersion.vue'

const renderWithProvider = (version: string | undefined) => {
  const TestWrapper = {
    components: { OpenApiVersion },
    setup() {
      provide(OPENAPI_VERSION_SYMBOL, ref(version))
      return {}
    },
    template: '<OpenApiVersion />',
  }

  return mount(TestWrapper)
}

describe('OpenApiVersion', () => {
  it('displays the OpenAPI version when provided', () => {
    const wrapper = renderWithProvider('3.1.0')

    expect(wrapper.text()).toContain('OAS 3.1.0')
  })

  it('displays different OpenAPI versions correctly', () => {
    const wrapper = renderWithProvider('2.0.0')

    expect(wrapper.text()).toContain('OAS 2.0.0')
  })

  it('does not render when version is undefined', () => {
    const wrapper = renderWithProvider(undefined)

    expect(wrapper.text()).toBe('')
  })

  it('does not render when version is empty string', () => {
    const wrapper = renderWithProvider('')

    expect(wrapper.text()).toBe('')
  })

  it('updates when version changes reactively', async () => {
    const version = ref('3.0.0')
    const TestWrapper = {
      components: { OpenApiVersion },
      setup() {
        provide(OPENAPI_VERSION_SYMBOL, version)
        return { version }
      },
      template: '<OpenApiVersion />',
    }

    const wrapper = mount(TestWrapper)

    expect(wrapper.text()).toContain('OAS 3.0.0')

    // Update the version
    version.value = '3.1.0'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('OAS 3.1.0')
  })

  it('handles null version gracefully', () => {
    const TestWrapper = {
      components: { OpenApiVersion },
      setup() {
        provide(OPENAPI_VERSION_SYMBOL, ref(null))
        return {}
      },
      template: '<OpenApiVersion />',
    }

    const wrapper = mount(TestWrapper)

    expect(wrapper.text()).toBe('')
  })
})
