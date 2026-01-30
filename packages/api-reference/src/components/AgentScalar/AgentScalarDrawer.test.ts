import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import AgentScalarDrawer from './AgentScalarDrawer.vue'

/** Creates mock props required by the component. */
function createMockProps() {
  return {
    agentScalarConfiguration: {
      enabled: true,
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

  it('closes drawer when backdrop is clicked', async () => {
    const onUpdateModelValue = vi.fn()

    const wrapper = mount(AgentScalarDrawer, {
      props: {
        ...createMockProps(),
        modelValue: true,
        'onUpdate:modelValue': onUpdateModelValue,
      },
      global: {
        stubs: {
          AgentScalarChatInterface: true,
        },
      },
      attachTo: document.body,
    })

    expect(wrapper.props('modelValue')).toBe(true)

    const backdrop = wrapper.find('.scalar-app-exit')
    expect(backdrop.isVisible()).toBe(true)

    await backdrop.trigger('click')
    await nextTick()
    expect(onUpdateModelValue).toHaveBeenCalledWith(false)

    wrapper.unmount()
  })
})
