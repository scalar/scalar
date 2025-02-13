import { useWorkspace } from '@/store'
import { createStoreEvents } from '@/store/events'
import {
  collectionSchema,
  operationSchema,
} from '@scalar/oas-utils/entities/spec'
import { mount } from '@vue/test-utils'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import RequestSubpageHeader from './RequestSubpageHeader.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    currentRoute: {
      query: {},
    },
  }),
}))

// Mock useLayout
vi.mock('@/hooks', () => ({
  useLayout: () => ({
    layout: 'modal',
  }),
}))

// Mock the useWorkspace hook
vi.mock('@/store', () => ({
  useWorkspace: vi.fn(),
}))
const mockUseWorkspace = useWorkspace as Mock
const mockWorkspace = {
  isReadOnly: false,
  events: createStoreEvents(),
  hideClientButton: false,
  showSidebar: true,
  requestHistory: ref([]),
}

const mockCollection = collectionSchema.parse({
  documentUrl: 'https://example.com',
  integration: 'test',
})
const mockOperation = operationSchema.parse({
  uid: 'mockRequestUid',
})

describe('RequestSubpageHeader', () => {
  const createWrapper = (options = {}) =>
    mount(RequestSubpageHeader, {
      props: {
        collection: mockCollection,
        operation: mockOperation,
        server: undefined,
        modelValue: false,
      },
      ...options,
    })

  // Mock our request + example
  beforeEach(() => {
    mockUseWorkspace.mockReturnValue(mockWorkspace)
  })

  it('renders correctly', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('shows SidebarToggle when showSidebar is true', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.scalar-sidebar-toggle').exists()).toBe(true)
  })

  it('hides SidebarToggle when showSidebar is false', async () => {
    mockUseWorkspace.mockReturnValue({ ...mockWorkspace, showSidebar: false })
    const wrapper = createWrapper()

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.scalar-sidebar-toggle').exists()).toBe(false)
  })

  it('shows OpenApiClientButton when layout is modal and document URL is present', async () => {
    mockUseWorkspace.mockReturnValue({
      ...mockWorkspace,
      hideClientButton: false,
    })
    const wrapper = createWrapper()

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.open-api-client-button').exists()).toBe(true)
  })

  it('emits update:modelValue when SidebarToggle is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.scalar-sidebar-toggle').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('emits hideModal when close button is clicked', async () => {
    mockUseWorkspace.mockReturnValue({
      ...mockWorkspace,
    })
    const wrapper = createWrapper()

    await wrapper.vm.$nextTick()
    await wrapper.find('.app-exit-button').trigger('click')
    expect(wrapper.emitted('hideModal')).toBeTruthy()
  })
})
