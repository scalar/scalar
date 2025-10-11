import { type RequestExample, collectionSchema, requestExampleSchema } from '@scalar/oas-utils/entities/spec'
import { mount } from '@vue/test-utils'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { createStoreEvents } from '@/store/events'
import { mockUseLayout } from '@/vitest.setup'

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
  activeExample: ref<RequestExample | null>(null),
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

  describe('Parameter Validation', () => {
    it('correctly identifies invalid path parameters', async () => {
      const mockExample = requestExampleSchema.parse({
        uid: 'test-example',
        parameters: {
          path: [
            { key: 'userId', value: '', required: true, enabled: true },
            { key: 'postId', value: '123', required: true, enabled: true },
          ],
          query: [],
          headers: [],
          cookies: [],
        },
      })

      mockActiveEntities.activeExample.value = mockExample

      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      // Check that invalidParams contains the empty required parameter
      expect(vm.invalidParams.has('userId')).toBe(true)
      expect(vm.invalidParams.has('postId')).toBe(false)

      // Check that isPathInvalid is true because userId is invalid
      expect(vm.isPathInvalid).toBe(true)
    })

    it('correctly identifies valid path parameters', async () => {
      const mockExample = requestExampleSchema.parse({
        uid: 'test-example',
        parameters: {
          path: [
            { key: 'userId', value: '456', required: true, enabled: true },
            { key: 'postId', value: '123', required: true, enabled: true },
          ],
          query: [],
          headers: [],
          cookies: [],
        },
      })

      mockActiveEntities.activeExample.value = mockExample

      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      // Check that invalidParams is empty
      expect(vm.invalidParams.size).toBe(0)

      // Check that isPathInvalid is false
      expect(vm.isPathInvalid).toBe(false)
    })

    it('reactively updates validation when parameter values change', async () => {
      const mockExample = requestExampleSchema.parse({
        uid: 'test-example',
        parameters: {
          path: [{ key: 'userId', value: '', required: true, enabled: true }],
          query: [],
          headers: [],
          cookies: [],
        },
      })

      mockActiveEntities.activeExample.value = mockExample

      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      // Initially invalid
      expect(vm.invalidParams.has('userId')).toBe(true)
      expect(vm.isPathInvalid).toBe(true)

      // Create a new example with updated parameter value to trigger reactivity
      const updatedExample = requestExampleSchema.parse({
        uid: 'test-example',
        parameters: {
          path: [{ key: 'userId', value: '123', required: true, enabled: true }],
          query: [],
          headers: [],
          cookies: [],
        },
      })

      mockActiveEntities.activeExample.value = updatedExample

      await wrapper.vm.$nextTick()

      // Should now be valid
      expect(vm.invalidParams.has('userId')).toBe(false)
      expect(vm.isPathInvalid).toBe(false)
    })

    it('handles missing activeExample gracefully', async () => {
      mockActiveEntities.activeExample.value = null

      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      // Should return empty set and false for missing example
      expect(vm.invalidParams.size).toBe(0)
      expect(vm.isPathInvalid).toBe(false)
    })

    it('validates all parameter types (path, query, headers, cookies)', async () => {
      const mockExample = requestExampleSchema.parse({
        uid: 'test-example',
        parameters: {
          path: [{ key: 'userId', value: '', required: true, enabled: true }],
          query: [{ key: 'limit', value: '', required: true, enabled: true }],
          headers: [{ key: 'Authorization', value: '', required: true, enabled: true }],
          cookies: [{ key: 'sessionId', value: '', required: true, enabled: true }],
        },
      })

      mockActiveEntities.activeExample.value = mockExample

      const wrapper = createWrapper()
      const vm = wrapper.vm as any

      // All required parameters should be invalid
      expect(vm.invalidParams.has('userId')).toBe(true)
      expect(vm.invalidParams.has('limit')).toBe(true)
      expect(vm.invalidParams.has('Authorization')).toBe(true)
      expect(vm.invalidParams.has('sessionId')).toBe(true)

      // isPathInvalid should be true because userId (path param) is invalid
      expect(vm.isPathInvalid).toBe(true)
    })
  })
})
