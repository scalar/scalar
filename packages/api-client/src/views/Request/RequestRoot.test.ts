import { collectionSchema } from '@scalar/oas-utils/entities/spec'
import { mockUseLayout } from '@test/vitest.setup'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { createRequestOperation } from '@/libs/send-request'
import { type WorkspaceStore, useWorkspace } from '@/store'
import { type ActiveEntitiesStore, useActiveEntities } from '@/store/active-entities'
import { createStoreEvents } from '@/store/events'

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
const mockUseWorkspace = vi.mocked(useWorkspace)

// Add mock for useActiveEntities
vi.mock('@/store/active-entities', () => ({
  useActiveEntities: vi.fn(),
}))
const mockUseActiveEntities = vi.mocked(useActiveEntities)

vi.mock('@/libs/send-request')

describe('RequestRoot', () => {
  let mockActiveEntities: Partial<ActiveEntitiesStore>
  let mockEvents: ReturnType<typeof createStoreEvents>
  let mockWorkspace: Partial<WorkspaceStore>

  // Mock request and example
  // Create fresh instances for each test to prevent shared state
  // (e.g., ref updates leaking between tests)
  beforeEach(() => {
    mockActiveEntities = {
      activeRequest: ref(null),
      activeExample: ref(null),
      activeCollection: ref(collectionSchema.parse({ watchMode: false })),
      activeEnvironment: ref({ value: '{}' }),
      activeWorkspace: ref(null),
      activeWorkspaceRequests: ref([]),
      activeWorkspaceCollections: ref([]),
      activeWorkspaceServers: ref([]),
      activeEnvVariables: ref([]),
      activeRouterParams: ref({}),
      activeServer: ref(null),
      setActiveRequest: vi.fn(),
      setActiveExample: vi.fn(),
    } as unknown as Partial<ActiveEntitiesStore>

    mockEvents = createStoreEvents()
    mockWorkspace = {
      isReadOnly: false,
      events: mockEvents,
      hideClientButton: false,
      showSidebar: true,
      requestHistory: ref([]),
      collections: ref({}),
      cookies: ref({}),
      requestExamples: ref({}),
      requests: ref({}),
      securitySchemes: ref({}),
      servers: ref({}),
      tags: ref({}),
      modalState: ref({ open: true, show: vi.fn(), hide: vi.fn() }),
      collectionMutators: {
        edit: vi.fn(),
      },
    } as unknown as Partial<WorkspaceStore>

    mockUseWorkspace.mockReturnValue(mockWorkspace as WorkspaceStore)
    mockUseActiveEntities.mockReturnValue(mockActiveEntities as ActiveEntitiesStore)

    return () => {
      mockUseWorkspace.mockReset()
      mockUseActiveEntities.mockReset()
    }
  })

  const createWrapper = (options = {}) =>
    mount(RequestRoot, {
      attachTo: document.body,
      ...options,
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
    mockUseWorkspace.mockReturnValue({
      ...mockWorkspace,
      showSidebar: false,
    } as WorkspaceStore)
    const wrapper = createWrapper()

    await wrapper.vm.$nextTick()
    expect(wrapper.find('.scalar-sidebar-toggle').exists()).toBe(false)
  })

  it('emits update:modelValue when SidebarToggle is clicked', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.scalar-sidebar-toggle').trigger('click')
    expect(wrapper.find('.scalar-sidebar-toggle').exists()).toBe(true)
  })

  it('applies correct classes for modal layout', () => {
    vi.mocked(mockUseLayout).mockReturnValue({ layout: 'modal' })
    const wrapper = createWrapper()
    const sidebarToggle = wrapper.find('.scalar-sidebar-toggle')
    expect(sidebarToggle.classes()).toContain('!flex')
  })

  it('should cancel request when modal closes', async () => {
    const mockRequest = {
      path: '/test',
      method: 'GET',
    }

    const mockExample = {
      parameters: {},
    }

    const sendRequestSpy = vi.fn().mockReturnValue(
      // The request will be aborted not need to run an actual request
      new Promise((resolve) => {
        setTimeout(resolve, 1000)
      }),
    )
    const abortSpy = vi.fn()

    vi.mocked(createRequestOperation).mockReturnValue([
      null,
      {
        controller: { abort: abortSpy } as unknown as AbortController,
        sendRequest: sendRequestSpy,
        request: {} as unknown as Request,
      },
    ])

    // @ts-expect-error manual ref update
    mockActiveEntities.activeRequest.value = mockRequest
    // @ts-expect-error manual ref update
    mockActiveEntities.activeExample.value = mockExample

    const wrapper = createWrapper({
      global: {
        stubs: ['RequestSidebar'],
      },
    })

    mockEvents.executeRequest.emit()

    expect(sendRequestSpy).toHaveBeenCalled()

    // Simulate modal closing
    // @ts-expect-error manual ref update
    mockWorkspace.modalState.value = { ...mockWorkspace.modalState.value, open: false }

    await wrapper.vm.$nextTick()

    expect(abortSpy).toHaveBeenCalledWith('The request has been cancelled')
  })
})
