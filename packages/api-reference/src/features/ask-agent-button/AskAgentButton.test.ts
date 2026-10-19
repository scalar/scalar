import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

import { AGENT_CONTEXT_SYMBOL } from '@/hooks/use-agent'

import AskAgentButton from './AskAgentButton.vue'

describe('AskAgentButton', () => {
  it('prefills a question with the selected API context', async () => {
    const openAgent = vi.fn()
    const wrapper = mount(AskAgentButton, {
      props: { context: 'Events: AsyncAPI channel orders' },
      global: {
        provide: {
          [AGENT_CONTEXT_SYMBOL]: {
            openAgent,
            closeAgent: vi.fn(),
            toggleAgent: vi.fn(),
            showAgent: ref(false),
            prefilledMessage: ref(''),
            agentEnabled: computed(() => true),
          },
        },
      },
    })
    await wrapper.get('input').setValue('What messages arrive?')
    await wrapper.get('form').trigger('submit')
    expect(openAgent.mock.calls).toStrictEqual([['What messages arrive?\n\nContext: Events: AsyncAPI channel orders']])
    expect(wrapper.get('input').element.value).toBe('')
    wrapper.unmount()
  })
})
