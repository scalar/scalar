import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { createStoreEvents } from '@/store/events'
import { mockUseLayout } from '@/vitest.setup'
import { mount } from '@vue/test-utils'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { collectionSchema } from '@scalar/oas-utils/entities/spec'
import RequestRoot from './RequestRoot.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    currentRoute: {
      query: {},
    },
  }),
  RouterView: vi.fn(),
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
  requestHistory: [],
  collections: {},
  cookies: {},
  requestExamples: {},
  requests: {},
  securitySchemes: {},
  servers: {},
  tags: {},
  collectionMutators: {
    edit: vi.fn(),
  },
}

// Add mock for useActiveEntities
vi.mock('@/store/active-entities', () => ({
  useActiveEntities: vi.fn(),
}))
const mockUseActiveEntities = useActiveEntities as Mock
const mockActiveEntities = {
  activeRequest: ref(null),
  activeExample: ref(null),
  activeCollection: ref(collectionSchema.parse({ watchMode: false })),
  activeEnvironment: ref(null),
  activeWorkspace: ref(null),
  activeWorkspaceRequests: ref([]),
  activeWorkspaceCollections: ref([]),
  activeWorkspaceServers: ref([]),
  activeEnvVariables: ref([]),
  activeRouterParams: ref({}),
  setActiveRequest: vi.fn(),
  setActiveExample: vi.fn(),
}

describe('RequestRoot', () => {
  const createWrapper = (options = {}) =>
    mount(RequestRoot, {
      attachTo: document.body,
      ...options,
    })

  // Mock our request + example
  beforeEach(() => {
    mockUseWorkspace.mockReturnValue(mockWorkspace)
    mockUseActiveEntities.mockReturnValue(mockActiveEntities)
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

  it('emits update:modelValue when SidebarToggle is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.scalar-sidebar-toggle').trigger('click')
    expect(wrapper.find('.scalar-sidebar-toggle').exists()).toBe(true)
  })

  it('applies correct classes for modal layout', async () => {
    vi.mocked(mockUseLayout).mockReturnValue({ layout: 'modal' })
    const wrapper = createWrapper()
    const sidebarToggle = wrapper.find('.scalar-sidebar-toggle')
    expect(sidebarToggle.classes()).toContain('!flex')
  })
})
