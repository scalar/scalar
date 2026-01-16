import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import TestRequestButton from './TestRequestButton.vue'

/**
 * Creates a minimal mock event bus for testing.
 * We only implement the methods that TestRequestButton uses.
 */
const createMockEventBus = (): WorkspaceEventBus => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(() => null),
})

describe('TestRequestButton', () => {
  let mockEventBus: WorkspaceEventBus

  beforeEach(() => {
    vi.clearAllMocks()
    mockEventBus = createMockEventBus()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders button with correct text and icon when operation is provided', () => {
    const wrapper = mount(TestRequestButton, {
      props: {
        id: 'test-operation-1',
        method: 'get',
        path: '/test',
        eventBus: mockEventBus,
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Request')
    expect(wrapper.text()).toContain('(get /test)')
  })

  it('has correct button attributes', () => {
    const wrapper = mount(TestRequestButton, {
      props: {
        id: 'test-operation-2',
        method: 'post',
        path: '/users',
        eventBus: mockEventBus,
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('type')).toBe('button')
    // Some use this to style the button (e.g. nuxt-theme.css)
    expect(button.classes()).toContain('show-api-client-button')
  })

  it('emits ui:open:client-modal event with correct params when clicked', async () => {
    const wrapper = mount(TestRequestButton, {
      props: {
        id: 'test-operation-3',
        method: 'delete',
        path: '/users/1',
        eventBus: mockEventBus,
      },
    })

    await wrapper.find('button').trigger('click')

    expect(mockEventBus.emit).toHaveBeenCalledWith('ui:open:client-modal', {
      id: 'test-operation-3',
    })
  })
})
