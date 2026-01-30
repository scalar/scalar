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
