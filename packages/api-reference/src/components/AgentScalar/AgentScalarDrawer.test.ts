import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import AgentScalarDrawer from './AgentScalarDrawer.vue'

/** Creates mock props required by the component. */
function createMockProps() {
  return {
    agentScalarConfiguration: {
      key: 'test-key',
    },
    workspaceStore: {} as any,
    eventBus: {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
  }
}

describe('AgentScalarDrawer', () => {
  it('renders drawer content when model is true', () => {
    const wrapper = mount(AgentScalarDrawer, {
      props: {
        ...createMockProps(),
        modelValue: true,
      },
      global: {
        stubs: {
          AgentScalarChatInterface: true,
        },
      },
    })

    const drawer = wrapper.find('.agent-scalar')
    expect(drawer.exists()).toBe(true)
    expect(drawer.isVisible()).toBe(true)
  })
})
