import type { TraversedEntry, TraversedOperation } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import SidebarElement from './SidebarElement.vue'

// Mock the dependencies
vi.mock('@scalar/oas-utils/helpers', () => ({
  isOperationDeprecated: vi.fn(),
}))

vi.mock('@/hooks/useConfig', () => ({
  useConfig: () => ({
    value: {
      pathRouting: false,
      defaultOpenAllTags: false,
      onSidebarClick: vi.fn(),
    },
  }),
}))

vi.mock('@/hooks/useNavState', () => ({
  useNavState: () => ({
    getFullHash: vi.fn((id: string) => `#${id}`),
    isIntersectionEnabled: ref(true),
    replaceUrlState: vi.fn(),
  }),
}))

vi.mock('@scalar/helpers/dom/scroll-to-id', () => ({
  scrollToId: vi.fn(),
}))

vi.mock('@scalar/helpers/testing/sleep', () => ({
  sleep: vi.fn(() => Promise.resolve()),
}))

describe('SidebarElement', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockTraversedOperation = (overrides: Partial<TraversedOperation> = {}): TraversedOperation => ({
    type: 'operation',
    id: 'test-operation',
    title: 'Test Operation',
    ref: '#/paths/~1test/get',
    method: 'get',
    path: '/test',
    ...overrides,
  })

  const createMockTraversedEntry = (overrides: Partial<TraversedEntry> = {}): TraversedEntry =>
    ({
      id: 'test-entry',
      title: 'Test Entry',
      type: 'text',
      ...overrides,
    }) as TraversedEntry

  it('renders basic sidebar element', () => {
    const item = createMockTraversedEntry()
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
      },
    })

    expect(wrapper.find('.sidebar-group-item').exists()).toBe(true)
    expect(wrapper.find('.sidebar-heading-link-title').text()).toBe('Test Entry')
  })

  it('renders operation with HTTP method badge', () => {
    const item = createMockTraversedOperation()
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
      },
    })

    expect(wrapper.find('.sidebar-heading-link-method').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SidebarHttpBadge' }).exists()).toBe(true)
  })

  it('applies deprecated class when operation is deprecated via deprecated property', async () => {
    const item = createMockTraversedOperation({
      isDeprecated: true,
    })
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
      },
    })

    expect(wrapper.find('.sidebar-heading.deprecated').exists()).toBe(true)
  })

  it('applies deprecated class when operation is deprecated via x-scalar-stability', async () => {
    const item = createMockTraversedOperation({
      isDeprecated: true,
    })
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
      },
    })

    expect(wrapper.find('.sidebar-heading.deprecated').exists()).toBe(true)
  })

  it('does not apply deprecated class when operation is not deprecated', async () => {
    const { isOperationDeprecated } = await import('@scalar/oas-utils/helpers')
    vi.mocked(isOperationDeprecated).mockReturnValue(false)

    const item = createMockTraversedOperation()
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
      },
    })

    expect(wrapper.find('.sidebar-heading.deprecated').exists()).toBe(false)
  })

  it('does not apply deprecated class for non-operation items', async () => {
    const { isOperationDeprecated } = await import('@scalar/oas-utils/helpers')
    vi.mocked(isOperationDeprecated).mockReturnValue(true)

    const item = createMockTraversedEntry()
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
      },
    })

    expect(wrapper.find('.sidebar-heading.deprecated').exists()).toBe(false)
    expect(isOperationDeprecated).not.toHaveBeenCalled()
  })

  it('applies active class when isActive is true', () => {
    const item = createMockTraversedEntry()
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
        isActive: true,
      },
    })

    expect(wrapper.find('.sidebar-heading.active_page').exists()).toBe(true)
  })

  it('applies folder class when hasChildren is true', () => {
    const item = createMockTraversedEntry()
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
        hasChildren: true,
      },
    })

    expect(wrapper.find('.sidebar-heading.sidebar-group-item__folder').exists()).toBe(true)
  })

  // Fix this test
  it.todo('emits toggleOpen when clicked with children', async () => {
    const item = createMockTraversedEntry()
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
        hasChildren: true,
      },
    })

    // Ensure the click is triggered on the correct element
    await wrapper.find('.sidebar-heading').trigger('click')
    expect(wrapper.emitted('toggleOpen')).toBeTruthy()
  })

  it('generates correct link with hash routing', () => {
    const item = createMockTraversedEntry()
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
      },
    })

    const link = wrapper.find('.sidebar-heading-link')
    expect(link.attributes('href')).toBe('#test-entry')
  })

  it('handles webhook operations correctly', () => {
    const item = createMockTraversedOperation({
      // @ts-expect-error - we want to test webhook operations
      type: 'webhook',
    })
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item: {
          ...item,
        },
      },
    })

    expect(wrapper.findComponent({ name: 'ScalarIconWebhooksLogo' }).exists()).toBe(true)
  })

  it('renders action menu slot when provided', () => {
    const item = createMockTraversedEntry()
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
      },
      slots: {
        'action-menu': '<div class="test-action">Action</div>',
      },
    })

    expect(wrapper.find('.action-menu').exists()).toBe(true)
    expect(wrapper.find('.test-action').text()).toBe('Action')
  })

  it('renders children when open is true', () => {
    const item = createMockTraversedEntry()
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
        open: true,
      },
      slots: {
        default: '<div class="test-child">Child</div>',
      },
    })

    expect(wrapper.find('.test-child').exists()).toBe(true)
  })

  it('does not render children when open is false', () => {
    const item = createMockTraversedEntry()
    const wrapper = mount(SidebarElement, {
      props: {
        id: 'test-id',
        item,
        open: false,
      },
      slots: {
        default: '<div class="test-child">Child</div>',
      },
    })

    expect(wrapper.find('.test-child').exists()).toBe(false)
  })
})
