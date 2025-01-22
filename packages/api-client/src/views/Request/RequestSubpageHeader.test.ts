import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { createStoreEvents } from '@/store/events'
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

// Mock useActiveEntities
vi.mock('@/store/active-entities', () => ({
  useActiveEntities: vi.fn(),
}))
const mockUseActiveEntities = useActiveEntities as Mock
const mockActiveEntities = {
  activeCollection: ref({
    documentUrl: 'https://example.com',
    integration: 'test',
  }),
  activeEnvironment: ref({}),
  activeRequest: ref({ uid: 'mockRequestUid' }),
  activeWorkspace: ref({}),
}

// Mock useLayout
vi.mock('@/hooks', () => ({
  useLayout: () => ({
    layout: 'modal',
  }),
}))

describe('RequestSubpageHeader', () => {
  const createWrapper = (options = {}) => {
    return mount(RequestSubpageHeader, {
      props: {
        modelValue: false,
      },
      ...options,
    })
  }

  // Mock our request + example
  beforeEach(() => {
    mockUseActiveEntities.mockReturnValue(mockActiveEntities)
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
    mockUseActiveEntities.mockReturnValue({
      ...mockActiveEntities,
      activeCollection: ref({
        documentUrl: 'https://example.com',
        integration: 'test',
      }),
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
