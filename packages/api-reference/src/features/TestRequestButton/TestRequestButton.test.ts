import { CONFIGURATION_SYMBOL } from '@/hooks/useConfig'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

import { OperationObjectSchema } from '@scalar/oas-utils/entities/spec'
import TestRequestButton from './TestRequestButton.vue'

const mockClient = ref({
  open: vi.fn(),
})

vi.mock('@/features/ApiClientModal', () => ({
  useApiClient: () => ({
    client: mockClient,
  }),
}))

describe('TestRequestButton', () => {
  it('renders nothing when operation prop is not provided', () => {
    const wrapper = mount(TestRequestButton)
    // Just whitespace
    expect(wrapper.text()).toBe('')
  })

  it('renders nothing when hideTestRequestButton config is true', () => {
    const wrapper = mount(TestRequestButton, {
      global: {
        provide: {
          [CONFIGURATION_SYMBOL]: computed(() => ({
            hideTestRequestButton: true,
          })),
        },
      },
      props: {
        operation: OperationObjectSchema.parse({
          method: 'get',
          path: '/test',
        }),
      },
    })
    expect(wrapper.text()).toBe('')
  })

  it('renders button with correct text and icon when operation is provided', () => {
    const wrapper = mount(TestRequestButton, {
      props: {
        operation: OperationObjectSchema.parse({
          method: 'get',
          path: '/test',
        }),
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('.scalar-icon').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Request')
    expect(wrapper.text()).toContain('(get /test)')
  })

  it('has correct button attributes', () => {
    const wrapper = mount(TestRequestButton, {
      props: {
        operation: OperationObjectSchema.parse({
          method: 'post',
          path: '/users',
        }),
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('type')).toBe('button')
    // Some use this to style the button (e.g. nuxt-theme.css)
    expect(button.classes()).toContain('show-api-client-button')
  })

  it('calls client.open with correct params when clicked', async () => {
    const wrapper = mount(TestRequestButton, {
      props: {
        operation: OperationObjectSchema.parse({
          method: 'delete',
          path: '/users/1',
          uid: 'my-random-uuid',
        }),
      },
    })

    await wrapper.find('button').trigger('click')

    expect(mockClient.value.open).toHaveBeenCalledWith({
      requestUid: 'my-random-uuid',
    })
  })
})
